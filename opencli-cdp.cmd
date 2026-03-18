@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ====================================================================
REM OpenCLI CDP 管理器 - 完善的 Chrome CDP 模式自动化脚本
REM 功能：自动检测/启动 Chrome CDP，运行 OpenCLI 命令
REM ====================================================================

set "SCRIPT_DIR=%~dp0"
set "CHROME_PORT=9222"
set "CHROME_CDP_URL=http://localhost:%CHROME_PORT%"
set "MAX_WAIT_SECONDS=30"

REM 查找 Chrome 路径
set "CHROME_PATH="
call :FindChrome
if not defined CHROME_PATH (
    echo [ERROR] 未找到 Chrome 浏览器
    echo 请手动设置 CHROME_PATH 环境变量指向 chrome.exe
    exit /b 1
)

REM 解析参数
if "%~1"=="" goto :ShowHelp
if /I "%~1"=="start" goto :StartChrome
if /I "%~1"=="stop" goto :StopChrome
if /I "%~1"=="status" goto :CheckStatus
if /I "%~1"=="run" goto :RunCommand
if /I "%~1"=="shell" goto :InteractiveShell
if /I "%~1"=="restart" goto :RestartChrome

REM 默认：直接运行命令（自动处理 Chrome）
goto :AutoRun

REM ====================================================================
REM 子程序：查找 Chrome 路径
REM ====================================================================
:FindChrome
if defined CHROME_PATH exit /b 0

set "CHROME_PATHS[0]=C:\Program Files\Google\Chrome\Application\chrome.exe"
set "CHROME_PATHS[1]=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
set "CHROME_PATHS[2]=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
set "CHROME_PATHS[3]=%USERPROFILE%\AppData\Local\Google\Chrome\Application\chrome.exe"

for /L %%i in (0,1,3) do (
    if exist "!CHROME_PATHS[%%i]!" (
        set "CHROME_PATH=!CHROME_PATHS[%%i]!"
        exit /b 0
    )
)

REM 尝试从注册表查找
for /f "tokens=2*" %%a in ('reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" /ve 2^>nul') do (
    if exist "%%b" (
        set "CHROME_PATH=%%b"
        exit /b 0
    )
)

exit /b 1

REM ====================================================================
REM 子程序：检查 Chrome CDP 是否运行
REM ====================================================================
:CheckChromeRunning
curl -s "%CHROME_CDP_URL%/json/version" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    exit /b 0
) else (
    exit /b 1
)

REM ====================================================================
REM 子程序：等待 Chrome 准备好
REM ====================================================================
:WaitForChrome
echo [INFO] 等待 Chrome CDP 准备就绪 (最多 %MAX_WAIT_SECONDS% 秒)...
for /L %%i in (1,1,%MAX_WAIT_SECONDS%) do (
    call :CheckChromeRunning
    if !ERRORLEVEL! EQU 0 (
        echo [INFO] Chrome CDP 已就绪
        exit /b 0
    )
    timeout /t 1 /nobreak >nul
    echo [INFO] 等待中... %%i/%MAX_WAIT_SECONDS%
)
echo [ERROR] Chrome CDP 启动超时
call :KillChrome
exit /b 1

REM ====================================================================
REM 子程序：启动 Chrome CDP
REM ====================================================================
:StartChrome
call :CheckChromeRunning
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Chrome CDP 已在运行 (%CHROME_CDP_URL%)
    exit /b 0
)

echo [INFO] 正在启动 Chrome (CDP 端口: %CHROME_PORT%)...

REM 创建用户数据目录
set "CDP_PROFILE=%TEMP%\opencli-chrome-profile"
if not exist "%CDP_PROFILE%" mkdir "%CDP_PROFILE%"

REM 启动 Chrome（后台运行）
start /B "" "%CHROME_PATH%" ^
    --remote-debugging-port=%CHROME_PORT% ^
    --user-data-dir="%CDP_PROFILE%" ^
    --no-first-run ^
    --no-default-browser-check ^
    --disable-default-apps ^
    --disable-extensions-except= ^
    --disable-background-networking ^
    --disable-sync ^
    --about:blank

echo [INFO] Chrome 进程已启动，PID: !ERRORLEVEL!
call :WaitForChrome
exit /b %ERRORLEVEL%

REM ====================================================================
REM 子程序：关闭 Chrome
REM ====================================================================
:StopChrome
echo [INFO] 正在关闭 Chrome...
call :KillChrome
echo [INFO] Chrome 已关闭
exit /b 0

:KillChrome
taskkill /F /IM chrome.exe /FI "WINDOWTITLE eq about:blank" >nul 2>&1
taskkill /F /IM chrome.exe >nul 2>&1
exit /b 0

REM ====================================================================
REM 子程序：检查状态
REM ====================================================================
:CheckStatus
echo ========================================
echo OpenCLI CDP 状态检查
echo ========================================
echo Chrome 路径: %CHROME_PATH%
echo CDP 端口: %CHROME_PORT%
echo CDP URL: %CHROME_CDP_URL%
echo.

call :CheckChromeRunning
if %ERRORLEVEL% EQU 0 (
    echo 状态: [运行中] ✅
    echo.
    echo Chrome 版本信息:
    curl -s "%CHROME_CDP_URL%/json/version" 2>nul | findstr "Browser"
) else (
    echo 状态: [未运行] ❌
)
echo ========================================
exit /b 0

REM ====================================================================
REM 子程序：重启 Chrome
REM ====================================================================
:RestartChrome
call :StopChrome
timeout /t 2 /nobreak >nul
call :StartChrome
exit /b %ERRORLEVEL%

REM ====================================================================
REM 子程序：运行 OpenCLI 命令
REM ====================================================================
:RunCommand
shift
echo [INFO] 运行命令: opencli %*
call :EnsureChrome
if %ERRORLEVEL% NEQ 0 exit /b 1

REM 设置环境变量并使用 opencli
set "OPENCLI_CDP_ENDPOINT=%CHROME_CDP_URL%"
opencli %*
exit /b %ERRORLEVEL%

REM ====================================================================
REM 子程序：自动运行（检测并启动 Chrome）
REM ====================================================================
:AutoRun
call :EnsureChrome
if %ERRORLEVEL% NEQ 0 exit /b 1

echo [INFO] 运行命令: opencli %*
set "OPENCLI_CDP_ENDPOINT=%CHROME_CDP_URL%"
opencli %*
exit /b %ERRORLEVEL%

REM ====================================================================
REM 子程序：确保 Chrome 运行
REM ====================================================================
:EnsureChrome
call :CheckChromeRunning
if %ERRORLEVEL% EQU 0 exit /b 0

echo [INFO] Chrome CDP 未运行，自动启动中...
call :StartChrome
exit /b %ERRORLEVEL%

REM ====================================================================
REM 子程序：交互式 Shell
REM ====================================================================
:InteractiveShell
call :EnsureChrome
if %ERRORLEVEL% NEQ 0 exit /b 1

echo.
echo ========================================
echo OpenCLI CDP 交互模式
echo Chrome CDP 已连接，可以连续运行命令
echo 输入 'exit' 退出，输入 'stop' 关闭 Chrome 并退出
echo ========================================
echo.

:ShellLoop
set /p CMD="opencli> "
if /I "%CMD%"=="exit" goto :ShellExit
if /I "%CMD%"=="quit" goto :ShellExit
if /I "%CMD%"=="stop" goto :ShellStop
if /I "%CMD%"=="status" goto :ShellStatus
if "%CMD%"=="" goto :ShellLoop

REM 运行命令
set "OPENCLI_CDP_ENDPOINT=%CHROME_CDP_URL%"
opencli %CMD%
echo.
goto :ShellLoop

:ShellStatus
call :CheckStatus
echo.
goto :ShellLoop

:ShellExit
echo [INFO] 退出交互模式（Chrome 保持运行）
exit /b 0

:ShellStop
echo [INFO] 关闭 Chrome 并退出
call :StopChrome
exit /b 0

REM ====================================================================
REM 帮助信息
REM ====================================================================
:ShowHelp
echo.
echo OpenCLI CDP 管理器 - 自动化 Chrome CDP 模式
echo.
echo 用法:
echo   opencli-cdp.cmd [命令] [参数...]
echo.
echo 命令:
echo   start              启动 Chrome CDP 模式
echo   stop               关闭 Chrome
echo   restart            重启 Chrome
echo   status             查看 Chrome CDP 状态
echo   shell              进入交互模式（可连续运行多个命令）
echo   run ^<args^>        运行 OpenCLI 命令（确保 Chrome 运行）
echo   [args...]          直接运行 OpenCLI 命令（自动启动 Chrome）
echo.
echo 示例:
echo   opencli-cdp.cmd start                    启动 Chrome
echo   opencli-cdp.cmd status                   检查状态
echo   opencli-cdp.cmd mwr-gov hot --limit 5    运行命令（自动启动 Chrome）
echo   opencli-cdp.cmd shell                    进入交互模式
echo   opencli-cdp.cmd stop                     关闭 Chrome
echo.
echo 环境变量:
echo   CHROME_PATH        指定 Chrome 路径（可选）
echo   CHROME_PORT        指定 CDP 端口（默认: 9222）
echo.
exit /b 0

@echo off
chcp 65001 >nul
REM 启动 Chrome 并开启 CDP 调试端口，然后运行 OpenCLI

echo Starting Chrome with remote debugging port 9222...

REM 查找 Chrome 路径
set CHROME_PATH=

REM 尝试常见路径
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
)

if not defined CHROME_PATH (
    echo ERROR: Chrome not found!
    echo Please manually start Chrome with: --remote-debugging-port=9222
    pause
    exit /b 1
)

REM 检查是否已有 Chrome 在运行
tasklist | findstr "chrome.exe" >nul
if %ERRORLEVEL% EQU 0 (
    echo Chrome is already running.
    echo Please close all Chrome windows first, or use the running Chrome with CDP enabled.
    pause
)

echo Starting Chrome with CDP enabled...
start "" %CHROME_PATH% --remote-debugging-port=9222 --user-data-dir=%TEMP%\chrome-cdp-profile

echo Waiting for Chrome to start...
timeout /t 3 /nobreak >nul

echo.
echo Chrome is ready! You can now run opencli commands without clicking 'Connect'.
echo.
echo Example: opencli mwr-gov hot --limit 5
pause

@echo off
chcp 65001 >nul
REM OpenCLI 快捷启动脚本 - 自动使用 CDP 模式

REM 检查 Chrome 是否已在 9222 端口运行
curl -s http://localhost:9222/json/version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Chrome CDP mode not detected. Starting Chrome with CDP...
    call "%~dp0start-chrome-cdp.bat"
    timeout /t 5 /nobreak >nul
)

REM 运行 opencli 命令
echo Running: opencli %*
opencli %*

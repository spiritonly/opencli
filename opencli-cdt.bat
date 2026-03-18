@echo off
chcp 65001 >nul
REM OpenCLI 启动脚本 - 使用 Chrome DevTools MCP (Chrome 146+ 原生支持)
REM 无需手动点击 Connect！

cd /d "%~dp0"

REM 使用 chrome-devtools-mcp
set OPENCLI_USE_CHROME_DEVTOOLS_MCP=1

REM 运行 opencli 命令
opencli %*

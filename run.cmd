@echo off
chcp 65001 >nul
REM 一键启动 OpenCLI CDP 环境并运行命令

cd /d "%~dp0"

REM 检查是否有命令参数
if "%~1"=="" (
    echo 用法: run.cmd ^<opencli 命令^>
    echo 示例: run.cmd mwr-gov hot --limit 5
    pause
    exit /b 1
)

REM 使用 opencli-cdp.cmd 运行命令（会自动启动 Chrome）
call opencli-cdp.cmd %*

pause

@echo off
REM OpenCLI 快捷命令 - 自动使用 CDP 模式运行 opencli
REM 用法: 直接运行 opencli 命令，例如: opencli.bat mwr-gov hot --limit 5

call "%~dp0opencli-cdp.cmd" %*

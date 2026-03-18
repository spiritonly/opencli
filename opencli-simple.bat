@echo off
REM OpenCLI 简化启动脚本 - 使用 Chrome 146+ Remote Debugging

REM 设置 CDP 端点（Chrome 146+ 默认开启 remote debugging 后）
set "OPENCLI_CDP_ENDPOINT=http://localhost:9222"

REM 直接运行 opencli 命令
opencli %*

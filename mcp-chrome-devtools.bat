@echo off
REM OpenCLI 包装器 - 使用 chrome-devtools-mcp
REM 将 OPENCLI_MCP_SERVER_PATH 指向此文件

cd /d "%~dp0"
npx -y chrome-devtools-mcp@latest --autoConnect

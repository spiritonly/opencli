#requires -Version 5.1
<#
.SYNOPSIS
    OpenCLI CDP 管理器 - PowerShell 版本
.DESCRIPTION
    自动管理 Chrome CDP 模式，支持启动、停止、状态检查和运行 OpenCLI 命令
.EXAMPLE
    .\opencli-cdp.ps1 start                    # 启动 Chrome CDP
    .\opencli-cdp.ps1 status                   # 检查状态
    .\opencli-cdp.ps1 mwr-gov hot --limit 5    # 运行命令
    .\opencli-cdp.ps1 shell                    # 交互模式
    .\opencli-cdp.ps1 stop                     # 关闭 Chrome
#>

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$Command,

    [Parameter(Position = 1, ValueFromRemainingArguments = $true)]
    [string[]]$Arguments,

    [int]$Port = 9222,
    [int]$MaxWaitSeconds = 30
)

$ErrorActionPreference = "Stop"

# 配置
$script:ChromePort = $Port
$script:CdpUrl = "http://localhost:$Port"
$script:ChromePath = $null

# 查找 Chrome 路径
function Find-ChromePath {
    if ($env:CHROME_PATH -and (Test-Path $env:CHROME_PATH)) {
        return $env:CHROME_PATH
    }

    $paths = @(
        "C:\Program Files\Google\Chrome\Application\chrome.exe"
        "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
        "$env:USERPROFILE\AppData\Local\Google\Chrome\Application\chrome.exe"
    )

    foreach ($path in $paths) {
        if (Test-Path $path) {
            return $path
        }
    }

    # 尝试注册表
    try {
        $regPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe"
        $regValue = Get-ItemProperty -Path $regPath -ErrorAction SilentlyContinue
        if ($regValue -and (Test-Path $regValue.'(Default)')) {
            return $regValue.'(Default)'
        }
    }
    catch {}

    throw "未找到 Chrome 浏览器，请设置 CHROME_PATH 环境变量"
}

# 检查 Chrome 是否运行
function Test-ChromeRunning {
    try {
        $response = Invoke-RestMethod -Uri "$script:CdpUrl/json/version" -TimeoutSec 2 -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

# 等待 Chrome 就绪
function Wait-ForChrome {
    Write-Host "[INFO] 等待 Chrome CDP 准备就绪 (最多 $MaxWaitSeconds 秒)..." -ForegroundColor Cyan

    for ($i = 1; $i -le $MaxWaitSeconds; $i++) {
        if (Test-ChromeRunning) {
            Write-Host "[INFO] Chrome CDP 已就绪" -ForegroundColor Green
            return $true
        }
        Write-Host "[INFO] 等待中... $i/$MaxWaitSeconds" -ForegroundColor Yellow
        Start-Sleep -Seconds 1
    }

    throw "Chrome CDP 启动超时"
}

# 启动 Chrome CDP
function Start-ChromeCdp {
    if (Test-ChromeRunning) {
        Write-Host "[INFO] Chrome CDP 已在运行 ($script:CdpUrl)" -ForegroundColor Green
        return
    }

    Write-Host "[INFO] 正在启动 Chrome (CDP 端口: $script:ChromePort)..." -ForegroundColor Cyan

    $script:ChromePath = Find-ChromePath
    $profileDir = "$env:TEMP\opencli-chrome-profile"

    if (-not (Test-Path $profileDir)) {
        New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
    }

    $chromeArgs = @(
        "--remote-debugging-port=$script:ChromePort"
        "--user-data-dir=$profileDir"
        "--no-first-run"
        "--no-default-browser-check"
        "--disable-default-apps"
        "--disable-background-networking"
        "--disable-sync"
        "about:blank"
    )

    Start-Process -FilePath $script:ChromePath -ArgumentList $chromeArgs -WindowStyle Hidden

    Wait-ForChrome | Out-Null
}

# 停止 Chrome
function Stop-ChromeCdp {
    Write-Host "[INFO] 正在关闭 Chrome..." -ForegroundColor Cyan

    Get-Process -Name "chrome" -ErrorAction SilentlyContinue |
        Where-Object { $_.MainWindowTitle -eq "about:blank" -or $_.MainWindowTitle -eq "" } |
        Stop-Process -Force -ErrorAction SilentlyContinue

    Start-Sleep -Seconds 2
    Write-Host "[INFO] Chrome 已关闭" -ForegroundColor Green
}

# 检查状态
function Show-Status {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "OpenCLI CDP 状态检查"
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Chrome 路径: $(Find-ChromePath)"
    Write-Host "CDP 端口: $script:ChromePort"
    Write-Host "CDP URL: $script:CdpUrl"
    Write-Host ""

    if (Test-ChromeRunning) {
        Write-Host "状态: [运行中] ✅" -ForegroundColor Green
        Write-Host ""
        try {
            $version = Invoke-RestMethod -Uri "$script:CdpUrl/json/version" -TimeoutSec 5
            Write-Host "Chrome 版本: $($version.Browser)"
            Write-Host "协议版本: $($version['Protocol-Version'])"
        }
        catch {
            Write-Host "无法获取版本信息" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "状态: [未运行] ❌" -ForegroundColor Red
    }

    Write-Host "========================================" -ForegroundColor Cyan
}

# 运行 OpenCLI 命令
function Invoke-OpenCliCommand {
    param([string[]]$OpenCliArgs)

    Start-ChromeCdp

    Write-Host "[INFO] 运行命令: opencli $OpenCliArgs" -ForegroundColor Cyan

    $env:OPENCLI_CDP_ENDPOINT = $script:CdpUrl
    & opencli $OpenCliArgs
}

# 交互式 Shell
function Start-InteractiveShell {
    Start-ChromeCdp

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "OpenCLI CDP 交互模式"
    Write-Host "Chrome CDP 已连接，可以连续运行命令"
    Write-Host "输入 'exit' 退出，输入 'stop' 关闭 Chrome 并退出"
    Write-Host "输入 'status' 查看状态"
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""

    while ($true) {
        $input = Read-Host -Prompt "opencli>"

        switch ($input.ToLower()) {
            "exit" { Write-Host "[INFO] 退出交互模式（Chrome 保持运行）"; return }
            "quit" { Write-Host "[INFO] 退出交互模式（Chrome 保持运行）"; return }
            "stop" { Stop-ChromeCdp; return }
            "status" { Show-Status; continue }
            "" { continue }
        }

        $env:OPENCLI_CDP_ENDPOINT = $script:CdpUrl
        & opencli $input.Split(" ")
        Write-Host ""
    }
}

# 显示帮助
function Show-Help {
    Write-Host ""
    Write-Host "OpenCLI CDP 管理器 - PowerShell 版本" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "用法:" -ForegroundColor Yellow
    Write-Host "  .\opencli-cdp.ps1 [命令] [参数...]"
    Write-Host ""
    Write-Host "命令:" -ForegroundColor Yellow
    Write-Host "  start              启动 Chrome CDP 模式"
    Write-Host "  stop               关闭 Chrome"
    Write-Host "  restart            重启 Chrome"
    Write-Host "  status             查看 Chrome CDP 状态"
    Write-Host "  shell              进入交互模式"
    Write-Host "  [args...]          直接运行 OpenCLI 命令（自动启动 Chrome）"
    Write-Host ""
    Write-Host "示例:" -ForegroundColor Yellow
    Write-Host "  .\opencli-cdp.ps1 start"
    Write-Host "  .\opencli-cdp.ps1 mwr-gov hot --limit 5"
    Write-Host "  .\opencli-cdp.ps1 shell"
    Write-Host ""
    Write-Host "环境变量:" -ForegroundColor Yellow
    Write-Host "  CHROME_PATH        指定 Chrome 路径（可选）"
    Write-Host "  CHROME_PORT        指定 CDP 端口（默认: 9222）"
    Write-Host ""
}

# 主逻辑
switch ($Command.ToLower()) {
    "start" { Start-ChromeCdp }
    "stop" { Stop-ChromeCdp }
    "restart" { Stop-ChromeCdp; Start-Sleep -Seconds 2; Start-ChromeCdp }
    "status" { Show-Status }
    "shell" { Start-InteractiveShell }
    "help" { Show-Help }
    "" { Show-Help }
    default {
        # 直接运行 OpenCLI 命令
        $allArgs = @($Command) + $Arguments
        Invoke-OpenCliCommand -OpenCliArgs $allArgs
    }
}

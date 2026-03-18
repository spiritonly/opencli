# OpenCLI Chrome DevTools MCP 使用指南

针对 Chrome 146+ 的原生 DevTools MCP 支持。

## 前提条件

1. **Chrome 版本**: 146 或更高
2. **开启 MCP**: 在 Chrome 地址栏输入 `chrome://flags`，启用 `Enable Chrome DevTools MCP` 实验性功能
3. **重启 Chrome**

## 快速使用

### 方案 1：使用 chrome-devtools-mcp（推荐）

这是最简单的方式，**无需手动点击 Connect**。

```bash
# 方式 1: 使用提供的脚本
opencli-cdt.bat mwr-gov hot --limit 5

# 方式 2: 设置环境变量后直接使用 opencli
set OPENCLI_USE_CHROME_DEVTOOLS_MCP=1
opencli mwr-gov hot --limit 5
```

### 方案 2：使用 CDP 模式（备用）

如果 chrome-devtools-mcp 遇到问题，可以使用 CDP 模式。

```bash
# 启动 Chrome 并开启 Remote Debugging
chrome.exe --remote-debugging-port=9222

# 然后运行 opencli
set OPENCLI_CDP_ENDPOINT=http://localhost:9222
opencli mwr-gov hot --limit 5
```

## 对比

| 模式 | 需要点击 Connect | 需要启动参数 | 稳定性 |
|------|-----------------|-------------|--------|
| `chrome-devtools-mcp` | ❌ 不需要 | ❌ 不需要 | ⭐⭐⭐⭐⭐ |
| `CDP` | ❌ 不需要 | ✅ 需要 | ⭐⭐⭐⭐ |
| `Extension` | ✅ 需要 | ❌ 不需要 | ⭐⭐⭐ |

## 自动化脚本示例

### 批量获取数据（无需点击）

```batch
@echo off
REM 使用 chrome-devtools-mcp 批量获取数据

set CDT=D:\code\opencli\opencli-cdt.bat

%CDT% mwr-gov hot --limit 10 -f json > hot.json
%CDT% mwr-gov news --type szyw --limit 5 -f json > szyw.json
%CDT% mwr-gov news --type tzgg --limit 5 -f json > tzgg.json

echo 完成！
```

## 故障排查

### "chrome-devtools-mcp not found"

确保网络连接正常，npx 会自动下载。

### Chrome 连接失败

1. 检查 Chrome 版本是否 >= 146
2. 检查 `chrome://flags` 中是否启用了 DevTools MCP
3. 重启 Chrome

### 与 Claude 桌面应用的冲突

Claude 桌面应用和 OpenCLI 可以同时使用 `chrome-devtools-mcp`，它们会共享同一个 Chrome 实例。

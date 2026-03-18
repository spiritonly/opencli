# OpenCLI CDP 自动化脚本

用于频繁使用和自动化脚本的 Chrome CDP 模式管理工具。

## 特点

- ✅ **自动检测**：自动检测 Chrome 是否已在 CDP 模式运行
- ✅ **自动启动**：未运行时自动启动 Chrome 并开启 CDP 端口
- ✅ **等待就绪**：自动等待 Chrome 准备好再执行命令
- ✅ **交互模式**：支持连续运行多个命令
- ✅ **多种格式**：支持 CMD 和 PowerShell

## 文件说明

| 文件 | 用途 |
|------|------|
| `opencli-cdp.cmd` | 主脚本（CMD 版本，功能最全） |
| `opencli-cdp.ps1` | PowerShell 版本（功能最全） |
| `opencli.bat` | 快捷脚本，直接运行 opencli 命令 |

## 快速开始

### 1. 启动 Chrome CDP 模式

```bash
# CMD
opencli-cdp.cmd start

# PowerShell
.\opencli-cdp.ps1 start
```

### 2. 运行 OpenCLI 命令

```bash
# 直接运行命令（自动启动 Chrome）
opencli-cdp.cmd mwr-gov hot --limit 5
opencli-cdp.cmd mwr-gov news --type szyw --limit 10

# 或者使用快捷方式
opencli.bat mwr-gov hot --limit 5
```

### 3. 交互模式（连续运行多个命令）

```bash
opencli-cdp.cmd shell

# 进入交互模式后可以连续输入命令：
opencli> mwr-gov hot --limit 5
opencli> mwr-gov news --type tzgg --limit 3
opencli> status
opencli> stop  # 关闭 Chrome 并退出
```

### 4. 关闭 Chrome

```bash
opencli-cdp.cmd stop
```

## 常用命令速查

```bash
# 查看状态
opencli-cdp.cmd status

# 重启 Chrome
opencli-cdp.cmd restart

# 运行命令（自动处理 Chrome）
opencli-cdp.cmd <site> <command> [args...]

# 交互模式
opencli-cdp.cmd shell
```

## 自动化脚本示例

### 批量获取数据

```batch
@echo off
REM 批量获取水利部数据

set CDP_SCRIPT=D:\code\opencli\opencli-cdp.cmd

%CDP_SCRIPT% mwr-gov hot --limit 10 > hot-news.json
%CDP_SCRIPT% mwr-gov news --type szyw --limit 5 > szyw-news.json
%CDP_SCRIPT% mwr-gov news --type tzgg --limit 5 > tzgg-news.json

echo 数据获取完成
```

### PowerShell 自动化

```powershell
# 定义要获取的数据类型
$types = @('slyw', 'szyw', 'tzgg', 'sjzs')

foreach ($type in $types) {
    Write-Host "正在获取 $type 类型新闻..."
    .\opencli-cdp.ps1 mwr-gov news --type $type --limit 10 |
        Out-File -FilePath "news-$type.json" -Encoding UTF8
}

Write-Host "所有数据获取完成"
```

### Python 调用示例

```python
import subprocess
import json

def run_opencli(command_args):
    """运行 OpenCLI 命令并返回结果"""
    cmd = ['D:\\code\\opencli\\opencli-cdp.cmd'] + command_args
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout

# 获取水利要闻
output = run_opencli(['mwr-gov', 'hot', '--limit', '5'])
print(output)

# 获取 JSON 格式
def get_json(site, command, **kwargs):
    args = [site, command, '-f', 'json']
    for k, v in kwargs.items():
        args.extend([f'--{k}', str(v)])
    output = run_opencli(args)
    return json.loads(output)

data = get_json('mwr-gov', 'hot', limit=5)
for item in data:
    print(f"{item['date']}: {item['title']}")
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `CHROME_PATH` | Chrome 可执行文件路径 | 自动查找 |
| `CHROME_PORT` | CDP 调试端口 | 9222 |

### 设置环境变量示例

```powershell
# PowerShell
$env:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$env:CHROME_PORT = "9223"

# 永久设置（用户级别）
[Environment]::SetEnvironmentVariable("CHROME_PORT", "9223", "User")
```

## 故障排查

### Chrome 未找到

```
[ERROR] 未找到 Chrome 浏览器
```

**解决**：设置 `CHROME_PATH` 环境变量

### Chrome 启动超时

```
[ERROR] Chrome CDP 启动超时
```

**解决**：
1. 检查是否有其他 Chrome 进程占用端口
2. 手动关闭所有 Chrome 窗口后重试
3. 更换端口：`opencli-cdp.cmd -Port 9223 start`

### 端口被占用

```
[ERROR] 端口 9222 已被占用
```

**解决**：
```bash
# 查找占用端口的进程
netstat -ano | findstr 9222

# 或者更换端口
$env:CHROME_PORT = "9223"
opencli-cdp.cmd start
```

## 添加到系统 PATH（推荐）

将 `D:\code\opencli` 添加到系统 PATH，然后可以直接使用：

```bash
opencli-cdp mwr-gov hot --limit 5
```

### 设置方法

1. 右键"此电脑" → 属性 → 高级系统设置
2. 环境变量 → 系统变量 → Path → 编辑
3. 新建 → 输入 `D:\code\opencli` → 确定

## 与 IDE 集成

### VS Code 任务

创建 `.vscode/tasks.json`：

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "OpenCLI: mwr-gov hot",
      "type": "shell",
      "command": "${workspaceFolder}/opencli-cdp.cmd",
      "args": ["mwr-gov", "hot", "--limit", "5"],
      "group": "build"
    }
  ]
}
```

### JetBrains 外部工具

Settings → Tools → External Tools → Add

- **Name**: OpenCLI mwr-gov hot
- **Program**: `D:\code\opencli\opencli-cdp.cmd`
- **Arguments**: `mwr-gov hot --limit 5`
- **Working directory**: `D:\code\opencli`

## 高级用法

### 定时任务（Windows Task Scheduler）

```powershell
# 创建定时任务，每小时获取一次新闻
$action = New-ScheduledTaskAction -Execute "D:\code\opencli\opencli-cdp.cmd" `
    -Argument "mwr-gov hot --limit 10 -f json > D:\\data\\mwr-news.json"

$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1)

Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "MWR-News-Collector" -Description "定时获取水利部新闻"
```

## 更新日志

- 2026-03-18: 初始版本，支持 CDP 自动化

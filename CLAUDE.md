# CLAUDE.md - OpenCLI

## 项目概述

将任何网站变成 CLI 的工具 — 支持 Bilibili、Zhihu、Twitter/X 等 19 个网站，80+ 命令。基于浏览器会话复用和 AI-native 发现。

**Fork 信息**: 本项目 fork 自 [jackwener/opencli](https://github.com/jackwener/opencli)，添加了山脉科技内部适配器（通过 Git 子模块 `src/internal/`）。

## 技术栈

- TypeScript / Node.js >= 18
- Playwright MCP Bridge（浏览器自动化）
- YAML + TypeScript 双引擎架构
- Vitest（测试）

## 核心架构

### 命令注册模式
```typescript
// 通过 cli() 函数自动注册
import { cli, Strategy } from './registry.js';

cli({
  site: 'example',
  name: 'command',
  strategy: Strategy.COOKIE, // PUBLIC | COOKIE | HEADER
  args: [{ name: 'limit', type: 'int', default: 10 }],
  func: async (page, kwargs) => { /* ... */ }
});
```

### 动态加载
- `.ts` 或 `.yaml` 放入 `src/clis/` 自动注册
- **内部 CLI**: 通过 Git 子模块 `src/internal/`（summit-opencli-internal）加载
  - 子模块不存在时静默跳过（公开 fork 友好）
  - 设置 `OPENCLI_SKIP_INTERNAL=1` 可禁用内部 CLI 加载
- 子模块更新：`git submodule update --init --recursive`

### 浏览器连接
- **默认**: Playwright MCP Bridge Extension（需安装 Chrome 扩展）
- **CDP 模式**: 远程 Chrome（服务器/无头环境）
- Token 通过 `opencli setup` 自动发现

## 关键文件

```
src/
├── main.ts              # 入口
├── registry.ts          # 命令注册
├── engine.ts            # YAML/TS 执行引擎
├── browser/             # 浏览器自动化
├── pipeline/            # 数据处理管道
├── clis/                # 网站适配器（20+ 站点）
└── internal-loader.ts   # 内部 CLI 子模块加载
```

## 常用命令

```bash
# 开发
npm run build
npm run watch

# CLI 使用
opencli setup                    # 配置 Playwright MCP Token
opencli list                     # 查看所有命令
opencli doctor                   # 诊断配置
opencli explore <url> --site x   # 探索网站 API
opencli synthesize x             # 生成适配器

# 测试
npx vitest run src/              # 单元测试
npx vitest run tests/e2e/        # E2E 测试
```

## AI Agent 工作流

1. **explore**: 发现 API、推断能力、检测框架
2. **synthesize**: 从探索产物生成 YAML 适配器
3. **generate**: 一键探索 → 合成 → 注册
4. **cascade**: 自动探测认证策略（PUBLIC → COOKIE → HEADER）

输出目录: `.opencli/explore/<site>/`

## 认证策略

- `Strategy.PUBLIC`: 公开 API，无需认证
- `Strategy.COOKIE`: 复用 Chrome 登录态（默认）
- `Strategy.HEADER`: 需自定义 Header

## 注意事项

1. 浏览器命令复用 Chrome 登录态，需先在浏览器中登录目标网站
2. 内部 CLI 通过 `OPENCLI_SKIP_INTERNAL=1` 可禁用
3. CDP 模式用于无法安装扩展的环境（远程服务器）
4. Token 存储在 `.opencli/config.json`，勿提交到 Git

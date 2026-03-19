# 河北省水文资料在线整汇编系统 OpenCLI 适配器

## 系统信息

| 项目 | 内容 |
|------|------|
| 系统名称 | 河北省雨水情监测预报业务平台 - 水文资料在线整汇编系统 |
| 访问地址 | http://10.243.45.152/ |
| API基础路径 | /prod-api/ |
| 认证方式 | JWT Token (localStorage: Admin-Token) + ClientID |

## 已实现的命令

### 1. overview - 整编概览（完成率统计）

获取水文整编完成率统计数据，支持省、市、队三级层级展示。

**使用示例：**

```bash
# 默认查询前一天（日清月结）
opencli hydra overview

# 查询指定日期范围
opencli hydra overview --start 2025-03-01 --end 2025-03-31

# 限制返回数量
opencli hydra overview --limit 20

# 按层级筛选（1=省级, 2=省市, 3=省市队）
opencli hydra overview --level 2

# 导出JSON格式
opencli hydra overview --format json --limit 50
```

**参数说明：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `--start` | string | 昨天 | 开始日期 (YYYY-MM-DD) |
| `--end` | string | 昨天 | 结束日期 (YYYY-MM-DD) |
| `--type` | string | 日清月结 | 统计方法 |
| `--stcd` | string | "" | 测站编码 |
| `--limit` | int | 50 | 返回记录数 |
| `--level` | int | 3 | 显示层级 (1=省, 2=省市, 3=省市队) |
| `--debug` | bool | false | 调试模式 |

**输出字段：**

- `unit`: 单位名称
- `total_stations`: 总站数
- `water_level_stations`: 水位站数
- `water_level_completion`: 水位完成率
- `discharge_stations`: 流量站数
- `discharge_completion`: 流量完成率
- `evaporation_stations`: 蒸发站数
- `evaporation_completion`: 蒸发完成率
- `sediment_stations`: 输沙率站数
- `sediment_completion`: 输沙率完成率
- `sand_concentration_stations`: 含沙量站数
- `sand_concentration_completion`: 含沙量完成率
- `precipitation_stations`: 降水站数
- `precipitation_completion`: 降水完成率

### 2. actual-measurement - 实测数据统计

获取实测流量、输沙率、单沙测次统计。

```bash
opencli hydra actual-measurement --stcd 03100001
```

### 3. water-level - 水位数据

获取整编水位数据列表。

```bash
opencli hydra water-level --stcd 03100001 --limit 100
```

### 4. stations - 测站列表

获取所有可用测站列表。

```bash
opencli hydra stations
```

## 技术实现说明

### 认证机制

系统使用双重认证：
1. **JWT Token**: 从 localStorage 获取 `Admin-Token`
2. **ClientID**: 从 JWT payload 中解析 `clientid` 字段

请求头格式：
```
Authorization: Bearer <token>
clientid: <clientid>
```

### API端点

| 功能 | 端点 | 参数 |
|------|------|------|
| 整编完成率统计 | `/business/index/statistic/reorganizeIndexCompletion` | startDt, endDt, type, stcd |
| 实测数据统计 | `/business/index/statistic/actualMeasurement` | stcd, yr |
| 水位数据列表 | `/business/compileData/riverStationData/baZ0g09B/list` | stcd, yr |
| 测站列表 | `/system/auth/getIndexGraphStList` | yr |

### 数据结构

API返回树形结构数据：
```
data
├── id: 5
├── name: "河北省水文勘测研究中心"
├── statInfo: {...}
└── children: [
    {
        name: "石家庄水文勘测研究中心",
        statInfo: {...},
        children: [
            { name: "平山水文勘测队", statInfo: {...} },
            { name: "石南水文勘测队", statInfo: {...} },
            ...
        ]
    },
    ...
]
```

## 测站编码示例

| 测站编码 | 测站名称 |
|----------|----------|
| 03100001 | 邯郸竞赛站1 |
| 03150001 | 唐山竞赛站1 |

## 统计方法

- `日清月结` - 默认
- `按日统计`
- `按旬统计`
- `按月统计`

## 使用建议

1. **日期选择**：由于采用"日清月结"模式，建议查询前一天的数据以获得完整统计
2. **层级选择**：根据需求选择展示层级，减少不必要的数据量
3. **筛选条件**：可结合 `--stcd` 参数查询特定测站的数据

## 待完善功能

- [ ] 导出Excel功能
- [ ] 更多数据类型（流量、含沙量、降水等）
- [ ] 图表数据可视化
- [ ] 综合整编、成果一览等模块

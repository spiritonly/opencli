# 河北省水文资料在线整汇编系统 OpenCLI 适配器

## 系统信息

| 项目 | 内容 |
|------|------|
| 系统名称 | 河北省雨水情监测预报业务平台 - 水文资料在线整汇编系统 |
| 访问地址 | http://10.243.45.152/ |
| API基础路径 | /prod-api/ |
| 认证方式 | JWT Token (localStorage: Admin-Token) + ClientID |

## 命令使用指南

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

### 2. stations - 测站列表

获取所有可用测站列表。

**使用示例：**

```bash
# 获取默认年份(2026)的测站列表
opencli hydra stations

# 获取指定年份的测站列表
opencli hydra stations --year 2025

# 限制返回数量
opencli hydra stations --limit 20

# 导出CSV格式
opencli hydra stations --format csv
```

**参数说明：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `--year` | int | 2026 | 年份 |
| `--limit` | int | 500 | 返回记录数限制 |
| `--debug` | bool | false | 调试模式 |

**输出字段：**

- `stcd`: 测站编码
- `stnm`: 测站名称

### 3. actual-measurement - 实测数据统计

获取实测流量、输沙率、单沙测次统计。

**使用示例：**

```bash
# 查询默认测站的实测数据
opencli hydra actual-measurement

# 查询指定测站
opencli hydra actual-measurement --stcd 03150001

# 查询指定年份
opencli hydra actual-measurement --stcd 03150001 --year 2025
```

**参数说明：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `--stcd` | string | 03100001 | 测站编码 |
| `--year` | int | 2026 | 年份 |
| `--debug` | bool | false | 调试模式 |

**输出字段：**

- `station`: 测站编码
- `station_name`: 测站名称
- `discharge_count`: 实测流量测次
- `sediment_rate_count`: 实测输沙率测次
- `sand_sample_count`: 实测单沙测次

### 4. water-level - 水位数据

获取整编水位数据列表。

**使用示例：**

```bash
# 查询默认测站的水位数据
opencli hydra water-level

# 查询指定测站
opencli hydra water-level --stcd 03150001

# 查询指定年份并限制数量
opencli hydra water-level --stcd 03150001 --year 2026 --limit 10

# 导出JSON格式
opencli hydra water-level --stcd 03150001 --format json --limit 100
```

**参数说明：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `--stcd` | string | 03100001 | 测站编码 |
| `--year` | int | 2026 | 年份 |
| `--limit` | int | 100 | 返回记录数限制 |
| `--debug` | bool | false | 调试模式 |

**输出字段：**

- `index`: 序号
- `full_time`: 完整时间
- `full_water_level`: 完整水位
- `time`: 时间
- `water_level`: 水位

## 常用测站编码

| 测站编码 | 测站名称 |
|----------|----------|
| 03100001 | 邯郸竞赛站1 |
| 03150001 | 唐山竞赛站1 |
| 03190001 | 邢台竞赛站1 |
| 03300001 | 省中心竞赛站1 |

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

#### overview - 树形结构
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
            ...
        ]
    },
    ...
]
```

#### actual-measurement
```json
{
  "q": 325,    // 实测流量测次
  "qs": 0,     // 实测输沙率测次
  "s": 23,     // 实测单沙测次
  "cs": 0,     // 含沙量测次
  "tyz": 0     // 推移质测次
}
```

#### water-level
```json
{
  "dt": "2026-01-01 00:00:00",  // 完整时间
  "szz": "1.84",                  // 完整水位
  "ztime": "10100",               // 时间
  "zz": "1.84"                    // 水位
}
```

## 使用建议

1. **日期选择**：由于采用"日清月结"模式，建议查询前一天的数据以获得完整统计
2. **层级选择**：根据需求选择展示层级，减少不必要的数据量
3. **先查测站**：使用 `stations` 命令获取可用测站编码，再查询具体数据
4. **调试模式**：遇到问题时使用 `--debug true` 查看原始API响应

## 常见问题

### Q: actual-measurement 返回 0？
A: 检查测站编码是否正确，使用 `stations` 命令查看可用测站。

### Q: water-level 返回空数据？
A: 尝试不同年份（2025或2026），部分测站可能只有特定年份的数据。

### Q: 如何导出Excel？
A: 使用 `--format csv` 导出CSV格式，然后用Excel打开。

## 待完善功能

- [ ] 导出Excel功能
- [ ] 更多数据类型（流量、含沙量、降水等）
- [ ] 图表数据可视化
- [ ] 综合整编、成果一览等模块

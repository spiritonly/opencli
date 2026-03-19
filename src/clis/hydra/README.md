# 河北省水文资料在线整汇编系统 OpenCLI 适配器

## 系统信息
- 系统名称: 河北省雨水情监测预报业务平台 - 水文资料在线整汇编系统
- 访问地址: http://10.243.45.152/
- API基础路径: /prod-api/

## 已发现的API端点

### 1. 整编概览相关
- `GET /business/index/statistic/reorganizeIndexCompletion` - 整编完成率统计
  - 参数: startDt, endDt, type, stcd
- `GET /business/index/statistic/actualMeasurement` - 实测数据统计
  - 参数: stcd, yr
- `GET /business/index/statistic/reorganizeGraph` - 整编图表数据
  - 参数: yr
- `GET /business/index/statistic/zqGraph` - 雨情图表数据
  - 参数: stcd, yr, data[]

### 2. 数据整编相关
- `GET /business/compileData/riverStationData/baZ0g09B/list` - 水位数据列表 (baZ0g09B = 水位Z0G09)
  - 参数: stcd, yr

### 3. 系统认证相关
- `GET /system/auth/getInfo` - 获取用户信息
  - 参数: year, stcd
- `GET /system/auth/getRouters` - 获取路由菜单
  - 参数: stcd, yr
- `GET /system/auth/getPermissionList` - 获取权限列表
  - 参数: yr, perm, parentId, childId
- `GET /system/auth/getPermByStcd` - 按测站获取权限
  - 参数: stcd, yr
- `GET /system/auth/getIndexGraphStList` - 获取整编概览测站列表
  - 参数: yr
- `GET /system/auth/getPermissionInfo` - 获取权限信息
  - 参数: yr

### 4. 系统日志相关
- `GET /system/logininfor/statistic` - 登录统计

### 5. 租户相关
- `GET /auth/tenant/list` - 租户列表

## 单站整编子菜单
- 整编配置
- 水位
  - 整编水位数据
  - 自记数据
  - 水准点高程考证表
  - 水尺零点高程考证表
- 流量
- 含沙量
- 颗粒分析
- 冰情
- 降水
- 蒸发（含辅助项目）
- 水温
- 气温(岸温)
- 地下水
- 说明资料
- 考证资料
- 调查资料
- 图形

## OpenCLI 命令使用

### 1. 整编概览 - 完成率统计
```bash
opencli hydra overview --start-date 2026-03-18 --end-date 2026-03-18 --type "日清月结"
```

### 2. 实测数据统计
```bash
opencli hydra actual-measurement --stcd 03100001 --year 2026
```

### 3. 水位数据
```bash
opencli hydra water-level --stcd 03100001 --year 2026 --limit 100
```

### 4. 测站列表
```bash
opencli hydra stations --year 2026
```

## 数据类型说明

### 测站编码 (stcd)
- 03100001: 邯郸竞赛站1
- 03150001: 唐山竞赛站1
- 等等...

### 统计方法 (type)
- 日清月结
- 按日统计
- 按旬统计
- 按月统计

## 下一步探索建议

1. **更多数据类型**: 探索流量、含沙量、降水等其他数据类型的API
   - 可能的端点模式: `/business/compileData/riverStationData/{数据表标识}/list`
   - 水位用 baZ0g09B，其他类型可能有不同的标识

2. **导出功能**: 系统有"导出excel"和"导出通报表"按钮，需要探索导出API

3. **查询和过滤**: 探索如何按日期范围、测站范围等条件进行查询

4. **图表数据**: reorganizeGraph 和 zqGraph 返回图表数据，可以用于可视化

5. **更多菜单**: 综合整编、成果一览、汇编、墒情等模块需要进一步探索

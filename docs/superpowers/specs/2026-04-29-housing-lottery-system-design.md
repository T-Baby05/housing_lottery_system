# 还房摇号系统 MVP 设计文档

## 文档说明

- **文档用途**：定义还房摇号系统 MVP 版本的技术架构、核心算法、数据模型和功能边界，作为后续开发实施的依据
- **文档状态**：设计初稿，开发过程中持续调整
- **适用阶段**：一期 MVP 建设

## 一、系统定位

本系统定位为**现场活动支撑平台**，不是日常办公系统。核心价值在摇号活动日（T 日）集中体现：公示数据、执行摇号、扫码查结果、归档封存，一条线走完。

### 三个使用阶段

| 阶段 | 时间 | 核心动作 | 系统角色 |
|------|------|----------|----------|
| 活动前 | T-12 ~ T-1 | 导入住户/房源数据 → 采集房型意愿 → 审核锁定 | 数据准备工具 |
| 活动日 | T 日 | 公示数据 → A/B/C/D 四轮摇号 → 扫码查结果 → 归档封存 | 现场执行核心 |
| 活动后 | T+1 ~ T+7 | 异议处理 → 结果确认 → 资料归档 | 收尾支撑 |

### 三块屏

| 界面 | 使用者 | 用途 |
|------|--------|------|
| 大屏展示端 | 全场参会人员 | 投影到会场主屏幕，展示摇号过程、滚动名单、轮次结果 |
| 住户查询端 | 还房户 | 手机扫码进入，查个人结果 |
| 操作管理端 | 工作人员 | 管理数据、执行摇号、导出结果 |

## 二、MVP 范围

### 必做模块（5 个）

1. **住户管理**：Excel 导入、列表筛选、资格标记、家庭成员
2. **房源管理**：Excel 导入、房型归类（A/B/C/D）、状态管控、统计概览
3. **意愿与审核**：多志愿录入（1-4 个）、资格审核、名单锁定
4. **摇号执行**：四轮分房型摇号、中签锁定、未中签自动流转、操作日志
5. **结果查询**：编号+身份校验登录、脱敏展示、实时更新

### 可简化/延后

- 多项目切换 → MVP 先做单项目，表结构预留 project_id
- 短信通知 → 一期用导出 Excel + 人工方式替代
- 现场签到 → 一期用人工核验
- 复杂角色权限 → MVP 用简单的管理员/操作员两级
- 大屏模板管理 → MVP 内置一套固定样式

## 三、技术架构

### 技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| 前端 | Vue 3 + Element Plus + Vite | Composition API，Pinia 状态管理，Vue Router 4 |
| 后端 | Spring Boot 3 + MyBatis-Flex | 经典三层架构：Controller → Service → Mapper |
| 数据库 | MySQL 8.0 | 所有业务表带 project_id |
| 缓存 | Redis（可选） | MVP 阶段不引入 |

### 架构原则

- 单体 Spring Boot 应用，不做微服务拆分
- 前后端分离，RESTful API（JSON）
- 摇号引擎独立抽离为 `LotteryEngine`，纯函数设计，不依赖数据库
- 查询 API 不依赖后台登录态（公开访问）
- 所有表从第一天就带 `project_id`，结构上多项目就绪

## 四、摇号算法设计

### 核心原则

1. **输入可验证**：摇号前对锁定数据生成 SHA-256 哈希并公示
2. **过程可复现**：确定性算法 + 固定种子，任何人用相同输入可复现相同结果
3. **结果可检测**：算法公开、种子公开，可送检测机构做统计检验

### 算法流程

**第一步：封存数据并公示哈希**

```
snapshot = { households, wishes, units, round_config }
data_hash = SHA-256(JSON.stringify(snapshot))
// data_hash 在摇号前公示到大屏，作为数据封存凭证
```

**第二步：生成种子并公示**

```
// 简版（MVP 推荐）
seed = SHA-256(data_hash + timestamp)

// 增强版（检测场景推荐）
witness_input = 见证人现场输入
seed = SHA-256(data_hash + witness_input + timestamp)
// 种子生成后立即在大屏展示，不可更改
```

**第三步：初始化随机数生成器**

```
rng = SecureRandom.getInstance("SHA1PRNG")
rng.setSeed(seed.getBytes())
```

**第四步：Fisher-Yates 洗牌并选出中签者**

```
function drawWinners(candidates, count, rng):
  pool = candidates.copy()
  for i from pool.length-1 down to 1:
    j = rng.nextInt(i + 1)
    swap(pool[i], pool[j])
  return pool[0:count]  // 前 count 个为中签者
```

**第五步：结果落库**

- 中签者标记为"已锁定"，退出后续轮次
- 未中签者按下一有效志愿自动流转至对应轮次
- sort_order 同时作为候补顺序

### 检测机构验证维度

| 检测项 | 检测方法 | 保障措施 |
|--------|----------|----------|
| 算法正确性 | 代码审查 Fisher-Yates 实现 | 独立模块，单一职责 |
| 随机分布均匀性 | NIST SP 800-22 统计测试套件 | 使用 Java SecureRandom (SHA1PRNG) |
| 结果可复现性 | 相同种子+输入，多次运行验证一致性 | 确定性 PRNG + 固定种子 |
| 防篡改 | 验证摇号后数据哈希与公示哈希一致 | SHA-256 哈希 + 操作日志 |
| 种子不可预测性 | 验证种子生成时间在摇号启动之后 | 摇号启动瞬间生成并公示 |

### LotteryEngine 设计约束

- 纯函数：输入候选人列表 + 种子 → 输出中签列表，无副作用
- 不依赖数据库：计算过程只在内存中完成
- 可独立测试：不启动 Spring 容器也能跑单元测试
- 可独立交付：引擎代码 + 测试用例 + 输入样本，打包送检测机构

## 五、数据库设计

### 实体关系

```
project    1 ──── N  household
project    1 ──── N  housing_unit
project    1 ──── N  lottery_round
household  1 ──── N  wish
housing_unit N ──── 1  house_type (字典)
lottery_round 1 ──── N  lottery_result
lottery_result N ──── 1  household
```

### 核心表

**project — 项目**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| name | varchar(100) | 项目名称 |
| code | varchar(50) | 项目编码，唯一 |
| status | varchar(20) | DRAFT → PREPARING → LOCKED → LOTTERY → FINISHED → ARCHIVED |
| lottery_date | date | 计划摇号日期（T 日） |
| data_hash | varchar(64) | 锁定时刻的数据快照 SHA-256 |

**household — 住户**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| project_id | bigint | 所属项目 |
| participant_no | varchar(20) | 参与编号，项目内唯一 |
| holder_name | varchar(50) | 户主姓名 |
| id_card | varchar(18) | 身份证号（加密存储） |
| phone | varchar(11) | 手机号（加密存储） |
| status | varchar(20) | NORMAL / DISQUALIFIED / WITHDRAWN |
| member_count | int | 家庭成员数 |
| lottery_status | varchar(20) | PENDING → ENTERED → WON / LOST / LOCKED |

**housing_unit — 房源**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| project_id | bigint | 所属项目 |
| unit_code | varchar(50) | 房源编号 |
| house_type | varchar(10) | 房型：A / B / C / D |
| building | varchar(50) | 楼栋 |
| floor | int | 楼层 |
| area | decimal(8,2) | 面积 |
| status | varchar(20) | AVAILABLE / RESERVED / ASSIGNED |

**wish — 房型意愿**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| household_id | bigint | 住户 ID |
| priority | int | 志愿顺序：1, 2, 3, 4 |
| house_type | varchar(10) | 房型：A / B / C / D |
| is_active | tinyint | 当前有效志愿标记，中签后置为 0 |

**lottery_round — 摇号轮次**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| project_id | bigint | 所属项目 |
| round_order | int | 轮次序号：1(A), 2(B), 3(C), 4(D) |
| house_type | varchar(10) | 本轮房型 |
| candidate_count | int | 本轮候选户数 |
| winner_count | int | 本轮中签户数 |
| seed | varchar(64) | 本轮随机种子（公示 + 复现用） |
| status | varchar(20) | PENDING / RUNNING / COMPLETED |
| started_at | datetime | 摇号启动时间 |

**lottery_result — 摇号结果**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| round_id | bigint | 所属轮次 |
| household_id | bigint | 住户 ID |
| result | varchar(20) | WON / LOST / NOT_ENTERED |
| sort_order | int | 洗牌后的顺序号（候补排队用） |

**audit_log — 操作日志**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| project_id | bigint | 所属项目 |
| action | varchar(50) | 操作类型：LOCK_DATA / START_ROUND / FINISH_ROUND / EXPORT / ... |
| operator | varchar(50) | 操作人 |
| detail | text | 操作详情（JSON） |
| created_at | datetime | 操作时间，精确到毫秒 |

### 关键决策

- **敏感字段加密存储**：身份证号、手机号在 DB 层加密，查询页只展示脱敏信息
- **seed 存在轮次表**：一轮摇号一个种子，数量少、公示清晰
- **每户同时只有一个活跃志愿**：wish.is_active 驱动流转
- **sort_order 兼顾候补**：未中签的也有 sort_order，有人弃选时按此递补

## 六、API 设计

### 住户 API

```
GET    /api/households            # 列表查询（分页、筛选）
POST   /api/households            # 新增
PUT    /api/households/{id}       # 编辑
POST   /api/households/import     # Excel 批量导入
GET    /api/households/{id}/wishes # 查看某户的志愿
```

### 房源 API

```
GET    /api/units                 # 列表查询
POST   /api/units                 # 新增
POST   /api/units/import          # Excel 批量导入
GET    /api/units/stats           # 房型统计
```

### 意愿与审核 API

```
POST   /api/wishes                # 录入住户志愿
GET    /api/wishes?householdId=    # 查询志愿
POST   /api/review/lock           # 锁定名单（生成 data_hash）
```

### 摇号 API（核心）

```
POST   /api/lottery/rounds/{id}/start  # 执行一轮摇号
GET    /api/lottery/rounds             # 轮次列表及状态
GET    /api/lottery/results?roundId=   # 单轮结果
GET    /api/lottery/final-results      # 最终结果汇总
```

### 查询 API（公开，无需后台登录）

```
POST   /api/query/results         # Body: { participantNo, idCardLast4 }
```

## 七、前端页面设计

### 页面划分

| 页面 | 路由 | 说明 |
|------|------|------|
| 大屏展示页 | `/display` | 全屏投屏，展示当前轮次、滚动名单、统计数字。通过轮询接收摇号状态 |
| 住户查询页 | `/query` | 移动端，住户扫码进入。输入编号+身份证后四位查结果 |
| 住户管理 | `/admin/households` | 列表、导入、筛选、家庭成员 |
| 房源管理 | `/admin/units` | 列表、导入、房型统计 |
| 意愿审核 | `/admin/review` | 志愿查看、资格审核、数据锁定 |
| 摇号控制台 | `/admin/lottery` | 轮次概览、执行摇号、结果查看 |
| 结果归档 | `/admin/archive` | 导出、封存、日志查看 |

### 部署方式

- 操作管理端 + 大屏展示端 = 同一前端应用（`lottery-admin`），部署在内网
- 住户查询端 = 独立前端应用（`lottery-query`），部署在公网可访问环境

## 八、项目结构建议

```
housing-lottery-system/
├── lottery-server/          # Spring Boot 后端
│   ├── src/main/java/...
│   │   ├── controller/      # API 控制器
│   │   ├── service/         # 业务逻辑
│   │   ├── mapper/          # MyBatis 映射
│   │   ├── entity/          # 实体类
│   │   ├── engine/          # 摇号引擎（独立模块）
│   │   └── config/          # 配置
│   └── src/main/resources/...
├── lottery-admin/           # Vue 3 管理端 + 大屏
│   ├── src/
│   │   ├── views/           # 页面
│   │   ├── components/      # 组件
│   │   ├── stores/          # Pinia
│   │   ├── api/             # Axios 封装
│   │   └── router/          # 路由
│   └── vite.config.ts
├── lottery-query/           # Vue 3 查询端（移动端）
│   └── src/...
├── docs/                    # 文档
│   └── superpowers/
│       └── specs/           # 设计文档
└── prototype/               # 已有原型（参考用）
```

## 九、非功能需求

### 安全性
- 后台 API 需要账号认证（Spring Security）
- 查询 API 通过编号+身份校验访问，不暴露完整个人信息
- 身份证号、手机号加密存储，查询页只展示脱敏数据

### 稳定性
- 摇号活动期间系统需保持稳定
- 支持导出关键清单以备离线应急
- 关键操作需记录日志

### 可追溯性
- 关键动作全部记录到 audit_log 表
- 数据锁定、摇号执行、结果发布、归档封存均可回溯

### 公平性
- 摇号算法可复现、可验证、可送检
- 数据快照哈希公示，防止事后篡改
- 轮次种子即时生成并公示

## 十、后续扩展方向

- 多项目切换管理
- 短信通知集成
- 在线意愿填报端
- 电子签字/签章集成
- 大屏模板管理
- 完整角色权限体系

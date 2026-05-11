# GitHub Issues 第一批草稿

状态：Draft
负责人：项目维护者
最后更新：2026-05-11
关联模板：`docs/templates/GitHub-Issue模板.md`

## 1. 拆分策略

第一批 Issues 聚焦 MVP 开发启动所需的后端基础、数据库、核心算法、数据封存、审计和摇号执行能力。暂不一次性创建全部前端和查询端任务，避免在基础模型未落地前过早扩散范围。

第一批建议创建 6 个 GitHub Issues：

| 序号 | 标题 | 优先级 | 标签建议 | 依赖 |
| --- | --- | --- | --- | --- |
| 1 | `[后端] 初始化 Spring Boot 后端工程` | P0 | `type:task`, `area:backend`, `priority:P0`, `mvp` | 无 |
| 2 | `[数据库] 创建 MVP 核心表结构和初始化脚本` | P0 | `type:task`, `area:database`, `priority:P0`, `mvp` | Issue 1 |
| 3 | `[后端] 创建实体、Mapper 和基础持久化测试` | P0 | `type:task`, `area:backend`, `area:database`, `priority:P0`, `mvp` | Issue 2 |
| 4 | `[算法] 使用 TDD 实现 LotteryEngine 核心算法` | P0 | `type:feature`, `area:algorithm`, `priority:P0`, `mvp` | Issue 1 |
| 5 | `[业务] 实现数据快照、锁定和审计日志基础能力` | P0 | `type:feature`, `area:backend`, `area:audit`, `priority:P0`, `mvp` | Issue 3 |
| 6 | `[业务] 实现四轮摇号执行、房源绑定和作废重摇审计` | P0 | `type:feature`, `area:backend`, `area:algorithm`, `area:audit`, `priority:P0`, `mvp` | Issue 4、Issue 5 |

---

## Issue 1：[后端] 初始化 Spring Boot 后端工程

### 背景

还房摇号系统 MVP 采用 Spring Boot 3 单体后端，后续数据库、实体、Mapper、业务 API 和摇号服务都依赖后端基础工程。

该任务对应实施计划中的 Task 1。

### 目标

- 创建 `lottery-server` 后端工程。
- 建立 Spring Boot 3 应用入口、基础配置和测试结构。
- 为后续数据库、MyBatis-Plus、Excel 导入、接口开发提供基础依赖。

### 范围

#### 包含

- 创建 Maven 后端工程结构。
- 添加 Spring Boot Web、Validation、MyBatis-Plus、MySQL Driver、Lombok、Apache POI 等基础依赖。
- 如引入 Spring Security，先采用开发期放行或最小配置，不实现完整登录流程。
- 创建应用入口类。
- 创建 `application.yml`，包含应用名、端口、数据库连接占位配置。
- 创建应用启动测试。

#### 不包含

- 不实现具体业务 API。
- 不创建数据库表。
- 不实现完整用户、角色、权限体系。
- 不实现前端工程。

### 约束与决策

- 后端采用 Spring Boot 3 单体应用。
- 数据访问后续采用 MyBatis-Plus。
- 数据库目标为 MySQL 8.0。
- MVP 暂缓完整权限体系，公开查询接口后续独立放行。
- 所有提交信息使用 conventional commit 前缀 + 中文描述。

### 建议实现

建议文件路径：

```text
lottery-server/pom.xml
lottery-server/src/main/java/.../LotteryServerApplication.java
lottery-server/src/main/resources/application.yml
lottery-server/src/test/java/.../LotteryServerApplicationTests.java
```

建议步骤：

1. 创建 `lottery-server` Maven 工程。
2. 配置 Java 版本和 Spring Boot 版本。
3. 添加基础依赖。
4. 添加应用入口。
5. 添加测试依赖和应用上下文启动测试。
6. 在 README 或后续文档中补充本地启动方式。

### 验收标准

- [ ] `lottery-server` 工程结构存在且可被 Maven 识别。
- [ ] 应用入口类可正常编译。
- [ ] `application.yml` 包含基础应用配置和数据库占位配置。
- [ ] `mvn test` 可以执行并通过。
- [ ] 后续 Issue 可以在该工程基础上继续添加实体、Mapper 和业务代码。

### 测试与验证

建议命令：

```bash
cd lottery-server
mvn test
```

需要覆盖的测试点：

- Spring 应用上下文可以启动。
- Maven 依赖解析成功。
- 基础配置文件无语法错误。

### 关联文档

- `docs/03-designs/2026-05-11-还房摇号系统MVP技术设计.md`
- `docs/04-plans/2026-05-11-还房摇号系统MVP实施计划.md`
- `docs/05-adr/0002-采用SpringBoot单体架构.md`

### 依赖关系

- 前置 Issue：无
- 后续 Issue：数据库结构、实体 Mapper、LotteryEngine、业务 API

### 备注

鉴权方案尚未完全确认。若本 Issue 中引入 Spring Security，应只做最小可运行配置，避免阻塞后续业务开发。

---

## Issue 2：[数据库] 创建 MVP 核心表结构和初始化脚本

### 背景

MVP 需要支撑单项目还房摇号闭环：住户、房源、意愿、数据锁定、四轮摇号、结果绑定具体房源、审计日志和归档。数据库结构是后续实体、Mapper、业务服务和测试的基础。

该任务对应实施计划中的 Task 2。

### 目标

- 创建 MVP 核心表结构。
- 明确关键字段、唯一约束、索引和状态枚举。
- 支持中签结果绑定具体房源。
- 支持关键动作审计。

### 范围

#### 包含

- 创建 `project` 表。
- 创建 `household` 表。
- 创建 `housing_unit` 表。
- 创建 `wish` 表。
- 创建 `lottery_round` 表。
- 创建 `lottery_result` 表。
- 创建 `audit_log` 表。
- 添加项目内唯一约束和常用查询索引。
- 编写数据库初始化说明。

#### 不包含

- 不实现实体类和 Mapper。
- 不实现业务 API。
- 不实现正式字段级加密。
- 不实现完整多项目切换和项目级权限。

### 约束与决策

- MVP 界面按单项目运行，但核心业务表保留 `project_id`。
- 中签结果需要直接绑定具体房源，`lottery_result` 应包含 `assigned_unit_id`。
- 中签后对应 `housing_unit.status` 后续应更新为 `ASSIGNED`。
- `lottery_result.result` 至少支持 `WON`、`LOST`、`NOT_ENTERED`、`VOIDED`。
- 作废重摇不得无痕覆盖，应通过状态字段、关联字段或审计日志保留追溯能力。
- MVP 面向演示/脱敏数据，暂不做字段级加密；后续如存真实数据再重新设计。

### 建议实现

建议文件路径：

```text
lottery-server/src/main/resources/db/schema.sql
lottery-server/src/main/resources/db/README.md
```

建议步骤：

1. 先用 `schema.sql` 建立 MVP 表结构。
2. 每张表包含 `id`、必要业务字段、创建/更新时间字段。
3. 为项目内唯一字段添加唯一索引，例如：
   - `project.code`
   - `household(project_id, participant_no)`
   - `housing_unit(project_id, unit_code)`
   - `wish(household_id, priority)`
4. 为常用查询字段添加索引，例如：
   - `project_id`
   - `round_id`
   - `house_type`
   - `status`
5. 在初始化说明中写明执行方式和重复执行策略。

### 验收标准

- [ ] `schema.sql` 包含 MVP 核心 7 张表。
- [ ] 所有业务表按设计保留 `project_id` 或可追溯到项目。
- [ ] `lottery_result` 支持记录 `assigned_unit_id`。
- [ ] `audit_log` 支持记录操作类型、操作人、详情 JSON 和时间。
- [ ] 关键唯一约束和索引已定义。
- [ ] 数据库初始化说明清楚说明如何执行脚本。

### 测试与验证

建议命令：

```bash
mysql -u root -p < lottery-server/src/main/resources/db/schema.sql
```

如暂时没有 MySQL，也至少需要：

```bash
cd lottery-server
mvn test
```

需要覆盖的测试点：

- SQL 语法可执行。
- 表结构满足技术设计中的核心字段。
- 重复执行策略明确，不误导后续开发。

### 关联文档

- `docs/03-designs/2026-05-11-还房摇号系统MVP技术设计.md`
- `docs/04-plans/2026-05-11-还房摇号系统MVP实施计划.md`
- `docs/00-project/2026-05-11-MVP待确认问题清单.md`

### 依赖关系

- 前置 Issue：Issue 1
- 后续 Issue：Issue 3、Issue 5、Issue 6

### 备注

是否引入 Flyway/Liquibase 尚未确认。MVP 可先使用 `schema.sql`，但如果后续协作频繁，建议单独创建 migration 方案 Issue。

---

## Issue 3：[后端] 创建实体、Mapper 和基础持久化测试

### 背景

数据库结构确定后，需要建立后端实体、Mapper 和基础持久化测试，作为后续数据锁定、摇号执行、查询和归档功能的访问基础。

该任务对应实施计划中的 Task 3。

### 目标

- 为核心表创建 Java 实体类。
- 创建 MyBatis-Plus Mapper。
- 配置 MyBatis-Plus 基础能力。
- 编写基础持久化测试，验证实体映射和 CRUD 能力。

### 范围

#### 包含

- 创建核心实体类：`Project`、`Household`、`HousingUnit`、`Wish`、`LotteryRound`、`LotteryResult`、`AuditLog`。
- 创建对应 Mapper。
- 配置 MyBatis-Plus 分页插件。
- 添加基础 CRUD 或 Mapper 映射测试。
- 为状态字段定义枚举或常量，避免散落字符串。

#### 不包含

- 不实现完整业务服务。
- 不实现控制器 API。
- 不实现 Excel 导入。
- 不实现摇号算法。

### 约束与决策

- 实体字段必须与 `schema.sql` 对齐。
- `LotteryResult` 必须支持 `assignedUnitId`。
- 敏感字段如身份证号、手机号在 MVP 中先受控存储；返回脱敏由 API/DTO 层处理。
- 不在实体或日志中引入敏感字段明文输出。

### 建议实现

建议文件路径：

```text
lottery-server/src/main/java/.../entity/*.java
lottery-server/src/main/java/.../mapper/*.java
lottery-server/src/main/java/.../config/MybatisPlusConfig.java
lottery-server/src/test/java/.../mapper/*Test.java
```

建议步骤：

1. 根据数据库表创建实体类。
2. 使用统一命名规范处理数据库字段和 Java 字段映射。
3. 创建 Mapper 接口。
4. 配置分页插件。
5. 编写最小持久化测试，验证插入、查询和基础映射。

### 验收标准

- [ ] 核心 7 张表均有对应实体类。
- [ ] 核心实体均有对应 Mapper。
- [ ] MyBatis-Plus 配置可正常加载。
- [ ] 基础持久化测试通过。
- [ ] `LotteryResult.assignedUnitId` 映射正确。
- [ ] 状态字段使用枚举、常量或集中定义方式管理。

### 测试与验证

建议命令：

```bash
cd lottery-server
mvn test
```

需要覆盖的测试点：

- 核心实体插入和查询。
- 项目内唯一约束相关的基本行为。
- `assignedUnitId` 字段读写。
- 审计日志详情字段读写。

### 关联文档

- `docs/03-designs/2026-05-11-还房摇号系统MVP技术设计.md`
- `docs/04-plans/2026-05-11-还房摇号系统MVP实施计划.md`

### 依赖关系

- 前置 Issue：Issue 2
- 后续 Issue：Issue 5、Issue 6、住户/房源/意愿 API

### 备注

如果测试数据库配置暂未确定，可先使用测试容器、H2 兼容模式或本地 MySQL，但必须在文档中写明限制。

---

## Issue 4：[算法] 使用 TDD 实现 LotteryEngine 核心算法

### 背景

摇号公平性和可复现性是 MVP 的核心。技术设计要求摇号核心算法独立为 `LotteryEngine`，不依赖数据库和 Spring 容器，通过固定输入和种子得到稳定输出。

该任务对应实施计划中的 Task 4。

### 目标

- 使用 TDD 实现确定性摇号核心算法。
- 支持 Fisher-Yates 洗牌和按数量抽取中签结果。
- 保留完整洗牌顺序，用于候补顺序和审计。
- 为后续业务服务调用提供稳定输入/输出模型。

### 范围

#### 包含

- 创建 `LotteryEngine`。
- 创建算法输入模型，如 `LotteryCandidate`。
- 创建算法输出模型，如 `LotteryDrawResult`。
- 实现基于种子的确定性洗牌。
- 编写核心单元测试。

#### 不包含

- 不查询数据库。
- 不更新房源状态。
- 不保存摇号结果。
- 不实现四轮业务流转。
- 不处理作废重摇业务流程。

### 约束与决策

- `LotteryEngine` 必须是纯函数或接近纯函数，不依赖 Spring 容器。
- 相同候选人、相同种子必须输出相同顺序。
- 输出结果不得出现重复住户。
- 中签数量等于 `min(候选户数, 可用房源数)`。
- PRNG 具体实现仍需技术验证；本 Issue 可先实现并用测试固定行为，必要时后续通过 spike 替换实现。

### 建议实现

建议文件路径：

```text
lottery-server/src/main/java/.../engine/LotteryEngine.java
lottery-server/src/main/java/.../engine/LotteryCandidate.java
lottery-server/src/main/java/.../engine/LotteryDrawResult.java
lottery-server/src/test/java/.../engine/LotteryEngineTest.java
```

建议步骤：

1. 先写失败测试。
2. 实现最小输入/输出模型。
3. 实现确定性洗牌。
4. 实现抽取前 N 个中签，剩余保留候补顺序。
5. 补充边界测试。
6. 运行算法测试和全量测试。

### 验收标准

- [ ] 核心测试先于实现编写，体现 TDD 流程。
- [ ] 相同候选人、相同种子输出顺序一致。
- [ ] 不同种子大概率输出不同顺序。
- [ ] 中签数量等于 `min(候选户数, 可用房源数)`。
- [ ] 候选户少于房源时全部中签。
- [ ] 候选户为空时结果为空。
- [ ] 输出结果不重复。
- [ ] 洗牌顺序可作为候补顺序。
- [ ] `mvn -Dtest=LotteryEngineTest test` 通过。

### 测试与验证

建议命令：

```bash
cd lottery-server
mvn -Dtest=LotteryEngineTest test
mvn test
```

需要覆盖的测试点：

- 固定种子的稳定性。
- 边界输入。
- 重复候选处理策略。
- 中签与候补顺序。

### 关联文档

- `docs/03-designs/2026-05-11-还房摇号系统MVP技术设计.md`
- `docs/04-plans/2026-05-11-还房摇号系统MVP实施计划.md`
- `docs/05-adr/0003-采用确定性摇号引擎.md`

### 依赖关系

- 前置 Issue：Issue 1
- 后续 Issue：Issue 6

### 备注

PRNG 选择仍是技术风险点。若后续要求跨 JDK、跨平台或检测机构复现，需要创建单独 spike Issue 验证 `SHA1PRNG` 或替换为明确规范的 PRNG。

---

## Issue 5：[业务] 实现数据快照、锁定和审计日志基础能力

### 背景

摇号前必须对住户、房源、意愿和轮次配置生成稳定数据快照，并计算 SHA-256 哈希。锁定后核心数据默认不可修改，关键动作必须写入审计日志。

该任务对应实施计划中的 Task 7 的锁定部分，并为后续摇号执行服务提供前置能力。

### 目标

- 实现审核锁定能力。
- 生成稳定排序的数据快照和 `data_hash`。
- 锁定后限制核心数据修改。
- 建立审计日志基础服务。

### 范围

#### 包含

- 实现 `ReviewService` 或等效服务。
- 实现数据快照 canonical 规则。
- 计算 SHA-256 `data_hash`。
- 保存项目锁定状态和哈希。
- 实现 `AuditLogService` 或等效审计写入能力。
- 提供查看快照摘要的服务或接口基础。

#### 不包含

- 不实现完整 Excel 导入。
- 不实现四轮摇号。
- 不实现作废重摇的完整业务流程。
- 不导出完整快照文件，除非后续确认纳入本轮。

### 约束与决策

- 快照字段、排序规则、JSON 序列化规则必须固定。
- 锁定后核心数据默认不可修改。
- 审计日志不得记录身份证号、手机号等敏感字段原文。
- MVP 不做字段级加密，但必须做到脱敏展示和日志禁敏。
- MVP 不做无痕解锁；异常处理后续走带审计的作废重摇流程。

### 建议实现

建议文件路径：

```text
lottery-server/src/main/java/.../service/ReviewService.java
lottery-server/src/main/java/.../service/AuditLogService.java
lottery-server/src/main/java/.../dto/review/*
lottery-server/src/test/java/.../service/ReviewServiceTest.java
lottery-server/src/test/java/.../service/AuditLogServiceTest.java
```

建议步骤：

1. 定义快照数据结构。
2. 固定快照字段和排序规则。
3. 计算 SHA-256 哈希。
4. 更新项目状态为 `LOCKED`。
5. 实现审计日志写入。
6. 增加锁定后核心数据不可修改的服务层校验。
7. 编写稳定性和安全测试。

### 验收标准

- [ ] 相同业务数据多次生成相同 `data_hash`。
- [ ] 核心数据变化后 `data_hash` 发生变化。
- [ ] 锁定后住户、房源、意愿等核心数据不能被普通流程修改。
- [ ] 锁定动作写入审计日志。
- [ ] 审计日志不包含身份证号、手机号原文。
- [ ] 快照摘要可查看或可被后续接口复用。

### 测试与验证

建议命令：

```bash
cd lottery-server
mvn -Dtest=ReviewServiceTest,AuditLogServiceTest test
mvn test
```

需要覆盖的测试点：

- 哈希稳定性。
- 哈希变化性。
- 锁定状态流转。
- 锁定后修改被拒绝。
- 审计日志写入。
- 日志禁敏。

### 关联文档

- `docs/03-designs/2026-05-11-还房摇号系统MVP技术设计.md`
- `docs/04-plans/2026-05-11-还房摇号系统MVP实施计划.md`
- `docs/00-project/2026-05-11-MVP待确认问题清单.md`

### 依赖关系

- 前置 Issue：Issue 3
- 后续 Issue：Issue 6、公开查询、结果归档

### 备注

完整快照文件是否导出归档尚未确认。当前 Issue 先保证 `data_hash` 和快照摘要能力。

---

## Issue 6：[业务] 实现四轮摇号执行、房源绑定和作废重摇审计

### 背景

MVP 核心业务是执行 A/B/C/D 四轮摇号，并将中签结果直接绑定具体房源。用户已确认需要带审计的作废重摇，不允许无痕重摇。

该任务对应实施计划中的 Task 8，是后续公开查询、结果发布、固定大屏和归档能力的核心依赖。

### 目标

- 实现 A/B/C/D 四轮摇号执行服务。
- 调用 `LotteryEngine` 生成中签和候补顺序。
- 中签结果绑定具体房源。
- 更新房源状态和住户后续轮次参与状态。
- 支持带审计的作废重摇流程。

### 范围

#### 包含

- 初始化或查询 A/B/C/D 轮次。
- 开始摇号前校验项目已锁定。
- 根据当前有效志愿筛选候选人。
- 根据可用房源数量确定中签数量。
- 调用 `LotteryEngine` 生成洗牌顺序。
- 保存本轮种子、候选数、中签数、结果和候补顺序。
- 将中签结果绑定具体 `assigned_unit_id`。
- 将中签房源状态更新为 `ASSIGNED`。
- 已中签住户退出后续轮次。
- 未中签住户流转到下一有效志愿。
- 实现作废某轮结果并重摇的审计流程。

#### 不包含

- 不实现前端页面。
- 不实现公开查询端。
- 不实现完整结果导出。
- 不实现真实短信通知。
- 不实现多项目切换。

### 约束与决策

- 同一轮次不能重复执行；如需重摇，必须先作废旧结果。
- 作废必须记录原因、操作人、时间、旧结果和新结果。
- 不允许无痕覆盖旧结果。
- 每轮必须保存种子、候选数量、中签数量、洗牌顺序、房源绑定结果和审计日志。
- 中签房源分配应使用稳定规则，避免同一输入在复现时分配到不同房源。
- 摇号结果发布前，后续公开查询不得泄露正式结果。

### 建议实现

建议文件路径：

```text
lottery-server/src/main/java/.../service/LotteryService.java
lottery-server/src/main/java/.../controller/LotteryController.java
lottery-server/src/main/java/.../dto/lottery/*
lottery-server/src/test/java/.../service/LotteryServiceTest.java
```

建议 API：

```text
GET    /api/lottery/rounds
POST   /api/lottery/rounds/{id}/start
POST   /api/lottery/rounds/{id}/void
POST   /api/lottery/rounds/{id}/redraw
GET    /api/lottery/results?roundId=
GET    /api/lottery/final-results
```

建议步骤：

1. 实现轮次初始化或查询。
2. 实现开始摇号前置校验。
3. 实现候选人筛选和房源数量统计。
4. 调用 `LotteryEngine` 获取顺序。
5. 按稳定房源排序规则绑定具体房源。
6. 保存结果和更新状态。
7. 写入审计日志。
8. 实现作废和重摇流程。
9. 编写集成式业务测试。

### 验收标准

- [ ] 项目未锁定时不能执行摇号。
- [ ] A/B/C/D 轮次可按顺序执行。
- [ ] 每轮候选人来自当前有效志愿。
- [ ] 中签数量等于 `min(候选户数, 可用房源数)`。
- [ ] 中签结果记录 `assigned_unit_id`。
- [ ] 中签房源状态更新为 `ASSIGNED`。
- [ ] 已中签住户不再参与后续轮次。
- [ ] 未中签住户按下一有效志愿流转。
- [ ] 同一轮次不能无痕重复执行。
- [ ] 作废重摇必须记录原因、操作人、时间、旧结果和新结果。
- [ ] 审计日志不包含敏感字段原文。
- [ ] 业务测试通过。

### 测试与验证

建议命令：

```bash
cd lottery-server
mvn -Dtest=LotteryServiceTest test
mvn test
```

需要覆盖的测试点：

- 未锁定项目执行摇号失败。
- 单轮摇号成功。
- 四轮连续摇号。
- 房源不足。
- 候选人为空。
- 中签绑定具体房源。
- 房源状态更新。
- 中签退出后续轮次。
- 未中签流转下一志愿。
- 重复执行被拒绝。
- 作废重摇审计完整。
- 日志禁敏。

### 关联文档

- `docs/03-designs/2026-05-11-还房摇号系统MVP技术设计.md`
- `docs/04-plans/2026-05-11-还房摇号系统MVP实施计划.md`
- `docs/00-project/2026-05-11-MVP待确认问题清单.md`

### 依赖关系

- 前置 Issue：Issue 4、Issue 5
- 后续 Issue：公开查询、结果发布、固定大屏、结果归档、端到端集成验证

### 备注

如果作废重摇的数据保留方式在实现时出现分歧，优先选择“保留旧结果状态 + 写入完整审计日志”的方案，不要直接覆盖历史结果。

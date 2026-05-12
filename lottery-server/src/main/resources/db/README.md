# 数据库初始化说明

状态：Draft
适用范围：GitHub Issue #2「创建 MVP 核心表结构和初始化脚本」
最后更新：2026-05-12

## 1. 文件说明

当前目录包含：

- `schema.sql`：还房摇号系统 MVP 的 MySQL 初始化脚本

`schema.sql` 当前覆盖以下 7 张核心表：

1. `project`
2. `household`
3. `housing_unit`
4. `wish`
5. `lottery_round`
6. `lottery_result`
7. `audit_log`

设计原则：

- MVP 界面先按单项目运行，但核心表保留 `project_id`
- 摇号结果直接绑定具体房源，`lottery_result.assigned_unit_id` 为预留核心字段
- 作废重摇不得无痕覆盖，`lottery_result` 保留 `is_current` 和 `voided_from_result_id` 以支持追溯
- 审计日志使用 `detail` JSON 字段保存结构化详情

## 2. 执行前准备

建议使用 MySQL 8.0 或更高版本，并确认目标数据库字符集支持 `utf8mb4`。

示例：

```sql
CREATE DATABASE housing_lottery
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;
```

## 3. 执行方式

在数据库已创建的前提下，执行：

```bash
mysql -u root -p housing_lottery < lottery-server/src/main/resources/db/schema.sql
```

如果使用环境变量或远程数据库，可替换为对应参数，例如：

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p housing_lottery < lottery-server/src/main/resources/db/schema.sql
```

## 4. 重复执行策略

当前 `schema.sql` 是一次性初始化脚本，不是幂等 migration。

这意味着：

- 不建议直接对已存在同名表且已有业务数据的库重复执行
- 如果是本地开发或测试环境需要重建，建议先清空测试库后再重新执行
- 如果后续进入多人协作或多次演进阶段，建议单独创建 Flyway/Liquibase migration 方案 Issue，再迁移到版本化脚本

开发/测试环境常见做法：

1. 删除旧测试库并重建
2. 或新建一个空数据库执行脚本
3. 再启动后端并执行测试

## 5. 表结构摘要

### 5.1 project

项目主表，记录：

- 项目名称/编码
- 项目状态
- 计划摇号日期
- 锁定后的 `data_hash`
- 结果发布状态
- 归档时间

### 5.2 household

住户主表，记录：

- `participant_no` 参与编号（项目内唯一）
- 户主姓名
- 身份证号/手机号（MVP 阶段按演示/脱敏数据处理）
- 资格状态
- 摇号状态

### 5.3 housing_unit

房源主表，记录：

- `unit_code` 房源编号（项目内唯一）
- 房型 A/B/C/D
- 楼栋、单元、楼层、房号、面积
- 房源状态 `AVAILABLE/RESERVED/ASSIGNED`
- 稳定排序号 `sort_order`

### 5.4 wish

住户房型意愿表，记录：

- 志愿顺序 `priority`
- 房型 `house_type`
- 当前是否有效 `is_active`

### 5.5 lottery_round

摇号轮次表，记录：

- 项目内四轮 A/B/C/D 的轮次定义
- 候选数、中签数
- 随机种子 `seed`
- 轮次执行状态

### 5.6 lottery_result

摇号结果表，记录：

- 住户与轮次关系
- 结果 `WON/LOST/NOT_ENTERED/VOIDED`
- 排序号 `sort_order`
- 具体分配房源 `assigned_unit_id`
- 是否当前有效 `is_current`
- 被作废来源 `voided_from_result_id`

### 5.7 audit_log

审计日志表，记录：

- 操作类型 `action`
- 操作人 `operator`
- 结构化详情 `detail`
- 操作时间 `created_at`

## 6. 后续建议

当前脚本已满足 MVP 启动阶段的数据建模需求。后续建议按 Issue 顺序继续推进：

- Issue #3：实体、Mapper 和基础持久化测试
- Issue #5：数据快照、锁定和审计日志基础能力
- Issue #6：多轮摇号执行、房源绑定和作废重摇审计

如果后续确认要支持正式敏感数据存储、迁移版本控制或更复杂的归档机制，再补充对应 schema 演进方案。

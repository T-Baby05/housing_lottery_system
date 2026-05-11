# GitHub Issue 模板使用规范

状态：Draft
负责人：项目维护者
最后更新：2026-05-11
适用范围：还房摇号系统 MVP GitHub Issues

## 1. 目的

项目不使用单一重模板覆盖所有 Issue，而是按任务复杂度使用三档模板，降低小任务审核成本，同时保证核心特性有足够上下文和验收标准。

## 2. 三档模板

| 模板 | 文件 | 适用场景 | 建议长度 |
| --- | --- | --- | --- |
| 轻量模板 | `docs/templates/GitHub-Issue轻量模板.md` | 小 bug、小文案、配置调整、补测试、补文档、低风险小改动 | 20 行以内 |
| 标准模板 | `docs/templates/GitHub-Issue标准模板.md` | 普通接口、单个页面、单个服务、数据库结构、明确开发任务 | 50 行以内 |
| 完整特性模板 | `docs/templates/GitHub-Issue完整特性模板.md` | 核心业务能力、跨模块功能、影响数据模型/安全/审计/权限的大特性 | 按需详细 |

## 3. 选择规则

优先使用更轻的模板，只有当任务确实需要上下文、约束和风险说明时才使用更重模板。

### 使用轻量模板

满足以下任意条件即可：

- 改动范围很小。
- 目标非常明确。
- 不影响核心业务流程。
- 不影响数据模型。
- 不涉及安全、权限、审计。
- 不需要复杂测试说明。

示例：

- 修改页面文案。
- 补充 README 中的启动命令。
- 修复一个字段拼写。
- 给已有工具方法补一个单元测试。

### 使用标准模板

适用于大多数普通开发任务：

- 一个后端接口。
- 一个服务类。
- 一个前端页面。
- 一个数据库表或初始化脚本。
- 一个清晰的工程初始化任务。

示例：

- 初始化 Spring Boot 后端工程。
- 创建 MVP 核心表结构。
- 创建实体、Mapper 和持久化测试。
- 实现住户列表查询接口。

### 使用完整特性模板

适用于需要重点评审的核心能力：

- 跨多个模块。
- 影响数据模型或状态机。
- 涉及摇号公平性、可复现性。
- 涉及敏感信息、脱敏、日志禁敏。
- 涉及审计、作废、重摇、归档。
- 是后续多个 Issue 的上游特性。

示例：

- 使用 TDD 实现 LotteryEngine 核心算法。
- 实现数据快照、锁定和审计日志基础能力。
- 实现四轮摇号执行、房源绑定和作废重摇审计。

## 4. 标题规范

建议格式：

```text
[类型] 中文任务标题
```

示例：

```text
[后端] 初始化 Spring Boot 后端工程
[数据库] 创建 MVP 核心表结构
[算法] 使用 TDD 实现 LotteryEngine
[业务] 实现带审计的作废重摇流程
[前端] 实现固定大屏展示页
[文档] 补充数据库初始化说明
```

## 5. 建议标签

| 标签 | 含义 |
| --- | --- |
| `type:feature` | 新功能 |
| `type:task` | 工程任务、配置、整理 |
| `type:spike` | 技术验证 |
| `type:docs` | 文档 |
| `area:backend` | 后端 |
| `area:frontend` | 前端 |
| `area:database` | 数据库 |
| `area:algorithm` | 摇号算法 |
| `area:security` | 安全 |
| `area:audit` | 审计 |
| `priority:P0` | 开发启动或核心链路阻塞项 |
| `priority:P1` | MVP 重要能力 |
| `mvp` | MVP 范围内 |
| `status:draft` | 草稿中，尚未审核 |
| `status:reviewed` | 已审核，可交给 Codex/开发执行 |
| `status:in-progress` | 开发中 |
| `status:pr-open` | 已提交 PR，等待 Review 或合并 |
| `status:blocked` | 阻塞中，需要确认或依赖前置任务 |
| `status:done` | 已完成并合并/验收 |
| `needs-confirmation` | 存在待确认事项 |


## 6. Issue 状态标签

前期采用手动状态标签，不引入复杂自动化流转。每个 Issue 同一时间建议只保留一个 `status:*` 标签。

| 状态标签 | 含义 | 何时使用 |
| --- | --- | --- |
| `status:draft` | 草稿中，尚未审核 | Issue 刚创建或内容还需要调整 |
| `status:reviewed` | 已审核，可执行 | 你已确认范围、验收标准和优先级，可交给 Codex/开发执行 |
| `status:in-progress` | 开发中 | 已有人或 AI agent 开始实现 |
| `status:pr-open` | 已提交 PR | 已有 PR，等待 Review、CI 或合并 |
| `status:blocked` | 阻塞中 | 缺少决策、依赖前置任务或遇到外部问题 |
| `status:done` | 已完成 | PR 已合并并通过验收，或任务无需 PR 但已完成 |

推荐手动流转：

```text
status:draft -> status:reviewed -> status:in-progress -> status:pr-open -> status:done
                         \-> status:blocked -> status:reviewed / status:in-progress
```

建议规则：

1. 创建 Issue 时默认加 `status:draft`。
2. 人工审核通过后，把 `status:draft` 替换为 `status:reviewed`。
3. 交给 Codex 或其他开发执行前，必须是 `status:reviewed`。
4. 开发开始后，把状态改为 `status:in-progress`。
5. PR 创建后，把状态改为 `status:pr-open`，并在 PR 描述中写 `Closes #N` 或 `Refs #N`。
6. PR 合并并验收后，把状态改为 `status:done` 或直接关闭 Issue。
7. 如果任务缺少决策或依赖，把状态改为 `status:blocked`，并评论说明阻塞原因。

## 7. 使用原则

1. 小任务不要为了形式套完整模板。
2. 大特性不要为了省事省略约束、验收和测试。
3. 每个 Issue 都至少应有明确目标、验收标准和验证方式。
4. 涉及敏感字段的 Issue 必须写明脱敏展示和日志禁敏要求。
5. 涉及摇号结果、作废、重摇、发布、导出的 Issue 必须写明审计要求。
6. Issue 创建到 GitHub 前，建议先在草稿文档中审阅标题、范围和验收标准。

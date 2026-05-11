# GitHub 协作规范

状态：Accepted
适用范围：本项目及后续使用 GitHub 托管的软件项目

## 1. 基本原则

- Issue 管需求、任务、缺陷和讨论。
- Branch 管隔离开发。
- Pull Request 管评审和合并。
- Commit 记录小步变更。
- 文档和代码一样走版本管理。

## 2. Issue 类型

建议使用以下标签：

| 标签 | 用途 |
| --- | --- |
| `requirement` | 需求收集与澄清 |
| `solution` | 方案讨论与取舍 |
| `design` | 技术设计 |
| `task` | 开发任务 |
| `bug` | 缺陷 |
| `test` | 测试与验收 |
| `docs` | 文档 |
| `decision` | 架构或流程决策 |
| `priority:high` | 高优先级 |
| `priority:medium` | 中优先级 |
| `priority:low` | 低优先级 |

## 3. Issue 内容建议

每个 Issue 至少包含：

- 背景
- 目标
- 范围
- 验收标准
- 关联文档
- 备注/风险

开发类 Issue 还应包含：

- 涉及模块
- 建议实现步骤
- 测试方式

## 4. 分支命名

```text
feat/issue-12-lottery-engine
fix/issue-18-query-result
docs/mvp-scope
chore/project-structure
```

推荐前缀：

- `feat/`：新功能
- `fix/`：缺陷修复
- `docs/`：文档
- `test/`：测试
- `refactor/`：重构
- `chore/`：工程化或杂项

## 5. Commit 规范

格式：

```text
<type>: <summary>
```

常用 type：

- `feat`：新功能
- `fix`：修复
- `docs`：文档
- `test`：测试
- `refactor`：重构
- `chore`：工程化
- `style`：格式调整

示例：

```text
docs: add project workflow and document templates
feat: implement deterministic lottery engine
test: add lottery reproducibility tests
chore: initialize Spring Boot project
```

## 6. PR 规范

每个 PR 应包含：

```markdown
## 背景

## 改动内容

## 影响范围

## 验证方式

## 关联 Issue

## 截图/接口示例（如适用）

## 风险与后续事项
```

合并前检查：

- [ ] 关联 issue 已填写
- [ ] 文档已同步更新
- [ ] 测试已执行并记录结果
- [ ] 没有无关格式化或大范围无关改动
- [ ] 关键设计变更已记录 ADR

## 7. 开发流程

推荐流程：

1. 创建或选择 Issue。
2. 从主分支拉出工作分支。
3. 修改代码和文档。
4. 本地运行测试或验证命令。
5. 提交小粒度 commit。
6. 创建 PR。
7. Review 通过后合并。
8. 关闭 Issue。

## 8. 本项目初期简化策略

项目早期可以简化：

- 不强制每个小文档都有 PR，但重要文档必须提交到 Git。
- 不强制复杂权限和多人 review。
- 先确保 Issue、分支、提交、文档路径规范。
- 等项目进入多人协作后，再加强 PR 审查和 CI 检查。

# DevCanvas GitHub Dev Protocol v1

## 0. 核心原则（不可更改）

DevCanvas 所有开发必须遵循：

- ChatGPT：定义任务 + 审查 PR
- Codex：只执行 scope 内代码修改
- GitHub：唯一状态机（source of truth）

禁止任何绕过 GitHub PR 的开发方式。

---

## 1. Task 定义规则

所有开发必须以 task 文件驱动：

路径：

/docs/tasks/task-xxx.md

格式：

- Goal（目标）
- Scope（允许修改文件）
- Forbidden（禁止修改内容）
- Expected Behavior（期望行为）
- UI Impact（UI影响）
- Risk（风险）

---

## 2. Branch 命名规则

必须：

task-{id}-{short-name}

例：

task-001-ui-shell
task-002-kernel-connect

禁止：

- feature/*
- dev/*
- temp/*
- random branch

---

## 3. PR 规范

PR 必须包含：

### 必填字段

- What changed
- Why changed
- Scope confirmation
- Risk analysis
- UI impact
- Test status（如有）
- Screenshots（UI相关）

---

## 4. Scope 强约束规则

Codex 只能修改 task 指定 scope：

✔ allowed files only

禁止：

- kernel 修改（除非 task 明确允许）
- runtime 修改
- system 修改
- UI结构外扩
- 新系统引入

---

## 5. UI / Kernel / Runtime 冻结规则

### UI层

- 只能局部修改
- 不允许新增系统入口

### Kernel层

- 不允许随意改 routing / constraint

### Runtime层

- 不允许新增执行链

---

## 6. Handoff 规范

路径：

/docs/handoff/task-xxx.md

必须包含：

- modified files
- reasoning
- diff summary
- risk notes
- validation result

---

## 7. Merge 规则

必须顺序：

1. PR review by ChatGPT
2. approve
3. merge to main
4. delete branch

禁止直接 merge

---

## 8. 开发流程（强制）

ChatGPT → Task definition  
Codex → implementation (scope only)  
GitHub → PR  
ChatGPT → review  
merge → next task  

---

## 9. 禁止行为

- 不允许直接改 main
- 不允许绕过 PR
- 不允许跨 task 修改
- 不允许自由重构

---

## 10. 系统目标

DevCanvas = AI writing system + controlled engineering pipeline

不是自由开发环境，而是受控执行系统

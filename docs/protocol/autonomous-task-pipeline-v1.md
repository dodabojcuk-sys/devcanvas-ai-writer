# DevCanvas Autonomous Task Pipeline v1

## 1. Purpose

DevCanvas Autonomous Task Pipeline v1 defines how Codex should continue work after each PR without requiring a fresh manual task prompt every time.

This protocol does not authorize unbounded execution. It creates a semi-autonomous task chain:

```text
current PR -> handoff -> next task suggestion -> scoped execution path
```

## 2. Core Principle

Codex may automatically propose the next task after completing a PR.

Codex must not silently bypass the task system, PR workflow, or scope rules.

## 3. Required PR Addition

Every future Codex PR must include a `NEXT TASK SUGGESTION BLOCK`.

The block must contain:

```text
NEXT TASK SUGGESTION BLOCK

next_task_id:
next_branch_name:
next_goal:
affected_files:
risk_level:
dependency_notes:
why_this_next:
blocked_by:
```

## 4. Task Chaining Rules

Codex must follow this chain:

1. Complete the current scoped task.
2. Generate or update the handoff report.
3. Analyze the PR diff, handoff, and current architecture state.
4. Propose exactly one next task.
5. Keep the next task small enough for a single PR.
6. Include the next task suggestion in the PR body.

## 5. Next Task Requirements

The next task must satisfy:

- single responsibility
- maximum estimated scope of 1 to 3 files
- no cross-system modification
- incremental improvement only
- explicit risk level
- explicit dependency notes

## 6. Allowed Autonomy

Codex may:

- infer the next smallest safe task
- write the next task suggestion block
- prepare a branch name
- estimate affected files
- identify dependency blockers
- keep the development chain moving through GitHub PRs

## 7. Forbidden Autonomy

Codex must not:

- skip task documents
- skip handoff documents
- skip PR review
- merge PRs automatically
- modify multiple system layers in one task
- combine UI and backend changes without explicit task scope
- refactor kernel, runtime, or system code without explicit authorization
- convert a suggestion into execution if the scope violates frozen architecture rules

## 8. GitHub Workflow

Every task still follows:

```text
branch -> scoped changes -> handoff -> PR -> review -> merge -> next task
```

The PR body must contain:

- what changed
- why changed
- scope confirmation
- risk analysis
- UI impact
- validation status
- handoff reference
- `NEXT TASK SUGGESTION BLOCK`

## 9. Relationship To Architecture Freeze

This protocol must obey:

- `docs/architecture/devcanvas-architecture-freeze-v1.md`
- `docs/audit/architecture-validation-report-v1.md`
- `docs/audit/coupling-risk-report-v1.md`

If a next task would cross a frozen boundary, Codex must mark it as blocked and propose a documentation or audit task instead.

## 10. ChatGPT Role

ChatGPT remains the review and calibration layer.

ChatGPT should:

- review PR diffs
- validate architecture boundaries
- adjust task strategy
- reject unsafe next task suggestions
- approve or redirect the proposed chain

## 11. Codex Role

Codex becomes a semi-autonomous executor.

Codex should:

- execute scoped tasks
- preserve repository state
- generate handoff reports
- propose the next task
- keep work inside GitHub

## 12. Success Criteria

This protocol is successful when each PR can answer:

```text
What did we just change?
Why was it safe?
What is the next smallest safe task?
What must not be crossed next?
```

## 13. Non-Goals

This protocol does not implement:

- autonomous merging
- CI automation
- issue automation
- code generation agents
- runtime task execution
- product features
- kernel behavior changes

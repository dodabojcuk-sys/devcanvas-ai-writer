# Task 023: Autonomous Task Pipeline v1

## Goal

Define DevCanvas Autonomous Task Pipeline v1 so each Codex PR can propose the next smallest safe task.

This task upgrades the GitHub workflow from isolated manual tasks into a semi-autonomous task chain.

## Scope

Allowed files:

- `docs/protocol/autonomous-task-pipeline-v1.md`
- `docs/tasks/task-023-autonomous-task-pipeline.md`
- `docs/handoff/task-023.md`

## Forbidden

- No product features.
- No UI changes.
- No kernel changes.
- No runtime changes.
- No system changes.
- No graph contract changes.
- No snapshot assembler changes.
- No CI/tooling changes.
- No autonomous merging.

## Expected Behavior

After this task:

- future PRs include a `NEXT TASK SUGGESTION BLOCK`
- next tasks remain small and scoped
- Codex can suggest the next branch and goal
- ChatGPT remains the review and calibration gate
- GitHub remains the state machine

## Required Protocol Rules

The protocol must define:

- next task suggestion block fields
- task chaining flow
- allowed autonomy
- forbidden autonomy
- PR body requirements
- relationship to architecture freeze

## UI Impact

None.

No product UI behavior changes.

## Risk

Low.

This task is protocol-only. It does not add execution automation.

## Validation

- Diff scope confirms docs-only changes.
- Protocol includes required next task block fields.
- PR body includes first `NEXT TASK SUGGESTION BLOCK`.
- No code files are changed.

## Done When

- Autonomous task pipeline protocol exists.
- Task 023 definition exists.
- Handoff report exists.
- PR body includes next task suggestion.

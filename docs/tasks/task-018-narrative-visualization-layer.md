# Task 018: Narrative Visualization Layer v1 Design

## Goal

Define the product boundary for a read-only Narrative Visualization Layer that can make DevCanvas story structure visible without changing the Tianyi writing experience.

## Scope

Allowed files:

- `docs/product/narrative-visualization-layer-v1.md`
- `docs/tasks/task-018-narrative-visualization-layer.md`
- `docs/handoff/task-018.md`

## Forbidden

- No UI implementation.
- No Tianyi writing surface changes.
- No kernel changes.
- No runtime changes.
- No system changes.
- No backend changes.
- No graph database.
- No skill execution logic.
- No editable visualization behavior.
- No data writeback into writing flow.

## Expected Behavior

After this task, the repository contains a product design definition for Narrative Visualization Layer v1.

The design must specify:

- The layer is independent and read-only.
- `mirofish` is a visual metaphor, not a system module.
- v1 includes Character Relation Map and Event Timeline only.
- Data comes only from existing `processDevCanvas()` output.
- The Tianyi writing surface remains frozen and unchanged.

## UI Impact

No direct UI impact in this task.

This task defines future UI direction only. It does not add routes, panels, components, styles, or visible app behavior.

## Risk

Low for this documentation task.

The future implementation risk is medium if the visualization layer is allowed to become a second AI operating surface. The design mitigates this by keeping v1 read-only and isolated from execution behavior.

## Validation

- Confirm the product design doc exists.
- Confirm the task definition exists.
- Confirm the handoff report exists.
- Confirm no code files changed.
- Confirm the design explicitly forbids kernel/runtime/system changes and writeback behavior.

## Done When

- `docs/product/narrative-visualization-layer-v1.md` defines the v1 product boundary.
- `docs/tasks/task-018-narrative-visualization-layer.md` defines task scope and constraints.
- `docs/handoff/task-018.md` summarizes the documentation task.
- PR body references the handoff report.

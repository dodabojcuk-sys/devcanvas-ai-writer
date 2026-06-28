# Task 020: Narrative Graph Snapshot Assembler v1

## Goal

Implement a one-way snapshot assembler that derives `NarrativeGraphSnapshot` from existing `processDevCanvas()` output.

This task creates the bridge from execution output to world-model snapshot without creating a feedback loop.

## Scope

Allowed files:

- `types/narrativeGraph.ts`
- `runtime/narrative/narrativeGraphSnapshotAssembler.ts`
- `docs/architecture/narrative-graph-snapshot-assembler-v1.md`
- `docs/tasks/task-020-narrative-graph-snapshot-assembler.md`
- `docs/handoff/task-020.md`

## Forbidden

- No UI implementation.
- No visualization rendering.
- No Tianyi writing surface changes.
- No kernel changes.
- No runtime adapter mutation.
- No system changes.
- No Graph -> Writing influence.
- No feedback loop.
- No event generation from snapshot.
- No graph editing.
- No graph persistence.

## Required Behavior

The assembler must:

- Accept processDevCanvas-style output fields.
- Derive `EventNode` values from event candidates.
- Derive session marker nodes from session state when available.
- Derive explanation hint nodes from explanation when available.
- Derive read-only timeline edges from source event order.
- Produce `confidenceMap`.
- Preserve read-only constraints.

## Source Rules

Allowed source fields:

- `events`
- `sessionState`
- `explanation`
- `executionGraph`
- response metadata

The assembler must not call kernel, runtime adapters, system adapters, UI state, or external services.

## UI Impact

None.

This task does not add a view, route, panel, component, style, or user-facing surface.

## Risk

Low.

The main risk is treating the snapshot as a control signal. This task keeps the assembler one-way and read-only.

## Validation

- Red/green local test verifies assembler behavior.
- Syntax check passes for the assembler and graph contract type file.
- Static scan confirms no UI/kernel/system files changed.
- PR body references `docs/handoff/task-020.md`.

## Done When

- `assembleNarrativeGraphSnapshot()` exists.
- It returns a read-only `NarrativeGraphSnapshot`.
- It produces `events`, `timeline`, and `confidenceMap`.
- It leaves `characters` and `relations` empty unless source data can support them.
- No execution layer consumes the snapshot.

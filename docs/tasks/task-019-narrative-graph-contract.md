# Task 019: Narrative Graph Contract v1

## Goal

Define the single data contract for DevCanvas narrative world-model structure.

This task establishes the graph data shape needed by future read-only visualization work without implementing visualization, inference, or execution behavior.

## Scope

Allowed files:

- `types/narrativeGraph.ts`
- `docs/architecture/narrative-graph-contract-v1.md`
- `docs/tasks/task-019-narrative-graph-contract.md`
- `docs/handoff/task-019.md`

## Forbidden

- No UI implementation.
- No visualization rendering.
- No Tianyi writing surface changes.
- No kernel changes.
- No runtime changes.
- No system changes.
- No inference engine.
- No narrative intelligence.
- No graph database.
- No graph persistence.
- No editable graph behavior.
- No writeback into writing flow.

## Required Structures

The contract must define:

- `CharacterNode`
- `RelationEdge`
- `EventNode`
- `TimelineEdge`
- `NarrativeGraphSnapshot`

## Source Rules

All graph data must be derived from existing `processDevCanvas()` output:

- `response.events`
- `response.sessionState`
- `response.explanation`

The contract must not allow source-free narrative claims.

## State Rules

Graph structures must support:

- `partial`
- `unknown`
- `inferred`

Any inferred structure must include confidence.

## Source Tracking

Every node and edge must include:

- `source`: `kernel | session | explanation`
- `confidence`: `0` to `1`
- `timestamp`
- `evidence`

## Expected Behavior

After this task, future graph visualization work has one stable type contract to consume.

No runtime behavior should change.

## UI Impact

None. This task adds a type contract and documentation only.

## Risk

Low. The primary risk is future misuse of the contract as an execution pathway. The documentation explicitly forbids writeback, routing, inference execution, and system mutation.

## Validation

- Confirm type contract exists.
- Confirm architecture doc exists.
- Confirm task definition exists.
- Confirm handoff report exists.
- Confirm no UI/kernel/runtime/system implementation files changed.
- Confirm type file contains no executable functions.

## Done When

- `types/narrativeGraph.ts` defines the v1 graph contract.
- `docs/architecture/narrative-graph-contract-v1.md` explains source and read-only constraints.
- `docs/tasks/task-019-narrative-graph-contract.md` records scope and forbidden behavior.
- `docs/handoff/task-019.md` records execution summary and validation.

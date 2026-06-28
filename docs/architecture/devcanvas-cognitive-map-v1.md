# DevCanvas Cognitive Map v1

## Purpose

This document is the human and Codex mental model for DevCanvas. It explains how the current codebase should be read without changing any runtime behavior.

Task 036 does not rename files, move modules, add systems, or change execution. It only defines the map that future maintenance work should use when navigating the repository.

## System Mental Model

DevCanvas is a writing product with a small execution core behind it.

Read the system in this order:

1. `app/tianyi` is the writing surface.
2. `core/engine/DevCanvasEngine.ts` is the preferred readable entry label for Codex.
3. `core/api/devcanvas.ts` is the single execution API contract.
4. `core/kernel` converts input into structured writing output.
5. `runtime` protects and organizes execution support.
6. `system` contains isolated capability boundaries.
7. `types` contains shared narrative contracts.

The product experience should feel like prose being continued. The code structure may contain execution terms, but the UI should not expose them to the user.

## Execution Flow Map

Primary flow:

```text
Tianyi writing surface
-> processDevCanvas(input, context?)
-> runDevCanvasKernel(input)
-> kernel response normalization
-> executionGraph + auditResult + explanation attachment
-> Tianyi narrative rendering
```

Readable entry aliases:

```text
DevCanvasEngine.execute()
-> processDevCanvas()

ExecutionKernel.execute()
-> processDevCanvasInput()

SystemGateway.call()
-> callSystemAdapter()
```

These aliases exist to reduce navigation ambiguity. They are not new execution paths.

## UI vs Kernel Separation Model

### `app/tianyi`

Human meaning: the visible writing room.

Responsibilities:

- Render the narrative writing surface.
- Accept a story continuation prompt.
- Shape output into prose when internal fallback text would otherwise leak.
- Keep internal execution terms out of the product UI.

Boundaries:

- UI may call `processDevCanvas()`.
- UI must not own kernel decisions.
- UI must not mutate graph, snapshot, runtime, or system state.
- UI must not expose backend labels as product controls.

### `core/kernel`

Human meaning: the writing decision core.

Responsibilities:

- Produce structured writing output.
- Keep the core response shape stable.
- Provide events, suggestions, and session state as background structure.

Boundaries:

- Kernel should not import UI.
- Kernel should not render product language.
- Kernel should not directly call visual layers.

### `core/api`

Human meaning: the public execution contract.

Responsibilities:

- Keep `processDevCanvas()` as the single source of truth.
- Preserve compatibility wrappers.
- Attach execution metadata without changing kernel behavior.

Boundaries:

- New code should prefer `processDevCanvas()` or `DevCanvasEngine.execute()`.
- Compatibility wrappers must remain wrappers.
- API changes must not create a second execution contract.

### `runtime`

Human meaning: execution support and safety rails.

Responsibilities:

- Provide guarded access to system boundaries.
- Host runtime checks, session helpers, and snapshot assembly wrappers.
- Expose `ExecutionRuntime` as a readable navigation index.

Boundaries:

- Runtime should not become a product feature layer.
- Runtime should not change the writing decision path unless an explicit maintenance task allows it.
- Snapshot helpers remain read-only projection support.

### `system`

Human meaning: isolated backend capability boundary.

Responsibilities:

- Hold backend-only system modules.
- Stay reachable through `SystemGateway` and guarded runtime flow.
- Avoid direct UI coupling.

Boundaries:

- UI must not import system modules directly.
- System modules must not create product screens.
- System expansion is outside maintenance scope.

### `types`

Human meaning: shared contracts for narrative data.

Responsibilities:

- Define narrative graph and snapshot shapes.
- Provide stable names such as `NarrativeGraph` and `NarrativeSnapshot`.
- Keep data contracts separate from execution behavior.

Boundaries:

- Types should not perform runtime work.
- Types should not imply graph writeback.
- Narrative graph data remains a read-only model unless a future approved product decision changes that boundary.

## Data Flow Explanation

Writing data flow:

```text
user prompt
-> Tianyi input state
-> processDevCanvas()
-> kernel response
-> narrative-shaped text
-> writing canvas
```

Execution metadata flow:

```text
processDevCanvas()
-> executionGraph
-> auditResult
-> explanation
```

Metadata is for development and review. It should not become visible product UI unless explicitly allowed by a maintenance task.

Narrative structure flow:

```text
kernel response events/session/explanation
-> NarrativeGraphContract
-> NarrativeSnapshot projection
-> optional read-only visualization
```

The narrative structure flow is read-only. It must not push decisions back into the writing flow.

## Codex Navigation Rules

When changing DevCanvas, use this lookup first:

- Need product text or visual polish: start in `app/tianyi`.
- Need execution API shape: start in `core/api/devcanvas.ts`.
- Need readable entry naming: start in `core/engine/DevCanvasEngine.ts`.
- Need kernel output behavior: inspect `core/kernel`, but do not change it unless explicitly allowed.
- Need guarded backend capability access: inspect `runtime/gateway/SystemGateway.ts`.
- Need runtime helpers: inspect `runtime/execution/ExecutionRuntime.ts`.
- Need narrative graph contracts: inspect `types/NarrativeGraphContract.ts` and `types/narrativeGraph.ts`.
- Need isolated system behavior: inspect `system`, but do not import it from UI.

## Anti-Misread Rules

Codex should not infer these false structures:

- `DevCanvasEngine.execute()` is not a new engine. It is a readable alias for `processDevCanvas()`.
- `SystemGateway` is not a new system. It is a readable alias over the existing system adapter boundary.
- `ExecutionRuntime` is not a new runtime model. It is a navigation index for existing runtime helpers.
- `NarrativeSnapshot` is not a mutable store. It is a read-only projection shape.
- `app/tianyi` is not an architecture layer. It is only the product writing surface.

## Maintenance Rule

This map is allowed to change only when the codebase structure already changed through an approved maintenance PR. Do not use this document as permission to expand architecture, add systems, or reopen product evolution.

# DevCanvas Architecture Freeze v1

## 1. Purpose

DevCanvas Architecture Freeze v1 records the current stable product architecture after the writing execution system, narrative graph contract, and snapshot assembler have been separated.

This document is not a new feature proposal. It is a boundary lock.

## 2. Frozen Architecture

DevCanvas is frozen into three independent pipelines:

```text
Writing Execution Pipeline
  input -> processDevCanvas() -> kernel/runtime/system -> response

World Model Pipeline
  processDevCanvas output -> NarrativeGraphContract -> SnapshotAssembler

Visualization Projection Layer
  NarrativeGraphSnapshot -> character map / event timeline design
```

## 3. Pipeline Responsibilities

### 3.1 Writing Execution Pipeline

The writing pipeline owns story continuation behavior.

It includes:

- `processDevCanvas()`
- kernel execution
- runtime adapter forwarding
- system isolation
- Tianyi writing flow
- text, suggestions, events, sessionState, and explanation output

It must not import, read, or consume narrative graph snapshots.

### 3.2 World Model Pipeline

The world model pipeline owns read-only representation.

It includes:

- `types/narrativeGraph.ts`
- `runtime/narrative/narrativeGraphSnapshotAssembler.ts`

It may derive a snapshot from existing `processDevCanvas()` output fields. It must not call `processDevCanvas()`, kernel functions, runtime adapters, system adapters, UI state, or external services.

### 3.3 Visualization Projection Layer

The visualization layer owns read-only display concepts.

It includes:

- character relation map design
- event timeline design

It must not become a second writing interface, graph editor, system cockpit, or execution controller.

## 4. Frozen Boundaries

The following boundaries are frozen:

```text
No graph -> writing behavior
No snapshot -> kernel/runtime/system execution
No visualization -> Tianyi writing flow
No UI -> graph mutation
No graph-derived event generation
```

## 5. Allowed Data Direction

Allowed:

```text
processDevCanvas output -> NarrativeGraphSnapshot -> read-only visualization
```

Forbidden:

```text
NarrativeGraphSnapshot -> processDevCanvas
NarrativeGraphSnapshot -> kernel routing
NarrativeGraphSnapshot -> runtime execution
NarrativeGraphSnapshot -> system mutation
Visualization UI -> Tianyi writing behavior
Visualization UI -> graph mutation
```

## 6. Current Invariants

The current architecture must preserve these invariants:

- `processDevCanvas()` remains the single writing execution entry point.
- `NarrativeGraphSnapshot` remains read-only.
- Snapshot constraints keep `readOnly: true`.
- Snapshot constraints keep `writebackAllowed: false`.
- Snapshot constraints keep `affectsWritingFlow: false`.
- Tianyi remains the only writing surface.
- Visualization remains a projection, not an execution layer.

## 7. Future Change Rule

Any future PR that crosses one of these boundaries must:

- declare the boundary being crossed
- update this freeze document
- update the relevant task document
- include risk analysis
- explain why the boundary change is required

Silent boundary crossing is not allowed.

## 8. Non-Goals

This freeze does not add:

- new kernel behavior
- new runtime behavior
- new system behavior
- new UI surfaces
- new visualization implementation
- graph feedback into writing
- narrative intelligence
- skill execution

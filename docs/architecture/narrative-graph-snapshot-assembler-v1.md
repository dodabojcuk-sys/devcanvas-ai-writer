# Narrative Graph Snapshot Assembler v1

## 1. Purpose

Narrative Graph Snapshot Assembler v1 derives a read-only `NarrativeGraphSnapshot` from existing `processDevCanvas()` output.

This is a one-way projection layer. It does not feed graph state back into writing, kernel routing, runtime execution, or system behavior.

## 2. Direction

Allowed direction:

```text
processDevCanvas output -> NarrativeGraphSnapshot
```

Forbidden directions:

```text
NarrativeGraphSnapshot -> writing flow
NarrativeGraphSnapshot -> kernel routing
NarrativeGraphSnapshot -> runtime execution
NarrativeGraphSnapshot -> system mutation
UI -> NarrativeGraphSnapshot mutation
```

## 3. Module

The assembler lives at:

```text
runtime/narrative/narrativeGraphSnapshotAssembler.ts
```

The module exports:

- `NarrativeGraphSnapshotAssemblerInput`
- `assembleNarrativeGraphSnapshot()`

## 4. Input Sources

Assembler input may contain only fields derived from `processDevCanvas()` output:

- `events`
- `sessionState`
- `explanation`
- `executionGraph`
- response metadata such as `responseId`, `inputHash`, and `timestamp`

The assembler must not read UI state, call kernel logic, call runtime adapters, call system adapters, or invent confirmed narrative facts.

## 5. Output Rules

The assembler returns a `NarrativeGraphSnapshot`.

The snapshot must include:

- `characters`
- `relations`
- `events`
- `timeline`
- `confidenceMap`
- read-only constraints

Because current source output does not include confirmed character or relationship data, v1 returns empty `characters` and `relations` arrays.

## 6. Event Projection

Event candidates become `EventNode` entries with:

- `source: "kernel"`
- `state: "inferred"`
- event confidence clamped to `0..1`
- source evidence

Session state may become a `session_marker` event node with:

- `source: "session"`
- `state: "partial"`
- confidence `1`

Explanation may become an `explanation_hint` event node with:

- `source: "explanation"`
- `state: "inferred"`
- confidence `0.6`

These event nodes describe derived structure only. They do not commit story events.

## 7. Timeline Projection

Sequential event candidates may become `TimelineEdge` entries.

Timeline edges are read-only and represent observed event order from source output. They do not schedule, trigger, generate, or rewrite story events.

## 8. Confidence Map

`confidenceMap` maps snapshot item IDs to confidence values.

It is a convenience projection for read-only consumers and must not be used as a control signal for writing behavior.

## 9. Non-Goals

This assembler does not implement:

- UI rendering.
- Visualization.
- Narrative intelligence.
- Graph persistence.
- Graph editing.
- Graph feedback.
- Kernel changes.
- Runtime mutation.
- System mutation.

## 10. Acceptance Criteria

The assembler is acceptable only if:

- It is one-way from existing output to snapshot.
- It produces read-only snapshots.
- It does not alter writing flow.
- It does not alter kernel, runtime, or system behavior.
- It does not generate new events beyond projecting source event candidates into snapshot nodes.
- It preserves source, confidence, timestamp, and evidence.

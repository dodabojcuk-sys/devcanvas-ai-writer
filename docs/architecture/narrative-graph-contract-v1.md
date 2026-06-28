# Narrative Graph Contract v1

## 1. Purpose

Narrative Graph Contract v1 defines the data shape for DevCanvas world-model structure.

It is a contract layer only. It does not perform visualization, inference, routing, writing, editing, or graph persistence.

The contract exists so future world-model views can share one stable structure before DevCanvas adds any narrative graph implementation.

## 2. Source of Truth

All graph data must be derived from existing `processDevCanvas()` output.

Allowed source fields:

```text
processDevCanvas()
-> response.events
-> response.sessionState
-> response.explanation
```

No data in this contract may be invented as confirmed narrative fact.

If the source output is incomplete, the graph must mark the affected node or edge as `partial`, `unknown`, or `inferred` with confidence.

## 3. Contract Types

The contract defines five primary structures:

- `CharacterNode`
- `RelationEdge`
- `EventNode`
- `TimelineEdge`
- `NarrativeGraphSnapshot`

These types live in:

```text
types/narrativeGraph.ts
```

## 4. Required Source Tracking

Every node and edge must include:

- `source`: `kernel | session | explanation`
- `confidence`: number from `0` to `1`
- `timestamp`: ISO-like timestamp string
- `evidence`: source references or notes

The contract does not allow source-free narrative graph claims.

## 5. Data State Rules

Every node and edge must declare one of these states:

- `partial`: source data exists but is incomplete.
- `unknown`: source data is missing or cannot confirm the structure.
- `inferred`: structure is derived from available output and must include confidence.

`inferred` does not mean confirmed fact. It means the structure is a traceable interpretation of existing execution output.

## 6. Read-Only Constraint

Narrative graph data is read-only in v1.

The snapshot constraint block must declare:

```ts
constraints: {
  readOnly: true;
  writebackAllowed: false;
  affectsWritingFlow: false;
}
```

A graph snapshot must never mutate Tianyi writing state, kernel routing, runtime execution, or system behavior.

## 7. CharacterNode

`CharacterNode` represents a character-like narrative entity that can be shown in a future relation map.

It may contain aliases, role, and scene relevance, but all fields must remain traceable to source output.

When the source does not provide enough information, character nodes should be omitted or marked `unknown` rather than treated as confirmed.

## 8. RelationEdge

`RelationEdge` represents a relationship between two character nodes.

It must include:

- `fromCharacterId`
- `toCharacterId`
- `direction`
- source tracking
- confidence

Relation edges must not be created as confirmed facts unless source output supports them.

## 9. EventNode

`EventNode` represents an event candidate, session marker, or explanation-derived event hint.

Allowed event types:

- `event_line_candidate`
- `session_marker`
- `explanation_hint`
- `unknown`

Event nodes describe story structure only. They do not commit events into the story.

## 10. TimelineEdge

`TimelineEdge` represents a read-only ordering relation between event nodes.

Allowed order values:

- `before`
- `after`
- `same_time`
- `unknown`

Timeline edges must not trigger scheduling, generation, rewriting, or system execution.

## 11. NarrativeGraphSnapshot

`NarrativeGraphSnapshot` is the single container for a derived world-model view.

It includes:

- snapshot metadata
- source response metadata
- character nodes
- relation edges
- event nodes
- timeline edges
- read-only constraints

Snapshot status may be:

- `empty`: no graph-ready source data exists.
- `partial`: some structure exists but is incomplete.
- `ready`: enough traced structure exists for read-only display.

## 12. Non-Goals

This contract does not implement:

- Visualization UI.
- Mirofish rendering.
- Graph editing.
- Graph persistence.
- Graph database storage.
- Long-form extraction.
- Causal reasoning.
- Narrative intelligence.
- World-state simulation.
- Skill DAG execution.
- Runtime routing.
- Kernel modification.

## 13. Acceptance Criteria

A future implementation satisfies this contract only if:

- It derives graph data from `processDevCanvas()` output.
- It preserves source, confidence, timestamp, and evidence on every node and edge.
- It marks uncertain data as `partial`, `unknown`, or `inferred`.
- It remains read-only.
- It does not alter Tianyi writing flow.
- It does not alter kernel, runtime, or system behavior.

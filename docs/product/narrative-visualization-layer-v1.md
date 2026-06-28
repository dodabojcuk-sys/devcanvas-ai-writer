# Narrative Visualization Layer v1

## 1. Product Intent

Narrative Visualization Layer v1 gives DevCanvas a read-only world-structure view without changing the writing experience.

The layer exists to make story structure visible after writing output exists. It is not part of the Tianyi writing surface, does not influence generation, and does not create a second AI system.

## 2. Product Positioning

This layer is an independent read-only world view.

It should help a writer see:

- Which characters are currently implied or present.
- How character relationships are shaping the scene.
- Which event candidates are emerging from the current continuation.
- How the current chapter and continuity state are evolving.

It must not interrupt the writing flow or appear as a system dashboard inside Tianyi.

## 3. Mirofish Definition

In this product context, `mirofish` is a visual metaphor for a whiteboard-style narrative map.

It is not:

- A standalone backend module.
- A new execution system.
- A new kernel pathway.
- A skill router.
- A graph database.

It is a presentation concept for relationship and timeline visualization.

## 4. v1 Scope

Narrative Visualization Layer v1 includes only two read-only views.

### Character Relation Map

A lightweight graph-like view that can show:

- Character nodes.
- Relationship lines.
- Relationship strength or uncertainty.
- Current scene relevance.

When character data is incomplete, the view should show a clear empty state instead of inventing relationships.

### Event Timeline

A read-only timeline that can show:

- Event candidates.
- Current chapter state.
- Continuity state.
- Suggested event order when available.

The timeline is descriptive only. It does not schedule, commit, trigger, or rewrite story events.

## 5. Data Source

v1 must use only the existing unified execution output:

```text
processDevCanvas()
-> response.events
-> response.sessionState
-> response.explanation
```

No new backend, graph store, extractor, ontology, or runtime pathway is allowed in v1.

If the available response does not contain enough structure, the visualization should render an empty or partial state.

## 6. Interaction Rules

v1 is read-only.

Allowed:

- View character nodes.
- View relationship hints.
- View event candidates.
- View timeline order.
- View empty states.

Forbidden:

- Editing graph nodes.
- Editing relationships.
- Reordering events.
- Clicking graph elements to change writing behavior.
- Sending data back into Tianyi.
- Influencing kernel routing.
- Influencing runtime execution.
- Writing to system state.

## 7. UI Boundary

The Tianyi writing surface remains frozen from Task 017.

Narrative Visualization Layer v1 must not:

- Add a panel to Tianyi.
- Add a tab system to Tianyi.
- Add a cockpit view to Tianyi.
- Add visible system terminology to the writing surface.
- Add a default visualization entry inside the writing canvas.

The visualization may exist as a separate route, standalone read-only view, or future analysis surface, but it must not change the default writing flow.

## 8. Visual Direction

The visual identity should feel like a calm narrative star map or astrolabe-inspired world view, while the implementation remains simple.

v1 should prefer:

- Sparse nodes.
- Light relationship lines.
- Clear labels.
- Readable timeline groups.
- Empty states that explain missing structure without implying failure.

v1 should avoid:

- Heavy cockpit styling.
- Debug-console aesthetics.
- Dense controls.
- Full 3D scenes.
- Complex force-directed graph behavior.

## 9. Non-Goals

v1 does not include:

- Location network.
- Faction graph.
- Causal graph.
- Item transfer graph.
- Full astrolabe visualization.
- Skill DAG visualization.
- Agent orchestration visualization.
- Editable story bible.
- Knowledge graph persistence.
- Real extraction from long-form novels.

These may be evaluated after v1 proves the read-only visualization boundary.

## 10. Acceptance Criteria

A future implementation of this design is acceptable only if:

- The writing surface remains unchanged.
- The visualization is read-only.
- The visualization uses existing `processDevCanvas()` output only.
- Missing data renders as empty or partial state.
- No kernel, runtime, or system behavior changes.
- No data is written back into the writing flow.
- The product still feels like writing first and visualization second.

## 11. Risk Notes

Primary risk: the visualization layer could become a second operating interface and undo the Task 017 product identity lock.

Mitigation: keep v1 independent, read-only, and disconnected from execution behavior.

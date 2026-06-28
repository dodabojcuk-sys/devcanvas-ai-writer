# WorldModelDraft Schema v1

## Goal

Creative Mode must render one unified world-model draft shape instead of assembling different preview sections directly in the UI component.

## Schema Owner

`types/worldModelDraft.ts` owns the shared schema:

- `WorldModelDraft`
- `CharacterNode`
- `RelationEdge`
- `LocationNode`
- `RuleNode`
- `TimelineEvent`
- `EvidenceMeta`

## Transformation Owner

`app/tianyi/worldModelDraftTransformer.ts` owns the single UI-side transformation:

```text
raw source text -> buildWorldModelDraft() -> WorldModelDraft
```

`TianyiImmersiveWorkspace.tsx` should call this function and render the returned draft. It should not define its own world-model schema or scatter extraction logic across UI sections.

## Evidence Contract

Every preview item must carry:

- `source`
- `chunkId`
- `paragraphIndex`
- `quote`
- `confidence`
- `evidenceId`

The draft also includes a top-level `evidence` array for review and future handoff.

## Boundaries

This schema alignment does not:

- call kernel
- call runtime
- call system
- mutate narrative graph
- write snapshot state
- add backend extraction
- add AI inference

Creative Mode remains a local source-reading preview until a future approved task explicitly connects it to a backend extraction path.

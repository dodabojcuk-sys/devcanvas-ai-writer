# Creative Mode World Ingestion v1

## Goal

Creative Mode gives the writing surface a small source-reading entry. A user can upload or paste existing story material, then review a structured draft of the story world before continuing to write.

## Scope

Allowed changes:

- `app/tianyi/TianyiImmersiveWorkspace.tsx`
- `app/globals.css`

This feature is UI-only in v1. It does not change kernel, runtime, system, graph, snapshot, skill, or workflow behavior.

## Behavior

The UI accepts:

- pasted story text
- a `.txt` or `.md` source file
- a raw idea description

The UI creates a local `WorldModelDraft` preview with:

- story summary
- character candidates
- relationship candidates
- location candidates
- world rule candidates
- timeline event candidates

Every preview item keeps evidence:

- `source_id`
- `chapter_id`
- `chunk_id`
- `paragraph_index`
- `char_start`
- `char_end`
- quote

## Boundaries

Creative Mode v1 must not:

- call a backend extraction service
- mutate narrative graph state
- write into snapshot state
- change writing execution
- add a new architecture layer
- introduce multi-agent reasoning

## Acceptance Criteria

- A user can paste source text and generate a readable world draft preview.
- A user can upload a local text file and generate the same preview.
- The writing continuation flow still works after using Creative Mode.
- The UI does not expose kernel, runtime, execution, debug, or graph wording.
- Next production build passes.
- Browser smoke test verifies paste, extraction preview, writing input, and continuation.

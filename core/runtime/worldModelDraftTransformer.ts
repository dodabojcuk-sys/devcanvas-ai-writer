import type {
  DecompositionChapter,
  DecompositionChunk,
  DecompositionEntityCandidate,
  DecompositionEvidence,
  DecompositionFactCandidate,
  DecompositionResult,
} from "./decompositionRuntimeEngine"
import {
  createEmptyWorldModelDraft,
  type WorldModelChapter,
  type WorldModelChunk,
  type WorldModelDraft,
  type WorldModelEntityCandidate,
  type WorldModelEventCandidate,
  type WorldModelEvidence,
} from "@/types/worldModelDraft"

function copyChapter(chapter: DecompositionChapter): WorldModelChapter {
  return {
    chapter_id: chapter.chapter_id,
    source_id: chapter.source_id,
    title: chapter.title,
    order_index: chapter.order_index,
    char_start: chapter.char_start,
    char_end: chapter.char_end,
  }
}

function copyChunk(chunk: DecompositionChunk): WorldModelChunk {
  return {
    chunk_id: chunk.chunk_id,
    source_id: chunk.source_id,
    chapter_id: chunk.chapter_id,
    order_index: chunk.order_index,
    paragraph_start: chunk.paragraph_start,
    paragraph_end: chunk.paragraph_end,
    char_start: chunk.char_start,
    char_end: chunk.char_end,
    text_hash: chunk.text_hash,
  }
}

function copyEvidence(evidence: DecompositionEvidence): WorldModelEvidence {
  return {
    evidence_id: evidence.evidence_id,
    source_id: evidence.source_id,
    chapter_id: evidence.chapter_id,
    chunk_id: evidence.chunk_id,
    paragraph_index: evidence.paragraph_index,
    char_start: evidence.char_start,
    char_end: evidence.char_end,
    quote: evidence.quote,
  }
}

function mapEntityCandidate(
  entity: DecompositionEntityCandidate,
  sourceId: string,
): WorldModelEntityCandidate {
  return {
    entity_id: entity.entity_id,
    entity_type: entity.entity_type,
    name: entity.name,
    aliases: [],
    source_id: sourceId,
    evidence_ids: [...entity.evidence_ids],
    confidence: entity.confidence,
    review_status: "candidate",
  }
}

function evidenceLookup(evidenceIndex: readonly DecompositionEvidence[]) {
  return new Map(evidenceIndex.map((evidence) => [evidence.evidence_id, evidence]))
}

function mapFactCandidateToEvent(
  fact: DecompositionFactCandidate,
  index: number,
  sourceId: string,
  evidenceById: ReadonlyMap<string, DecompositionEvidence>,
): WorldModelEventCandidate | null {
  const firstEvidence = evidenceById.get(fact.evidence_ids[0] ?? "")
  if (!firstEvidence) return null

  return {
    event_id: fact.fact_id.replace(/^fact_/, "event_"),
    source_id: sourceId,
    chapter_id: firstEvidence.chapter_id,
    chunk_id: firstEvidence.chunk_id,
    order_index: index + 1,
    description: fact.statement,
    participant_entity_ids: [],
    evidence_ids: [...fact.evidence_ids],
    confidence: fact.confidence,
    review_status: "candidate",
  }
}

function flattenEntities(result: DecompositionResult) {
  return [
    ...result.entities.characters,
    ...result.entities.locations,
    ...result.entities.items,
  ]
}

export function createWorldModelDraftFromDecomposition(decomposition: DecompositionResult): WorldModelDraft {
  const draft = createEmptyWorldModelDraft({
    sourceId: decomposition.metadata.source_id,
    title: decomposition.metadata.title,
    rawTextHash: decomposition.metadata.raw_text_hash,
  })
  const evidenceById = evidenceLookup(decomposition.evidenceIndex)

  draft.chapters = decomposition.chapters.map(copyChapter)
  draft.chunks = decomposition.chunks.map(copyChunk)
  draft.evidence = decomposition.evidenceIndex.map(copyEvidence)
  draft.entities = flattenEntities(decomposition).map((entity) => (
    mapEntityCandidate(entity, decomposition.metadata.source_id)
  ))
  draft.events = decomposition.facts
    .map((fact, index) => mapFactCandidateToEvent(fact, index, decomposition.metadata.source_id, evidenceById))
    .filter((event): event is WorldModelEventCandidate => event !== null)
  draft.warnings = [...decomposition.warnings]

  return draft
}

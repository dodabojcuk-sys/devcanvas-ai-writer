export type WorldModelReviewStatus = "candidate" | "confirmed" | "rejected" | "needs_more_evidence"

export type WorldModelEntityType = "character" | "location" | "item" | "custom"

export type WorldModelRelationType =
  | "character_character"
  | "character_item"
  | "character_location"
  | "character_custom"
  | "item_item"
  | "item_location"
  | "item_custom"
  | "location_location"
  | "location_custom"
  | "custom_custom"
  | "unknown"

export type WorldModelReviewAction =
  | "confirm"
  | "reject"
  | "change_type"
  | "merge"
  | "keep_separate"
  | "mark_as_inferred"
  | "mark_as_candidate"
  | "manual_override"

export interface WorldModelDraftMetadata {
  source_id: string
  title: string | null
  raw_text_hash: string | null
}

export interface WorldModelEvidence {
  evidence_id: string
  source_id: string
  chapter_id: string
  chunk_id: string
  paragraph_index: number
  char_start: number
  char_end: number
  quote: string
}

export interface WorldModelChapter {
  chapter_id: string
  source_id: string
  title: string
  order_index: number
  char_start: number
  char_end: number
}

export interface WorldModelChunk {
  chunk_id: string
  source_id: string
  chapter_id: string
  order_index: number
  paragraph_start: number
  paragraph_end: number
  char_start: number
  char_end: number
  text_hash: string
}

export interface WorldModelTraceableCandidate {
  source_id: string
  evidence_ids: string[]
  confidence: number
  review_status: WorldModelReviewStatus
}

export interface WorldModelEntityCandidate extends WorldModelTraceableCandidate {
  entity_id: string
  entity_type: WorldModelEntityType
  name: string
  aliases: string[]
}

export interface WorldModelEventCandidate extends WorldModelTraceableCandidate {
  event_id: string
  chapter_id: string
  chunk_id: string
  order_index: number
  description: string
  participant_entity_ids: string[]
}

export interface WorldModelRelationCandidate extends WorldModelTraceableCandidate {
  relation_id: string
  subject_entity_id: string
  object_entity_id: string
  relation_type: WorldModelRelationType
  is_inferred: boolean
  reasoning_note?: string
}

export interface WorldModelCausalLinkCandidate extends WorldModelTraceableCandidate {
  causal_id: string
  cause_event_id: string
  effect_event_id: string
  causal_type: "explicit" | "possible_cause" | "unknown"
  reasoning_note?: string
}

export interface WorldModelForeshadowingCandidate extends WorldModelTraceableCandidate {
  foreshadowing_id: string
  chapter_id: string
  chunk_id: string
  candidate_type: "setup" | "payoff" | "unresolved_question" | "unknown"
  description: string
  related_entity_ids: string[]
  related_event_ids: string[]
  candidate_reason: string
}

export interface WorldModelReviewDecision {
  decision_id: string
  target_id: string
  target_type: "entity" | "event" | "relation" | "causal_link" | "foreshadowing"
  action: WorldModelReviewAction
  reason: string
  reviewer: string
  reviewed_at: string
}

export interface WorldModelCorrectionPatch {
  patch_id: string
  source_id: string
  decision_id: string
  target_id: string
  before: Record<string, unknown>
  after: Record<string, unknown>
  evidence_ids: string[]
  manual_override: boolean
}

export interface WorldModelDraftReview {
  decisions: WorldModelReviewDecision[]
  corrections: WorldModelCorrectionPatch[]
}

export interface WorldModelDraft {
  schema_version: "world_model_draft_v1"
  metadata: WorldModelDraftMetadata
  chapters: WorldModelChapter[]
  chunks: WorldModelChunk[]
  evidence: WorldModelEvidence[]
  entities: WorldModelEntityCandidate[]
  events: WorldModelEventCandidate[]
  relations: WorldModelRelationCandidate[]
  causalLinks: WorldModelCausalLinkCandidate[]
  foreshadowing: WorldModelForeshadowingCandidate[]
  review: WorldModelDraftReview
  unsupportedClaims: string[]
  warnings: string[]
}

export interface CreateWorldModelDraftInput {
  sourceId: string
  title?: string | null
  rawTextHash?: string | null
}

export interface WorldModelDraftValidationResult {
  valid: boolean
  errors: string[]
}

export const WORLD_MODEL_DRAFT_FORBIDDEN_FIELDS = [
  "agentActions",
  "worldUpdates",
  "nextStoryState",
  "runtimeFrame",
  "systemCalls",
] as const

type CandidateCollection =
  | readonly WorldModelEntityCandidate[]
  | readonly WorldModelEventCandidate[]
  | readonly WorldModelRelationCandidate[]
  | readonly WorldModelCausalLinkCandidate[]
  | readonly WorldModelForeshadowingCandidate[]

export function createEmptyWorldModelDraft(input: CreateWorldModelDraftInput): WorldModelDraft {
  return {
    schema_version: "world_model_draft_v1",
    metadata: {
      source_id: input.sourceId,
      title: input.title ?? null,
      raw_text_hash: input.rawTextHash ?? null,
    },
    chapters: [],
    chunks: [],
    evidence: [],
    entities: [],
    events: [],
    relations: [],
    causalLinks: [],
    foreshadowing: [],
    review: {
      decisions: [],
      corrections: [],
    },
    unsupportedClaims: [],
    warnings: [],
  }
}

function validateCandidateCollection(
  errors: string[],
  evidenceIds: ReadonlySet<string>,
  collectionName: string,
  candidates: CandidateCollection,
) {
  candidates.forEach((candidate, index) => {
    if (!candidate.source_id) {
      errors.push(`${collectionName}[${index}] missing source_id`)
    }
    if (!candidate.evidence_ids.length) {
      errors.push(`${collectionName}[${index}] missing evidence_ids`)
    }
    for (const evidenceId of candidate.evidence_ids) {
      if (!evidenceIds.has(evidenceId)) {
        errors.push(`${collectionName}[${index}] references missing evidence ${evidenceId}`)
      }
    }
    if (candidate.confidence < 0 || candidate.confidence > 1) {
      errors.push(`${collectionName}[${index}] confidence out of range`)
    }
  })
}

export function validateWorldModelDraftTraceability(draft: WorldModelDraft): WorldModelDraftValidationResult {
  const errors: string[] = []
  const evidenceIds = new Set(draft.evidence.map((evidence) => evidence.evidence_id))

  if (!draft.metadata.source_id) {
    errors.push("metadata missing source_id")
  }

  for (const evidence of draft.evidence) {
    if (!evidence.source_id) {
      errors.push(`${evidence.evidence_id || "evidence"} missing source_id`)
    }
    if (!evidence.chapter_id || !evidence.chunk_id) {
      errors.push(`${evidence.evidence_id || "evidence"} missing chapter_id or chunk_id`)
    }
    if (!evidence.quote) {
      errors.push(`${evidence.evidence_id || "evidence"} missing quote`)
    }
    if (evidence.char_end <= evidence.char_start) {
      errors.push(`${evidence.evidence_id || "evidence"} invalid char range`)
    }
  }

  validateCandidateCollection(errors, evidenceIds, "entities", draft.entities)
  validateCandidateCollection(errors, evidenceIds, "events", draft.events)
  validateCandidateCollection(errors, evidenceIds, "relations", draft.relations)
  validateCandidateCollection(errors, evidenceIds, "causalLinks", draft.causalLinks)
  validateCandidateCollection(errors, evidenceIds, "foreshadowing", draft.foreshadowing)

  for (const field of WORLD_MODEL_DRAFT_FORBIDDEN_FIELDS) {
    if (Object.hasOwn(draft, field)) {
      errors.push(`forbidden field present: ${field}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

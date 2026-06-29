import type {
  WorldModelDraft,
  WorldModelEntityCandidate,
  WorldModelEventCandidate,
  WorldModelReviewStatus,
} from "@/types/worldModelDraft"

export type EventLineStoryLayer = "candidate" | "reviewed" | "canon"

export interface EventLineStoryRepositoryInput {
  repositoryId: string
  title?: string
  createdAt?: string
}

export interface EventLineStoryEntity {
  entity_id: string
  entity_type: WorldModelEntityCandidate["entity_type"]
  name: string
  source_id: string
  evidence_ids: string[]
  confidence: number
  review_status: WorldModelReviewStatus
}

export interface EventLineStoryEvent {
  event_id: string
  description: string
  source_id: string
  chapter_id: string
  chunk_id: string
  order_index: number
  participant_entity_ids: string[]
  evidence_ids: string[]
  confidence: number
  review_status: WorldModelReviewStatus
}

export interface EventLineStoryline {
  storyline_id: string
  title: string
  layer: EventLineStoryLayer
  version: number
  parent_storyline_id: string | null
  source_storyline_id: string | null
  source_draft_id: string | null
  source_label: string | null
  created_at: string
  entities: EventLineStoryEntity[]
  events: EventLineStoryEvent[]
}

export interface EventLineRepositoryLayerState {
  storylines: EventLineStoryline[]
}

export interface EventLineRepositoryHistoryEntry {
  history_id: string
  action: "import_world_model_draft" | "branch_storyline" | "pin_reviewed_storyline"
  target_storyline_id: string
  source_storyline_id: string | null
  layer: EventLineStoryLayer
  created_at: string
  note: string
}

export interface EventLineStoryRepository {
  repository_id: string
  title: string
  created_at: string
  layers: {
    candidate: EventLineRepositoryLayerState
    reviewed: EventLineRepositoryLayerState
    canon: EventLineRepositoryLayerState
  }
  history: EventLineRepositoryHistoryEntry[]
  warnings: string[]
}

export interface ImportWorldModelDraftInput {
  repository: EventLineStoryRepository
  draft: WorldModelDraft
  sourceLabel?: string
  createdAt?: string
}

export interface EventLineStoryRepositorySummary {
  candidateCount: number
  reviewedCount: number
  canonCount: number
}

export interface ImportWorldModelDraftResult {
  repository: EventLineStoryRepository
  summary: EventLineStoryRepositorySummary
  warnings: string[]
}

export interface CreateEventLineStoryBranchInput {
  repository: EventLineStoryRepository
  fromStorylineId: string
  title: string
  reason: string
  createdAt?: string
}

export interface EventLineStoryBranchResult {
  repository: EventLineStoryRepository
  branched: boolean
  warnings: string[]
}

export interface PinReviewedStorylineInput {
  repository: EventLineStoryRepository
  storylineId: string
  pinnedBy: string
  createdAt?: string
}

export interface PinReviewedStorylineResult {
  repository: EventLineStoryRepository
  pinned: boolean
  warnings: string[]
}

function cloneData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function nowIso(createdAt?: string) {
  return createdAt ?? new Date().toISOString()
}

function safeSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "_")
    .replace(/^_+|_+$/g, "")

  return slug || "storyline"
}

function repositorySummary(repository: EventLineStoryRepository): EventLineStoryRepositorySummary {
  return {
    candidateCount: repository.layers.candidate.storylines.length,
    reviewedCount: repository.layers.reviewed.storylines.length,
    canonCount: repository.layers.canon.storylines.length,
  }
}

function historyId(action: EventLineRepositoryHistoryEntry["action"], targetStorylineId: string, createdAt: string) {
  return `eventline_history_${action}_${safeSlug(targetStorylineId)}_${safeSlug(createdAt)}`
}

function storylineIdFor(layer: EventLineStoryLayer, draft: WorldModelDraft, suffix: string) {
  return `eventline_${layer}_${safeSlug(draft.metadata.source_id)}_${suffix}`
}

function entityFromCandidate(entity: WorldModelEntityCandidate): EventLineStoryEntity {
  return {
    entity_id: entity.entity_id,
    entity_type: entity.entity_type,
    name: entity.name,
    source_id: entity.source_id,
    evidence_ids: [...entity.evidence_ids],
    confidence: entity.confidence,
    review_status: entity.review_status,
  }
}

function eventFromCandidate(event: WorldModelEventCandidate): EventLineStoryEvent {
  return {
    event_id: event.event_id,
    description: event.description,
    source_id: event.source_id,
    chapter_id: event.chapter_id,
    chunk_id: event.chunk_id,
    order_index: event.order_index,
    participant_entity_ids: [...event.participant_entity_ids],
    evidence_ids: [...event.evidence_ids],
    confidence: event.confidence,
    review_status: event.review_status,
  }
}

function partitionDraftTargets(draft: WorldModelDraft) {
  return {
    candidate: {
      entities: draft.entities.filter((entity) => entity.review_status !== "confirmed" && entity.review_status !== "rejected"),
      events: draft.events.filter((event) => event.review_status !== "confirmed" && event.review_status !== "rejected"),
    },
    reviewed: {
      entities: draft.entities.filter((entity) => entity.review_status === "confirmed"),
      events: draft.events.filter((event) => event.review_status === "confirmed"),
    },
  }
}

function hasStorylineContent(storyline: EventLineStoryline) {
  return storyline.entities.length > 0 || storyline.events.length > 0
}

function createStoryline(input: {
  draft: WorldModelDraft
  layer: EventLineStoryLayer
  title: string
  sourceLabel: string | null
  createdAt: string
  entities: WorldModelEntityCandidate[]
  events: WorldModelEventCandidate[]
}): EventLineStoryline {
  return {
    storyline_id: storylineIdFor(input.layer, input.draft, safeSlug(input.sourceLabel ?? input.title)),
    title: input.title,
    layer: input.layer,
    version: 1,
    parent_storyline_id: null,
    source_storyline_id: null,
    source_draft_id: input.draft.metadata.source_id,
    source_label: input.sourceLabel,
    created_at: input.createdAt,
    entities: input.entities.map(entityFromCandidate),
    events: input.events.map(eventFromCandidate),
  }
}

function findStoryline(repository: EventLineStoryRepository, storylineId: string) {
  const layers: EventLineStoryLayer[] = ["candidate", "reviewed", "canon"]

  for (const layer of layers) {
    const storyline = repository.layers[layer].storylines.find((item) => item.storyline_id === storylineId)
    if (storyline) return storyline
  }

  return null
}

export function createEventLineStoryRepository(input: EventLineStoryRepositoryInput): EventLineStoryRepository {
  const createdAt = nowIso(input.createdAt)

  return {
    repository_id: input.repositoryId,
    title: input.title ?? "EventLine Story Repository",
    created_at: createdAt,
    layers: {
      candidate: { storylines: [] },
      reviewed: { storylines: [] },
      canon: { storylines: [] },
    },
    history: [],
    warnings: [],
  }
}

export function importWorldModelDraftToStoryRepository(input: ImportWorldModelDraftInput): ImportWorldModelDraftResult {
  const repository = cloneData(input.repository)
  const createdAt = nowIso(input.createdAt)
  const sourceLabel = input.sourceLabel ?? input.draft.metadata.title ?? "world_model_draft"
  const partitions = partitionDraftTargets(input.draft)
  const warnings: string[] = []
  const candidateStoryline = createStoryline({
    draft: input.draft,
    layer: "candidate",
    title: `${sourceLabel} · 候选`,
    sourceLabel,
    createdAt,
    entities: partitions.candidate.entities,
    events: partitions.candidate.events,
  })
  const reviewedStoryline = createStoryline({
    draft: input.draft,
    layer: "reviewed",
    title: `${sourceLabel} · 已复核`,
    sourceLabel,
    createdAt,
    entities: partitions.reviewed.entities,
    events: partitions.reviewed.events,
  })

  if (hasStorylineContent(candidateStoryline)) {
    repository.layers.candidate.storylines.push(candidateStoryline)
    repository.history.push({
      history_id: historyId("import_world_model_draft", candidateStoryline.storyline_id, createdAt),
      action: "import_world_model_draft",
      target_storyline_id: candidateStoryline.storyline_id,
      source_storyline_id: null,
      layer: "candidate",
      created_at: createdAt,
      note: "imported candidate layer from world model draft",
    })
  }
  if (hasStorylineContent(reviewedStoryline)) {
    repository.layers.reviewed.storylines.push(reviewedStoryline)
    repository.history.push({
      history_id: historyId("import_world_model_draft", reviewedStoryline.storyline_id, createdAt),
      action: "import_world_model_draft",
      target_storyline_id: reviewedStoryline.storyline_id,
      source_storyline_id: null,
      layer: "reviewed",
      created_at: createdAt,
      note: "imported reviewed layer from world model draft",
    })
  }
  if (!hasStorylineContent(candidateStoryline) && !hasStorylineContent(reviewedStoryline)) {
    warnings.push("world model draft contains no importable candidate or reviewed targets")
  }

  repository.warnings.push(...warnings)

  return {
    repository,
    summary: repositorySummary(repository),
    warnings,
  }
}

export function createEventLineStoryBranch(input: CreateEventLineStoryBranchInput): EventLineStoryBranchResult {
  const repository = cloneData(input.repository)
  const createdAt = nowIso(input.createdAt)
  const source = findStoryline(repository, input.fromStorylineId)
  const warnings: string[] = []

  if (!source) {
    warnings.push(`storyline not found: ${input.fromStorylineId}`)
    repository.warnings.push(...warnings)
    return { repository, branched: false, warnings }
  }

  const branch: EventLineStoryline = {
    ...cloneData(source),
    storyline_id: `eventline_candidate_branch_${safeSlug(input.title)}_${safeSlug(createdAt)}`,
    title: input.title,
    layer: "candidate",
    version: source.version + 1,
    parent_storyline_id: source.storyline_id,
    source_storyline_id: source.source_storyline_id ?? source.storyline_id,
    source_label: input.reason,
    created_at: createdAt,
  }

  repository.layers.candidate.storylines.push(branch)
  repository.history.push({
    history_id: historyId("branch_storyline", branch.storyline_id, createdAt),
    action: "branch_storyline",
    target_storyline_id: branch.storyline_id,
    source_storyline_id: source.storyline_id,
    layer: "candidate",
    created_at: createdAt,
    note: input.reason,
  })

  return { repository, branched: true, warnings }
}

export function pinReviewedStorylineToCanon(input: PinReviewedStorylineInput): PinReviewedStorylineResult {
  const repository = cloneData(input.repository)
  const createdAt = nowIso(input.createdAt)
  const reviewed = repository.layers.reviewed.storylines.find((storyline) => storyline.storyline_id === input.storylineId)
  const warnings: string[] = []

  if (!reviewed) {
    warnings.push("only storylines from the reviewed layer can be pinned to canon")
    repository.warnings.push(...warnings)
    return { repository, pinned: false, warnings }
  }

  const canonStoryline: EventLineStoryline = {
    ...cloneData(reviewed),
    storyline_id: `eventline_canon_${safeSlug(reviewed.title)}_${safeSlug(createdAt)}`,
    title: reviewed.title.replace("已复核", "正史"),
    layer: "canon",
    version: reviewed.version + 1,
    parent_storyline_id: reviewed.parent_storyline_id,
    source_storyline_id: reviewed.storyline_id,
    source_label: `pinned_by:${input.pinnedBy}`,
    created_at: createdAt,
  }

  repository.layers.canon.storylines.push(canonStoryline)
  repository.history.push({
    history_id: historyId("pin_reviewed_storyline", canonStoryline.storyline_id, createdAt),
    action: "pin_reviewed_storyline",
    target_storyline_id: canonStoryline.storyline_id,
    source_storyline_id: reviewed.storyline_id,
    layer: "canon",
    created_at: createdAt,
    note: `pinned by ${input.pinnedBy}`,
  })

  return { repository, pinned: true, warnings }
}

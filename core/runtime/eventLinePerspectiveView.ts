import type {
  EventLineStoryEntity,
  EventLineStoryEvent,
  EventLineStoryLayer,
  EventLineStoryRepository,
  EventLineStoryline,
} from "@/core/runtime/eventLineStoryRepository"
import type { WorldModelEntityType } from "@/types/worldModelDraft"

export type EventLinePerspectiveType = WorldModelEntityType
export type EventLinePerspectiveAxis = "time" | "event"

export interface EventLinePerspectiveTarget {
  type: EventLinePerspectiveType
  entityId?: string
  name?: string
}

export interface EventLinePerspectiveViewInput {
  repository: EventLineStoryRepository
  perspective: EventLinePerspectiveTarget
  layers?: EventLineStoryLayer[]
  axis?: EventLinePerspectiveAxis
}

export interface EventLinePerspectiveStorylineSlice {
  storyline_id: string
  title: string
  layer: EventLineStoryLayer
  version: number
  parent_storyline_id: string | null
  source_storyline_id: string | null
  matched_entities: EventLineStoryEntity[]
  matched_events: EventLineStoryEvent[]
  evidence_ids: string[]
}

export interface EventLinePerspectiveSummary {
  matchedStorylines: number
  matchedEntities: number
  matchedEvents: number
  evidenceIds: string[]
}

export interface EventLinePerspectiveView {
  repository_id: string
  perspective: EventLinePerspectiveTarget
  axis: EventLinePerspectiveAxis
  layers: EventLineStoryLayer[]
  storylines: EventLinePerspectiveStorylineSlice[]
  timeline: EventLineStoryEvent[]
  summary: EventLinePerspectiveSummary
  warnings: string[]
}

const DEFAULT_LAYERS: EventLineStoryLayer[] = ["candidate", "reviewed", "canon"]

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)].sort()
}

function compareEventsByTime(left: EventLineStoryEvent, right: EventLineStoryEvent) {
  const chapter = left.chapter_id.localeCompare(right.chapter_id)
  if (chapter !== 0) return chapter

  const chunk = left.chunk_id.localeCompare(right.chunk_id)
  if (chunk !== 0) return chunk

  return left.order_index - right.order_index || left.event_id.localeCompare(right.event_id)
}

function flattenStorylines(repository: EventLineStoryRepository, layers: EventLineStoryLayer[]) {
  return layers.flatMap((layer) => repository.layers[layer].storylines)
}

function targetHasLookup(target: EventLinePerspectiveTarget) {
  return Boolean(target.entityId?.trim() || target.name?.trim())
}

function entityMatchesTarget(entity: EventLineStoryEntity, target: EventLinePerspectiveTarget) {
  if (entity.entity_type !== target.type) return false
  if (target.entityId && entity.entity_id === target.entityId) return true
  if (target.name && normalize(entity.name) === normalize(target.name)) return true

  return false
}

function eventMatchesTarget(
  event: EventLineStoryEvent,
  matchedEntityIds: ReadonlySet<string>,
  target: EventLinePerspectiveTarget,
) {
  if (event.participant_entity_ids.some((entityId) => matchedEntityIds.has(entityId))) {
    return true
  }

  if (target.name) {
    return normalize(event.description).includes(normalize(target.name))
  }

  return false
}

function evidenceFromSlice(entities: EventLineStoryEntity[], events: EventLineStoryEvent[]) {
  return uniqueStrings([
    ...entities.flatMap((entity) => entity.evidence_ids),
    ...events.flatMap((event) => event.evidence_ids),
  ])
}

function createSlice(storyline: EventLineStoryline, target: EventLinePerspectiveTarget) {
  const matchedEntities = storyline.entities.filter((entity) => entityMatchesTarget(entity, target))
  const matchedEntityIds = new Set(matchedEntities.map((entity) => entity.entity_id))
  const matchedEvents = storyline.events.filter((event) => eventMatchesTarget(event, matchedEntityIds, target))
  const evidenceIds = evidenceFromSlice(matchedEntities, matchedEvents)

  if (matchedEntities.length === 0 && matchedEvents.length === 0) {
    return null
  }

  return {
    storyline_id: storyline.storyline_id,
    title: storyline.title,
    layer: storyline.layer,
    version: storyline.version,
    parent_storyline_id: storyline.parent_storyline_id,
    source_storyline_id: storyline.source_storyline_id,
    matched_entities: matchedEntities,
    matched_events: matchedEvents,
    evidence_ids: evidenceIds,
  } satisfies EventLinePerspectiveStorylineSlice
}

export function createEventLinePerspectiveView(input: EventLinePerspectiveViewInput): EventLinePerspectiveView {
  const layers = input.layers ?? DEFAULT_LAYERS
  const axis = input.axis ?? "time"
  const warnings: string[] = []

  if (!targetHasLookup(input.perspective)) {
    warnings.push("perspective target requires entityId or name")
  }

  const storylines = targetHasLookup(input.perspective)
    ? flattenStorylines(input.repository, layers)
        .map((storyline) => createSlice(storyline, input.perspective))
        .filter((slice): slice is EventLinePerspectiveStorylineSlice => Boolean(slice))
    : []

  const timeline = storylines.flatMap((storyline) => storyline.matched_events)
  if (axis === "time") {
    timeline.sort(compareEventsByTime)
  }

  const entityIds = new Set(storylines.flatMap((storyline) => storyline.matched_entities.map((entity) => entity.entity_id)))
  const eventIds = new Set(timeline.map((event) => event.event_id))
  const evidenceIds = uniqueStrings([
    ...storylines.flatMap((storyline) => storyline.evidence_ids),
    ...timeline.flatMap((event) => event.evidence_ids),
  ])

  if (targetHasLookup(input.perspective) && storylines.length === 0) {
    warnings.push("no storylines matched the requested perspective")
  }

  return {
    repository_id: input.repository.repository_id,
    perspective: { ...input.perspective },
    axis,
    layers: [...layers],
    storylines,
    timeline,
    summary: {
      matchedStorylines: storylines.length,
      matchedEntities: entityIds.size,
      matchedEvents: eventIds.size,
      evidenceIds,
    },
    warnings,
  }
}

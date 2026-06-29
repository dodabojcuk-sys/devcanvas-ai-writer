import type {
  EventLineStoryLayer,
  EventLineStoryRepository,
  EventLineStoryline,
} from "@/core/runtime/eventLineStoryRepository"

export type EventLineMultiverseEdgeType = "branch" | "pin" | "source"

export interface EventLineMultiverseViewInput {
  repository: EventLineStoryRepository
}

export interface EventLineMultiverseNode {
  storyline_id: string
  title: string
  layer: EventLineStoryLayer
  version: number
  parent_storyline_id: string | null
  source_storyline_id: string | null
  source_draft_id: string | null
  entityCount: number
  eventCount: number
  evidenceIds: string[]
}

export interface EventLineMultiverseEdge {
  edge_id: string
  from_storyline_id: string
  to_storyline_id: string
  edge_type: EventLineMultiverseEdgeType
}

export interface EventLineRollbackTarget {
  storyline_id: string
  title: string
  layer: EventLineStoryLayer
  version: number
  reason: "candidate_branch" | "reviewed_checkpoint" | "canon_checkpoint"
}

export interface EventLineMultiverseSummary {
  candidateCount: number
  reviewedCount: number
  canonCount: number
  edgeCount: number
  rollbackTargetCount: number
}

export interface EventLineMultiverseView {
  repository_id: string
  nodes: EventLineMultiverseNode[]
  edges: EventLineMultiverseEdge[]
  rollbackTargets: EventLineRollbackTarget[]
  summary: EventLineMultiverseSummary
  warnings: string[]
}

const LAYERS: EventLineStoryLayer[] = ["candidate", "reviewed", "canon"]

function uniqueStrings(values: string[]) {
  return [...new Set(values)].sort()
}

function storylinesFrom(repository: EventLineStoryRepository) {
  return LAYERS.flatMap((layer) => repository.layers[layer].storylines)
}

function evidenceIdsFrom(storyline: EventLineStoryline) {
  return uniqueStrings([
    ...storyline.entities.flatMap((entity) => entity.evidence_ids),
    ...storyline.events.flatMap((event) => event.evidence_ids),
  ])
}

function nodeFromStoryline(storyline: EventLineStoryline): EventLineMultiverseNode {
  return {
    storyline_id: storyline.storyline_id,
    title: storyline.title,
    layer: storyline.layer,
    version: storyline.version,
    parent_storyline_id: storyline.parent_storyline_id,
    source_storyline_id: storyline.source_storyline_id,
    source_draft_id: storyline.source_draft_id,
    entityCount: storyline.entities.length,
    eventCount: storyline.events.length,
    evidenceIds: evidenceIdsFrom(storyline),
  }
}

function edgeId(type: EventLineMultiverseEdgeType, from: string, to: string) {
  return `eventline_multiverse_${type}_${from}_to_${to}`
}

function edgeTypeFor(storyline: EventLineStoryline, targetId: string): EventLineMultiverseEdgeType {
  if (storyline.layer === "canon" && storyline.source_storyline_id === targetId) return "pin"
  if (storyline.parent_storyline_id === targetId) return "branch"

  return "source"
}

function rollbackReason(layer: EventLineStoryLayer): EventLineRollbackTarget["reason"] {
  if (layer === "canon") return "canon_checkpoint"
  if (layer === "reviewed") return "reviewed_checkpoint"

  return "candidate_branch"
}

function rollbackTargetFrom(storyline: EventLineStoryline): EventLineRollbackTarget {
  return {
    storyline_id: storyline.storyline_id,
    title: storyline.title,
    layer: storyline.layer,
    version: storyline.version,
    reason: rollbackReason(storyline.layer),
  }
}

function countLayer(repository: EventLineStoryRepository, layer: EventLineStoryLayer) {
  return repository.layers[layer].storylines.length
}

export function createEventLineMultiverseView(input: EventLineMultiverseViewInput): EventLineMultiverseView {
  const storylines = storylinesFrom(input.repository)
  const nodeIds = new Set(storylines.map((storyline) => storyline.storyline_id))
  const warnings: string[] = []
  const edges: EventLineMultiverseEdge[] = []

  for (const storyline of storylines) {
    for (const targetId of [storyline.parent_storyline_id, storyline.source_storyline_id]) {
      if (!targetId) continue
      if (!nodeIds.has(targetId)) {
        warnings.push(`missing parent storyline for ${storyline.storyline_id}: ${targetId}`)
        continue
      }

      const edgeType = edgeTypeFor(storyline, targetId)
      const edge = {
        edge_id: edgeId(edgeType, targetId, storyline.storyline_id),
        from_storyline_id: targetId,
        to_storyline_id: storyline.storyline_id,
        edge_type: edgeType,
      } satisfies EventLineMultiverseEdge

      if (!edges.some((item) => item.edge_id === edge.edge_id)) {
        edges.push(edge)
      }
    }
  }

  const rollbackTargets = storylines
    .filter((storyline) => storyline.events.length > 0 || storyline.entities.length > 0)
    .map(rollbackTargetFrom)

  return {
    repository_id: input.repository.repository_id,
    nodes: storylines.map(nodeFromStoryline),
    edges,
    rollbackTargets,
    summary: {
      candidateCount: countLayer(input.repository, "candidate"),
      reviewedCount: countLayer(input.repository, "reviewed"),
      canonCount: countLayer(input.repository, "canon"),
      edgeCount: edges.length,
      rollbackTargetCount: rollbackTargets.length,
    },
    warnings,
  }
}

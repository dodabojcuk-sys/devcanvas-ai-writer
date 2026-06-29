import type {
  WorldModelCausalLinkCandidate,
  WorldModelCorrectionPatch,
  WorldModelDraft,
  WorldModelEntityCandidate,
  WorldModelEventCandidate,
  WorldModelForeshadowingCandidate,
  WorldModelRelationCandidate,
  WorldModelReviewDecision,
  WorldModelReviewStatus,
} from "@/types/worldModelDraft"

type ReviewableTarget =
  | WorldModelEntityCandidate
  | WorldModelEventCandidate
  | WorldModelRelationCandidate
  | WorldModelCausalLinkCandidate
  | WorldModelForeshadowingCandidate

type ReviewTargetType = WorldModelReviewDecision["target_type"]

export interface WorldModelDraftReviewInput {
  draft: WorldModelDraft
  decisions: WorldModelReviewDecision[]
  corrections?: WorldModelCorrectionPatch[]
}

export interface WorldModelReviewTargetCollections {
  entities: WorldModelEntityCandidate[]
  events: WorldModelEventCandidate[]
  relations: WorldModelRelationCandidate[]
  causalLinks: WorldModelCausalLinkCandidate[]
  foreshadowing: WorldModelForeshadowingCandidate[]
}

export interface WorldModelDraftReviewHandoff {
  reviewedDraft: WorldModelDraft
  confirmed: WorldModelReviewTargetCollections
  rejected: WorldModelReviewTargetCollections
  corrections: WorldModelCorrectionPatch[]
  warnings: string[]
}

function cloneData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function emptyTargetCollections(): WorldModelReviewTargetCollections {
  return {
    entities: [],
    events: [],
    relations: [],
    causalLinks: [],
    foreshadowing: [],
  }
}

function collectionForTarget(
  draft: WorldModelDraft,
  targetType: ReviewTargetType,
): ReviewableTarget[] {
  switch (targetType) {
    case "entity":
      return draft.entities
    case "event":
      return draft.events
    case "relation":
      return draft.relations
    case "causal_link":
      return draft.causalLinks
    case "foreshadowing":
      return draft.foreshadowing
  }
}

function idForTarget(target: ReviewableTarget): string {
  if ("entity_id" in target) return target.entity_id
  if ("event_id" in target) return target.event_id
  if ("relation_id" in target) return target.relation_id
  if ("causal_id" in target) return target.causal_id
  return target.foreshadowing_id
}

function findTarget(
  draft: WorldModelDraft,
  decision: WorldModelReviewDecision,
): ReviewableTarget | undefined {
  return collectionForTarget(draft, decision.target_type).find((target) => (
    idForTarget(target) === decision.target_id
  ))
}

function statusForDecision(decision: WorldModelReviewDecision): WorldModelReviewStatus | null {
  switch (decision.action) {
    case "confirm":
      return "confirmed"
    case "reject":
      return "rejected"
    case "mark_as_candidate":
      return "candidate"
    case "mark_as_inferred":
    case "manual_override":
    case "change_type":
    case "merge":
    case "keep_separate":
      return null
  }
}

function applyDecision(target: ReviewableTarget, decision: WorldModelReviewDecision) {
  const reviewStatus = statusForDecision(decision)

  if (reviewStatus) {
    target.review_status = reviewStatus
  }
  if (decision.action === "mark_as_inferred" && "is_inferred" in target) {
    target.is_inferred = true
  }
}

function patchTarget(
  target: ReviewableTarget,
  correction: WorldModelCorrectionPatch,
  warnings: string[],
) {
  Object.assign(target as unknown as Record<string, unknown>, correction.after)

  if (correction.evidence_ids.length > 0) {
    target.evidence_ids = [...correction.evidence_ids]
  }
  if (target.evidence_ids.length === 0) {
    warnings.push(`correction ${correction.patch_id} leaves target without evidence: ${correction.target_id}`)
  }
}

function collectReviewedTargets(draft: WorldModelDraft) {
  const confirmed = emptyTargetCollections()
  const rejected = emptyTargetCollections()

  for (const entity of draft.entities) {
    if (entity.review_status === "confirmed") confirmed.entities.push(entity)
    if (entity.review_status === "rejected") rejected.entities.push(entity)
  }
  for (const event of draft.events) {
    if (event.review_status === "confirmed") confirmed.events.push(event)
    if (event.review_status === "rejected") rejected.events.push(event)
  }
  for (const relation of draft.relations) {
    if (relation.review_status === "confirmed") confirmed.relations.push(relation)
    if (relation.review_status === "rejected") rejected.relations.push(relation)
  }
  for (const causalLink of draft.causalLinks) {
    if (causalLink.review_status === "confirmed") confirmed.causalLinks.push(causalLink)
    if (causalLink.review_status === "rejected") rejected.causalLinks.push(causalLink)
  }
  for (const foreshadowing of draft.foreshadowing) {
    if (foreshadowing.review_status === "confirmed") confirmed.foreshadowing.push(foreshadowing)
    if (foreshadowing.review_status === "rejected") rejected.foreshadowing.push(foreshadowing)
  }

  return { confirmed, rejected }
}

export function applyWorldModelDraftReview(input: WorldModelDraftReviewInput): WorldModelDraftReviewHandoff {
  const reviewedDraft = cloneData(input.draft)
  const decisions = cloneData(input.decisions)
  const corrections = cloneData(input.corrections ?? [])
  const warnings: string[] = []
  const decisionsById = new Map(decisions.map((decision) => [decision.decision_id, decision]))

  for (const decision of decisions) {
    const target = findTarget(reviewedDraft, decision)

    if (!target) {
      warnings.push(`decision ${decision.decision_id} target not found: ${decision.target_type}:${decision.target_id}`)
      continue
    }
    applyDecision(target, decision)
  }

  for (const correction of corrections) {
    const decision = decisionsById.get(correction.decision_id)

    if (!decision) {
      warnings.push(`correction ${correction.patch_id} decision not found: ${correction.decision_id}`)
      continue
    }
    const target = findTarget(reviewedDraft, decision)

    if (!target) {
      warnings.push(`correction ${correction.patch_id} target not found: ${decision.target_type}:${correction.target_id}`)
      continue
    }
    patchTarget(target, correction, warnings)
  }

  reviewedDraft.review = {
    decisions,
    corrections,
  }

  const reviewedTargets = collectReviewedTargets(reviewedDraft)

  return {
    reviewedDraft,
    confirmed: reviewedTargets.confirmed,
    rejected: reviewedTargets.rejected,
    corrections,
    warnings,
  }
}

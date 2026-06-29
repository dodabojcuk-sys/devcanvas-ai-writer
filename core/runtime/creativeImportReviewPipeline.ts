import type { DecompositionRuntimeInput, DecompositionResult } from "./decompositionRuntimeEngine"
import { runDecompositionRuntime } from "./decompositionRuntimeEngine"
import { createWorldModelDraftFromDecomposition } from "./worldModelDraftTransformer"
import {
  applyWorldModelDraftReview,
  type WorldModelDraftReviewHandoff,
} from "./worldModelDraftReviewHandoff"
import type {
  WorldModelCorrectionPatch,
  WorldModelDraft,
  WorldModelReviewDecision,
} from "@/types/worldModelDraft"

export interface CreativeImportReviewPipelineInput extends DecompositionRuntimeInput {
  reviewDecisions?: WorldModelReviewDecision[]
  correctionPatches?: WorldModelCorrectionPatch[]
}

export interface CreativeImportReviewCounts {
  entities: number
  events: number
  relations: number
  causalLinks: number
  foreshadowing: number
}

export interface CreativeImportReviewPreview {
  sourceId: string
  title: string | null
  chapterCount: number
  chunkCount: number
  evidenceCount: number
  candidateCounts: CreativeImportReviewCounts
  confirmedCounts: CreativeImportReviewCounts
  rejectedCounts: CreativeImportReviewCounts
  warnings: string[]
  markdownSummary: string
}

export interface CreativeImportReviewPipelineResult {
  decomposition: DecompositionResult
  draft: WorldModelDraft
  review: WorldModelDraftReviewHandoff
  preview: CreativeImportReviewPreview
}

function emptyCounts(): CreativeImportReviewCounts {
  return {
    entities: 0,
    events: 0,
    relations: 0,
    causalLinks: 0,
    foreshadowing: 0,
  }
}

function candidateCounts(draft: WorldModelDraft): CreativeImportReviewCounts {
  return {
    entities: draft.entities.length,
    events: draft.events.length,
    relations: draft.relations.length,
    causalLinks: draft.causalLinks.length,
    foreshadowing: draft.foreshadowing.length,
  }
}

function reviewedCounts(review: WorldModelDraftReviewHandoff, key: "confirmed" | "rejected"): CreativeImportReviewCounts {
  const collection = review[key]

  return {
    entities: collection.entities.length,
    events: collection.events.length,
    relations: collection.relations.length,
    causalLinks: collection.causalLinks.length,
    foreshadowing: collection.foreshadowing.length,
  }
}

function renderPreviewMarkdown(args: {
  decomposition: DecompositionResult
  draft: WorldModelDraft
  review: WorldModelDraftReviewHandoff
  previewBase: Omit<CreativeImportReviewPreview, "markdownSummary">
}) {
  const candidate = args.previewBase.candidateCounts
  const confirmed = args.previewBase.confirmedCounts
  const rejected = args.previewBase.rejectedCounts
  const warnings = args.previewBase.warnings.length ? args.previewBase.warnings : ["none"]

  return [
    "# Creative Import Review Preview",
    "",
    `Source: ${args.previewBase.sourceId}`,
    `Title: ${args.previewBase.title ?? "Untitled"}`,
    "",
    "## Imported Structure",
    "",
    `- chapters: ${args.previewBase.chapterCount}`,
    `- chunks: ${args.previewBase.chunkCount}`,
    `- evidence anchors: ${args.previewBase.evidenceCount}`,
    "",
    "## Candidates",
    "",
    `- candidate entities: ${candidate.entities}`,
    `- candidate events: ${candidate.events}`,
    `- candidate relations: ${candidate.relations}`,
    `- candidate causal links: ${candidate.causalLinks}`,
    `- candidate foreshadowing: ${candidate.foreshadowing}`,
    "",
    "## Review State",
    "",
    `- confirmed entities: ${confirmed.entities}`,
    `- confirmed events: ${confirmed.events}`,
    `- rejected entities: ${rejected.entities}`,
    `- rejected events: ${rejected.events}`,
    "",
    "## Warnings",
    "",
    ...warnings.map((warning) => `- ${warning}`),
    "",
  ].join("\n")
}

function buildPreview(
  decomposition: DecompositionResult,
  draft: WorldModelDraft,
  review: WorldModelDraftReviewHandoff,
): CreativeImportReviewPreview {
  const candidate = candidateCounts(draft)
  const confirmed = reviewedCounts(review, "confirmed")
  const rejected = reviewedCounts(review, "rejected")
  const warnings = Array.from(new Set([
    ...decomposition.warnings,
    ...draft.warnings,
    ...review.warnings,
  ]))
  const previewBase: Omit<CreativeImportReviewPreview, "markdownSummary"> = {
    sourceId: draft.metadata.source_id,
    title: draft.metadata.title,
    chapterCount: draft.chapters.length,
    chunkCount: draft.chunks.length,
    evidenceCount: draft.evidence.length,
    candidateCounts: candidate,
    confirmedCounts: confirmed,
    rejectedCounts: rejected,
    warnings,
  }

  return {
    ...previewBase,
    markdownSummary: renderPreviewMarkdown({
      decomposition,
      draft,
      review,
      previewBase,
    }),
  }
}

export function runCreativeImportReviewPipeline(
  input: CreativeImportReviewPipelineInput,
): CreativeImportReviewPipelineResult {
  const decomposition = runDecompositionRuntime(input)
  const draft = createWorldModelDraftFromDecomposition(decomposition)
  const review = applyWorldModelDraftReview({
    draft,
    decisions: input.reviewDecisions ?? [],
    corrections: input.correctionPatches ?? [],
  })

  return {
    decomposition,
    draft,
    review,
    preview: buildPreview(decomposition, draft, review),
  }
}

export const EMPTY_CREATIVE_IMPORT_REVIEW_COUNTS = emptyCounts()

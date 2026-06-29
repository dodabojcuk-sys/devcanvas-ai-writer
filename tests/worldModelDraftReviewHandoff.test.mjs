import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const outDir = join(root, ".tmp/world-model-draft-review-handoff-tests")
const scopedAliasDir = join(outDir, "node_modules/@")

function compileReviewHandoffForTests() {
  rmSync(outDir, { recursive: true, force: true })
  execFileSync("../devcanvas/node_modules/.bin/tsc", ["-p", "tsconfig.kernel-behavior-tests.json", "--outDir", outDir], {
    cwd: root,
    stdio: "pipe",
  })
  mkdirSync(scopedAliasDir, { recursive: true })
  for (const name of ["core", "runtime", "system", "types"]) {
    const target = join(outDir, name)
    const link = join(scopedAliasDir, name)
    if (!existsSync(link)) {
      symlinkSync(target, link, "dir")
    }
  }
}

compileReviewHandoffForTests()

process.on("exit", () => {
  rmSync(outDir, { recursive: true, force: true })
})

const requireFromHandoff = createRequire(join(outDir, "core/runtime/worldModelDraftReviewHandoff.js"))
const worldModelDraft = requireFromHandoff(join(outDir, "types/worldModelDraft.js"))
const reviewHandoff = requireFromHandoff(join(outDir, "core/runtime/worldModelDraftReviewHandoff.js"))

function draftWithReviewTargets() {
  const draft = worldModelDraft.createEmptyWorldModelDraft({
    sourceId: "source_review_book",
    title: "复查测试旧书",
    rawTextHash: "hash_review_book",
  })

  draft.evidence.push(
    {
      evidence_id: "evidence_lincheng",
      source_id: "source_review_book",
      chapter_id: "chapter_001",
      chunk_id: "chunk_001",
      paragraph_index: 1,
      char_start: 10,
      char_end: 12,
      quote: "林澈",
    },
    {
      evidence_id: "evidence_suwan",
      source_id: "source_review_book",
      chapter_id: "chapter_001",
      chunk_id: "chunk_001",
      paragraph_index: 2,
      char_start: 28,
      char_end: 30,
      quote: "苏晚",
    },
    {
      evidence_id: "evidence_event",
      source_id: "source_review_book",
      chapter_id: "chapter_001",
      chunk_id: "chunk_001",
      paragraph_index: 3,
      char_start: 40,
      char_end: 52,
      quote: "他拾起青铜令",
    },
  )

  draft.entities.push(
    {
      entity_id: "entity_lincheng",
      source_id: "source_review_book",
      entity_type: "character",
      name: "林澈",
      aliases: [],
      evidence_ids: ["evidence_lincheng"],
      confidence: 0.82,
      review_status: "candidate",
    },
    {
      entity_id: "entity_unknown",
      source_id: "source_review_book",
      entity_type: "character",
      name: "白衣人",
      aliases: [],
      evidence_ids: ["evidence_suwan"],
      confidence: 0.45,
      review_status: "candidate",
    },
  )

  draft.events.push({
    event_id: "event_token",
    source_id: "source_review_book",
    chapter_id: "chapter_001",
    chunk_id: "chunk_001",
    order_index: 1,
    description: "林澈拾起青铜令",
    participant_entity_ids: ["entity_lincheng"],
    evidence_ids: ["evidence_event"],
    confidence: 0.74,
    review_status: "candidate",
  })

  return draft
}

test("review handoff confirms selected candidates while preserving source and evidence", () => {
  const draft = draftWithReviewTargets()

  const result = reviewHandoff.applyWorldModelDraftReview({
    draft,
    decisions: [
      {
        decision_id: "decision_confirm_entity",
        target_id: "entity_lincheng",
        target_type: "entity",
        action: "confirm",
        reason: "Evidence names the character directly.",
        reviewer: "author",
        reviewed_at: "2026-06-30T00:00:00.000Z",
      },
      {
        decision_id: "decision_confirm_event",
        target_id: "event_token",
        target_type: "event",
        action: "confirm",
        reason: "The action is explicit in the source quote.",
        reviewer: "author",
        reviewed_at: "2026-06-30T00:01:00.000Z",
      },
    ],
  })

  assert.equal(result.confirmed.entities.length, 1)
  assert.equal(result.confirmed.entities[0].entity_id, "entity_lincheng")
  assert.equal(result.confirmed.entities[0].review_status, "confirmed")
  assert.deepEqual(result.confirmed.entities[0].evidence_ids, ["evidence_lincheng"])
  assert.equal(result.confirmed.entities[0].source_id, "source_review_book")
  assert.equal(result.confirmed.events.length, 1)
  assert.equal(result.reviewedDraft.review.decisions.length, 2)
  assert.equal(draft.entities[0].review_status, "candidate")
})

test("review handoff excludes rejected candidates from confirmed output", () => {
  const draft = draftWithReviewTargets()

  const result = reviewHandoff.applyWorldModelDraftReview({
    draft,
    decisions: [
      {
        decision_id: "decision_reject_unknown",
        target_id: "entity_unknown",
        target_type: "entity",
        action: "reject",
        reason: "The source does not confirm this is a stable character.",
        reviewer: "author",
        reviewed_at: "2026-06-30T00:02:00.000Z",
      },
    ],
  })

  assert.equal(result.reviewedDraft.entities.find((entity) => entity.entity_id === "entity_unknown").review_status, "rejected")
  assert.equal(result.confirmed.entities.some((entity) => entity.entity_id === "entity_unknown"), false)
  assert.equal(result.rejected.entities.length, 1)
  assert.equal(result.rejected.entities[0].entity_id, "entity_unknown")
})

test("review handoff applies correction patches without dropping evidence", () => {
  const draft = draftWithReviewTargets()

  const result = reviewHandoff.applyWorldModelDraftReview({
    draft,
    decisions: [
      {
        decision_id: "decision_confirm_corrected",
        target_id: "entity_unknown",
        target_type: "entity",
        action: "confirm",
        reason: "Reviewer identifies the person as Su Wan from nearby text.",
        reviewer: "author",
        reviewed_at: "2026-06-30T00:03:00.000Z",
      },
    ],
    corrections: [
      {
        patch_id: "patch_suwan_name",
        source_id: "source_review_book",
        decision_id: "decision_confirm_corrected",
        target_id: "entity_unknown",
        before: { name: "白衣人" },
        after: { name: "苏晚", aliases: ["白衣人"] },
        evidence_ids: ["evidence_suwan"],
        manual_override: true,
      },
    ],
  })

  const corrected = result.confirmed.entities.find((entity) => entity.entity_id === "entity_unknown")

  assert.equal(corrected.name, "苏晚")
  assert.deepEqual(corrected.aliases, ["白衣人"])
  assert.deepEqual(corrected.evidence_ids, ["evidence_suwan"])
  assert.equal(result.reviewedDraft.review.corrections.length, 1)
  assert.equal(result.warnings.length, 0)
})

test("review handoff warns on missing targets and keeps draft traceable", () => {
  const draft = draftWithReviewTargets()

  const result = reviewHandoff.applyWorldModelDraftReview({
    draft,
    decisions: [
      {
        decision_id: "decision_missing",
        target_id: "entity_missing",
        target_type: "entity",
        action: "confirm",
        reason: "Invalid target.",
        reviewer: "author",
        reviewed_at: "2026-06-30T00:04:00.000Z",
      },
    ],
  })
  const validation = worldModelDraft.validateWorldModelDraftTraceability(result.reviewedDraft)

  assert.equal(result.warnings.includes("decision decision_missing target not found: entity:entity_missing"), true)
  assert.equal(validation.valid, true)
  assert.deepEqual(validation.errors, [])
})

test("review handoff output exposes no runtime execution fields", () => {
  const result = reviewHandoff.applyWorldModelDraftReview({
    draft: draftWithReviewTargets(),
    decisions: [],
  })
  const serialized = JSON.stringify(result)

  for (const forbiddenField of ["agentActions", "worldUpdates", "nextStoryState", "runtimeFrame", "systemCalls"]) {
    assert.equal(Object.hasOwn(result, forbiddenField), false)
    assert.equal(serialized.includes(forbiddenField), false)
  }
})

test("review handoff stays isolated from UI system kernel execution and governance", () => {
  const source = readFileSync(join(root, "core/runtime/worldModelDraftReviewHandoff.ts"), "utf8")

  assert.doesNotMatch(source, /@\/app|from ["']\.\.\/\.\.\/app/)
  assert.doesNotMatch(source, /@\/system|runtime\/systemAdapter|callSystemAdapter/)
  assert.doesNotMatch(source, /core\/kernel\/index|processDevCanvasInput|processDevCanvasProductInput/)
  assert.doesNotMatch(source, /skillExecutionRouter|skillExecutionGate|skillExecutionTrace/)
  assert.doesNotMatch(source, /agentActions|nextStoryState|worldUpdates|systemCalls/)
})

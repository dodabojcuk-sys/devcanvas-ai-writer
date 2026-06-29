import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const outDir = join(root, ".tmp/creative-import-review-pipeline-tests")
const scopedAliasDir = join(outDir, "node_modules/@")

function compilePipelineForTests() {
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

compilePipelineForTests()

process.on("exit", () => {
  rmSync(outDir, { recursive: true, force: true })
})

const requireFromPipeline = createRequire(join(outDir, "core/runtime/creativeImportReviewPipeline.js"))
const pipeline = requireFromPipeline(join(outDir, "core/runtime/creativeImportReviewPipeline.js"))

const sampleChapter = [
  "第一章 旧城夜雨",
  "",
  "林澈在青岚城的雨巷里握紧青铜令，听见远处钟声三响。",
  "白衣少女苏晚从归云山赶来，提醒他不要打开那本黑书。",
].join("\n")

test("creative import review pipeline turns pasted chapter text into a reviewable preview", () => {
  const result = pipeline.runCreativeImportReviewPipeline({
    rawText: sampleChapter,
    sourceId: "source_creative_preview",
    title: "创意导入测试",
    chunkSizeChars: 90,
  })

  assert.equal(result.preview.sourceId, "source_creative_preview")
  assert.equal(result.preview.title, "创意导入测试")
  assert.equal(result.preview.chapterCount, 1)
  assert.ok(result.preview.chunkCount >= 1)
  assert.ok(result.preview.evidenceCount >= 4)
  assert.ok(result.preview.candidateCounts.entities >= 4)
  assert.ok(result.preview.candidateCounts.events >= 2)
  assert.equal(result.preview.confirmedCounts.entities, 0)
  assert.equal(result.preview.rejectedCounts.entities, 0)
  assert.match(result.preview.markdownSummary, /# Creative Import Review Preview/)
  assert.match(result.preview.markdownSummary, /创意导入测试/)
  assert.match(result.preview.markdownSummary, /candidate entities/)
})

test("creative import review pipeline applies review decisions and keeps confirmed evidence visible", () => {
  const firstPass = pipeline.runCreativeImportReviewPipeline({
    rawText: sampleChapter,
    sourceId: "source_creative_review",
    title: "复查导入测试",
  })
  const entityToConfirm = firstPass.draft.entities.find((entity) => entity.name === "林澈")
  const eventToConfirm = firstPass.draft.events[0]
  const entityToReject = firstPass.draft.entities.find((entity) => entity.name === "黑书")

  assert.ok(entityToConfirm)
  assert.ok(eventToConfirm)
  assert.ok(entityToReject)

  const reviewed = pipeline.runCreativeImportReviewPipeline({
    rawText: sampleChapter,
    sourceId: "source_creative_review",
    title: "复查导入测试",
    reviewDecisions: [
      {
        decision_id: "decision_confirm_lincheng",
        target_id: entityToConfirm.entity_id,
        target_type: "entity",
        action: "confirm",
        reason: "角色在原文中直接出现。",
        reviewer: "author",
        reviewed_at: "2026-06-30T01:00:00.000Z",
      },
      {
        decision_id: "decision_confirm_event",
        target_id: eventToConfirm.event_id,
        target_type: "event",
        action: "confirm",
        reason: "事件是原文中的明确行为。",
        reviewer: "author",
        reviewed_at: "2026-06-30T01:01:00.000Z",
      },
      {
        decision_id: "decision_reject_book",
        target_id: entityToReject.entity_id,
        target_type: "entity",
        action: "reject",
        reason: "第一轮先不把黑书确认成稳定资产。",
        reviewer: "author",
        reviewed_at: "2026-06-30T01:02:00.000Z",
      },
    ],
  })

  assert.equal(reviewed.preview.confirmedCounts.entities, 1)
  assert.equal(reviewed.preview.confirmedCounts.events, 1)
  assert.equal(reviewed.preview.rejectedCounts.entities, 1)
  assert.equal(reviewed.review.confirmed.entities[0].name, "林澈")
  assert.deepEqual(reviewed.review.confirmed.entities[0].evidence_ids, entityToConfirm.evidence_ids)
  assert.match(reviewed.preview.markdownSummary, /confirmed entities: 1/)
  assert.match(reviewed.preview.markdownSummary, /rejected entities: 1/)
})

test("creative import review pipeline keeps empty input safe and previewable", () => {
  const result = pipeline.runCreativeImportReviewPipeline({
    rawText: " \n\n ",
    sourceId: "source_empty_creative",
  })

  assert.equal(result.preview.chapterCount, 0)
  assert.equal(result.preview.chunkCount, 0)
  assert.equal(result.preview.evidenceCount, 0)
  assert.equal(result.preview.warnings.includes("empty_input"), true)
  assert.match(result.preview.markdownSummary, /empty_input/)
})

test("creative import review pipeline exposes no runtime execution fields", () => {
  const result = pipeline.runCreativeImportReviewPipeline({ rawText: sampleChapter })
  const serialized = JSON.stringify(result)

  for (const forbiddenField of ["agentActions", "worldUpdates", "nextStoryState", "runtimeFrame", "systemCalls"]) {
    assert.equal(Object.hasOwn(result, forbiddenField), false)
    assert.equal(serialized.includes(forbiddenField), false)
  }
})

test("creative import review pipeline stays isolated from UI system kernel execution and governance", () => {
  const source = readFileSync(join(root, "core/runtime/creativeImportReviewPipeline.ts"), "utf8")

  assert.doesNotMatch(source, /@\/app|from ["']\.\.\/\.\.\/app/)
  assert.doesNotMatch(source, /@\/system|runtime\/systemAdapter|callSystemAdapter/)
  assert.doesNotMatch(source, /core\/kernel\/index|processDevCanvasInput|processDevCanvasProductInput/)
  assert.doesNotMatch(source, /skillExecutionRouter|skillExecutionGate|skillExecutionTrace/)
  assert.doesNotMatch(source, /agentActions|nextStoryState|worldUpdates|systemCalls/)
})

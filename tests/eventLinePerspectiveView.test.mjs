import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const outDir = join(root, ".tmp/event-line-perspective-view-tests")
const scopedAliasDir = join(outDir, "node_modules/@")

function compilePerspectiveViewForTests() {
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

compilePerspectiveViewForTests()

process.on("exit", () => {
  rmSync(outDir, { recursive: true, force: true })
})

const requireFromPerspective = createRequire(join(outDir, "core/runtime/eventLinePerspectiveView.js"))
const worldModelDraft = requireFromPerspective(join(outDir, "types/worldModelDraft.js"))
const repositoryModule = requireFromPerspective(join(outDir, "core/runtime/eventLineStoryRepository.js"))
const perspectiveModule = requireFromPerspective(join(outDir, "core/runtime/eventLinePerspectiveView.js"))

function perspectiveDraftFixture() {
  const draft = worldModelDraft.createEmptyWorldModelDraft({
    sourceId: "source_perspective",
    title: "视角切换测试",
  })

  draft.evidence.push(
    {
      evidence_id: "ev_lincheng",
      source_id: "source_perspective",
      chapter_id: "chapter_001",
      chunk_id: "chunk_001",
      paragraph_index: 1,
      char_start: 0,
      char_end: 2,
      quote: "林澈",
    },
    {
      evidence_id: "ev_suwan",
      source_id: "source_perspective",
      chapter_id: "chapter_001",
      chunk_id: "chunk_001",
      paragraph_index: 2,
      char_start: 3,
      char_end: 5,
      quote: "苏晚",
    },
    {
      evidence_id: "ev_token",
      source_id: "source_perspective",
      chapter_id: "chapter_001",
      chunk_id: "chunk_002",
      paragraph_index: 3,
      char_start: 9,
      char_end: 12,
      quote: "青铜令",
    },
    {
      evidence_id: "ev_gate",
      source_id: "source_perspective",
      chapter_id: "chapter_002",
      chunk_id: "chunk_003",
      paragraph_index: 5,
      char_start: 20,
      char_end: 24,
      quote: "旧城门",
    },
  )

  draft.entities.push(
    {
      entity_id: "entity_lincheng",
      source_id: "source_perspective",
      entity_type: "character",
      name: "林澈",
      aliases: [],
      evidence_ids: ["ev_lincheng"],
      confidence: 0.95,
      review_status: "confirmed",
    },
    {
      entity_id: "entity_suwan",
      source_id: "source_perspective",
      entity_type: "character",
      name: "苏晚",
      aliases: [],
      evidence_ids: ["ev_suwan"],
      confidence: 0.9,
      review_status: "confirmed",
    },
    {
      entity_id: "entity_token",
      source_id: "source_perspective",
      entity_type: "item",
      name: "青铜令",
      aliases: [],
      evidence_ids: ["ev_token"],
      confidence: 0.88,
      review_status: "confirmed",
    },
    {
      entity_id: "entity_gate",
      source_id: "source_perspective",
      entity_type: "location",
      name: "旧城门",
      aliases: [],
      evidence_ids: ["ev_gate"],
      confidence: 0.82,
      review_status: "confirmed",
    },
  )

  draft.events.push(
    {
      event_id: "event_002_token",
      source_id: "source_perspective",
      chapter_id: "chapter_001",
      chunk_id: "chunk_002",
      order_index: 2,
      description: "林澈拾起青铜令",
      participant_entity_ids: ["entity_lincheng", "entity_token"],
      evidence_ids: ["ev_token"],
      confidence: 0.89,
      review_status: "confirmed",
    },
    {
      event_id: "event_001_meet",
      source_id: "source_perspective",
      chapter_id: "chapter_001",
      chunk_id: "chunk_001",
      order_index: 1,
      description: "林澈在雨巷遇见苏晚",
      participant_entity_ids: ["entity_lincheng", "entity_suwan"],
      evidence_ids: ["ev_lincheng", "ev_suwan"],
      confidence: 0.91,
      review_status: "confirmed",
    },
    {
      event_id: "event_003_gate",
      source_id: "source_perspective",
      chapter_id: "chapter_002",
      chunk_id: "chunk_003",
      order_index: 1,
      description: "苏晚抵达旧城门",
      participant_entity_ids: ["entity_suwan", "entity_gate"],
      evidence_ids: ["ev_gate"],
      confidence: 0.84,
      review_status: "confirmed",
    },
  )

  return draft
}

function repositoryFixture() {
  const imported = repositoryModule.importWorldModelDraftToStoryRepository({
    repository: repositoryModule.createEventLineStoryRepository({ repositoryId: "repo_perspective" }),
    draft: perspectiveDraftFixture(),
    sourceLabel: "复核稿",
    createdAt: "2026-06-30T03:00:00.000Z",
  })
  const reviewed = imported.repository.layers.reviewed.storylines[0]

  return repositoryModule.pinReviewedStorylineToCanon({
    repository: imported.repository,
    storylineId: reviewed.storyline_id,
    pinnedBy: "author",
    createdAt: "2026-06-30T03:10:00.000Z",
  }).repository
}

test("event line perspective view filters storylines by character perspective", () => {
  const view = perspectiveModule.createEventLinePerspectiveView({
    repository: repositoryFixture(),
    perspective: { type: "character", entityId: "entity_lincheng" },
    layers: ["reviewed"],
  })

  assert.equal(view.summary.matchedStorylines, 1)
  assert.equal(view.summary.matchedEntities, 1)
  assert.equal(view.summary.matchedEvents, 2)
  assert.deepEqual(
    view.timeline.map((event) => event.event_id),
    ["event_001_meet", "event_002_token"],
  )
  assert.deepEqual(view.storylines[0].matched_entities.map((entity) => entity.name), ["林澈"])
})

test("event line perspective view supports item and location name lookup", () => {
  const repository = repositoryFixture()
  const itemView = perspectiveModule.createEventLinePerspectiveView({
    repository,
    perspective: { type: "item", name: "青铜令" },
    layers: ["canon"],
  })
  const locationView = perspectiveModule.createEventLinePerspectiveView({
    repository,
    perspective: { type: "location", name: "旧城门" },
    layers: ["canon"],
  })

  assert.deepEqual(itemView.timeline.map((event) => event.description), ["林澈拾起青铜令"])
  assert.deepEqual(locationView.timeline.map((event) => event.description), ["苏晚抵达旧城门"])
})

test("event line perspective view preserves evidence ids for review and rollback", () => {
  const view = perspectiveModule.createEventLinePerspectiveView({
    repository: repositoryFixture(),
    perspective: { type: "character", name: "苏晚" },
    layers: ["reviewed"],
  })

  assert.deepEqual(view.summary.evidenceIds.sort(), ["ev_gate", "ev_lincheng", "ev_suwan"].sort())
  assert.ok(view.timeline.every((event) => event.evidence_ids.length > 0))
})

test("event line perspective view warns on empty perspective target without mutating repository", () => {
  const repository = repositoryFixture()
  const before = JSON.stringify(repository)
  const view = perspectiveModule.createEventLinePerspectiveView({
    repository,
    perspective: { type: "custom" },
  })

  assert.equal(view.summary.matchedStorylines, 0)
  assert.match(view.warnings.join("\n"), /entityId or name/)
  assert.equal(JSON.stringify(repository), before)
})

test("event line perspective view stays isolated from UI system governance and kernel execution", () => {
  const source = readFileSync(join(root, "core/runtime/eventLinePerspectiveView.ts"), "utf8")

  assert.doesNotMatch(source, /@\/app|from ["']\.\.\/\.\.\/app/)
  assert.doesNotMatch(source, /@\/system|runtime\/systemAdapter|callSystemAdapter/)
  assert.doesNotMatch(source, /skillExecutionRouter|skillExecutionGate|skillExecutionTrace/)
  assert.doesNotMatch(source, /processDevCanvasInput|processDevCanvasProductInput/)
  assert.doesNotMatch(source, /agentActions|nextStoryState|worldUpdates|runtimeFrame|systemCalls/)
})

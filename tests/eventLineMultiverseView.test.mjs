import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const outDir = join(root, ".tmp/event-line-multiverse-view-tests")
const scopedAliasDir = join(outDir, "node_modules/@")

function compileMultiverseViewForTests() {
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

compileMultiverseViewForTests()

process.on("exit", () => {
  rmSync(outDir, { recursive: true, force: true })
})

const requireFromMultiverse = createRequire(join(outDir, "core/runtime/eventLineMultiverseView.js"))
const worldModelDraft = requireFromMultiverse(join(outDir, "types/worldModelDraft.js"))
const repositoryModule = requireFromMultiverse(join(outDir, "core/runtime/eventLineStoryRepository.js"))
const multiverseModule = requireFromMultiverse(join(outDir, "core/runtime/eventLineMultiverseView.js"))

function draftFixture() {
  const draft = worldModelDraft.createEmptyWorldModelDraft({
    sourceId: "source_multiverse",
    title: "多元宇宙视图测试",
  })

  draft.evidence.push({
    evidence_id: "ev_multiverse",
    source_id: "source_multiverse",
    chapter_id: "chapter_001",
    chunk_id: "chunk_001",
    paragraph_index: 1,
    char_start: 0,
    char_end: 6,
    quote: "林澈进入旧城",
  })
  draft.entities.push({
    entity_id: "entity_lincheng",
    source_id: "source_multiverse",
    entity_type: "character",
    name: "林澈",
    aliases: [],
    evidence_ids: ["ev_multiverse"],
    confidence: 0.93,
    review_status: "confirmed",
  })
  draft.events.push({
    event_id: "event_enter_city",
    source_id: "source_multiverse",
    chapter_id: "chapter_001",
    chunk_id: "chunk_001",
    order_index: 1,
    description: "林澈进入旧城",
    participant_entity_ids: ["entity_lincheng"],
    evidence_ids: ["ev_multiverse"],
    confidence: 0.92,
    review_status: "confirmed",
  })

  return draft
}

function branchedRepositoryFixture() {
  const imported = repositoryModule.importWorldModelDraftToStoryRepository({
    repository: repositoryModule.createEventLineStoryRepository({ repositoryId: "repo_multiverse" }),
    draft: draftFixture(),
    sourceLabel: "复核稿",
    createdAt: "2026-06-30T04:00:00.000Z",
  })
  const reviewed = imported.repository.layers.reviewed.storylines[0]
  const branchA = repositoryModule.createEventLineStoryBranch({
    repository: imported.repository,
    fromStorylineId: reviewed.storyline_id,
    title: "林澈选择打开黑书",
    reason: "作者探索黑书分支",
    createdAt: "2026-06-30T04:05:00.000Z",
  })
  const branchB = repositoryModule.createEventLineStoryBranch({
    repository: branchA.repository,
    fromStorylineId: reviewed.storyline_id,
    title: "林澈选择封存黑书",
    reason: "作者探索封存分支",
    createdAt: "2026-06-30T04:06:00.000Z",
  })

  return repositoryModule.pinReviewedStorylineToCanon({
    repository: branchB.repository,
    storylineId: reviewed.storyline_id,
    pinnedBy: "author",
    createdAt: "2026-06-30T04:10:00.000Z",
  }).repository
}

test("event line multiverse view maps repository storylines into nodes and lineage edges", () => {
  const view = multiverseModule.createEventLineMultiverseView({
    repository: branchedRepositoryFixture(),
  })

  assert.equal(view.summary.reviewedCount, 1)
  assert.equal(view.summary.candidateCount, 2)
  assert.equal(view.summary.canonCount, 1)
  assert.equal(view.nodes.length, 4)
  assert.equal(view.edges.filter((edge) => edge.edge_type === "branch").length, 2)
  assert.equal(view.edges.filter((edge) => edge.edge_type === "pin").length, 1)
})

test("event line multiverse view exposes rollback targets without mutating repository", () => {
  const repository = branchedRepositoryFixture()
  const before = JSON.stringify(repository)
  const view = multiverseModule.createEventLineMultiverseView({ repository })

  assert.ok(view.rollbackTargets.length >= 3)
  assert.ok(view.rollbackTargets.every((target) => target.storyline_id))
  assert.equal(JSON.stringify(repository), before)
})

test("event line multiverse view reports missing ancestry as warnings instead of inventing nodes", () => {
  const repository = branchedRepositoryFixture()
  repository.layers.candidate.storylines[0].parent_storyline_id = "missing_storyline"
  const view = multiverseModule.createEventLineMultiverseView({ repository })

  assert.match(view.warnings.join("\n"), /missing parent storyline/)
  assert.equal(view.nodes.some((node) => node.storyline_id === "missing_storyline"), false)
})

test("event line multiverse view stays isolated from UI system governance and kernel execution", () => {
  const source = readFileSync(join(root, "core/runtime/eventLineMultiverseView.ts"), "utf8")

  assert.doesNotMatch(source, /@\/app|from ["']\.\.\/\.\.\/app/)
  assert.doesNotMatch(source, /@\/system|runtime\/systemAdapter|callSystemAdapter/)
  assert.doesNotMatch(source, /skillExecutionRouter|skillExecutionGate|skillExecutionTrace/)
  assert.doesNotMatch(source, /processDevCanvasInput|processDevCanvasProductInput/)
  assert.doesNotMatch(source, /agentActions|nextStoryState|worldUpdates|runtimeFrame|systemCalls/)
})

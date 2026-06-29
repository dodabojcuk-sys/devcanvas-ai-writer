import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const outDir = join(root, ".tmp/world-model-draft-transformer-tests")
const scopedAliasDir = join(outDir, "node_modules/@")

function compileTransformerForTests() {
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

compileTransformerForTests()

process.on("exit", () => {
  rmSync(outDir, { recursive: true, force: true })
})

const requireFromTransformer = createRequire(join(outDir, "core/runtime/worldModelDraftTransformer.js"))
const decompositionRuntime = requireFromTransformer(join(outDir, "core/runtime/decompositionRuntimeEngine.js"))
const transformer = requireFromTransformer(join(outDir, "core/runtime/worldModelDraftTransformer.js"))
const worldModelDraft = requireFromTransformer(join(outDir, "types/worldModelDraft.js"))

const sampleText = [
  "第一章 旧城夜雨",
  "",
  "林澈在青岚城的雨巷里握紧青铜令，听见远处钟声三响。",
  "白衣少女苏晚从归云山赶来，提醒他不要打开那本黑书。",
].join("\n")

test("world model draft transformer maps decomposition output into traceable draft candidates", () => {
  const decomposition = decompositionRuntime.runDecompositionRuntime({
    rawText: sampleText,
    sourceId: "source_transform_book",
    title: "转换测试旧书",
    chunkSizeChars: 90,
  })

  const draft = transformer.createWorldModelDraftFromDecomposition(decomposition)
  const validation = worldModelDraft.validateWorldModelDraftTraceability(draft)

  assert.equal(draft.schema_version, "world_model_draft_v1")
  assert.equal(draft.metadata.source_id, "source_transform_book")
  assert.equal(draft.metadata.title, "转换测试旧书")
  assert.equal(draft.metadata.raw_text_hash, decomposition.metadata.raw_text_hash)
  assert.equal(draft.chapters.length, decomposition.chapters.length)
  assert.equal(draft.chunks.length, decomposition.chunks.length)
  assert.deepEqual(draft.evidence, decomposition.evidenceIndex)
  assert.ok(draft.entities.some((entity) => entity.name === "林澈"))
  assert.ok(draft.entities.some((entity) => entity.name === "青岚城"))
  assert.ok(draft.entities.every((entity) => entity.review_status === "candidate"))
  assert.ok(draft.entities.every((entity) => entity.source_id === "source_transform_book"))
  assert.ok(draft.events.length >= decomposition.facts.length)
  assert.ok(draft.events.every((event) => event.review_status === "candidate"))
  assert.ok(draft.events.every((event) => event.evidence_ids.length > 0))
  assert.equal(validation.valid, true)
  assert.deepEqual(validation.errors, [])
})

test("world model draft transformer keeps empty decompositions reviewable and non-executing", () => {
  const decomposition = decompositionRuntime.runDecompositionRuntime({
    rawText: " \n\n ",
    sourceId: "source_empty_book",
  })

  const draft = transformer.createWorldModelDraftFromDecomposition(decomposition)

  assert.equal(draft.metadata.source_id, "source_empty_book")
  assert.deepEqual(draft.chapters, [])
  assert.deepEqual(draft.chunks, [])
  assert.deepEqual(draft.evidence, [])
  assert.deepEqual(draft.entities, [])
  assert.deepEqual(draft.events, [])
  assert.equal(draft.warnings.includes("empty_input"), true)
  assert.equal(worldModelDraft.validateWorldModelDraftTraceability(draft).valid, true)
})

test("world model draft transformer output exposes no runtime execution fields", () => {
  const decomposition = decompositionRuntime.runDecompositionRuntime({ rawText: sampleText })
  const draft = transformer.createWorldModelDraftFromDecomposition(decomposition)
  const serialized = JSON.stringify(draft)

  for (const forbiddenField of ["agentActions", "worldUpdates", "nextStoryState", "runtimeFrame", "systemCalls"]) {
    assert.equal(Object.hasOwn(draft, forbiddenField), false)
    assert.equal(serialized.includes(forbiddenField), false)
  }
})

test("world model draft transformer stays isolated from UI system kernel execution and governance", () => {
  const source = readFileSync(join(root, "core/runtime/worldModelDraftTransformer.ts"), "utf8")

  assert.doesNotMatch(source, /@\/app|from ["']\.\.\/\.\.\/app/)
  assert.doesNotMatch(source, /@\/system|runtime\/systemAdapter|callSystemAdapter/)
  assert.doesNotMatch(source, /core\/kernel\/index|processDevCanvasInput|processDevCanvasProductInput/)
  assert.doesNotMatch(source, /skillExecutionRouter|skillExecutionGate|skillExecutionTrace/)
  assert.doesNotMatch(source, /agentActions|nextStoryState|worldUpdates|systemCalls/)
})

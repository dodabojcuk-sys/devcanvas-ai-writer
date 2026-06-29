import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const outDir = join(root, ".tmp/decomposition-runtime-tests")
const scopedAliasDir = join(outDir, "node_modules/@")

function compileRuntimeForDecompositionTests() {
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

compileRuntimeForDecompositionTests()

process.on("exit", () => {
  rmSync(outDir, { recursive: true, force: true })
})

const requireFromRuntime = createRequire(join(outDir, "core/runtime/decompositionRuntimeEngine.js"))
const decompositionRuntime = requireFromRuntime(join(outDir, "core/runtime/decompositionRuntimeEngine.js"))

const sampleText = [
  "第一章 旧城夜雨",
  "",
  "林澈在青岚城的雨巷里握紧青铜令，听见远处钟声三响。",
  "白衣少女苏晚从归云山赶来，提醒他不要打开那本黑书。",
  "",
  "第二章 山门微光",
  "",
  "归云山的石阶上，苏晚把残破灯交给林澈，说青岚城已经有人失踪。",
].join("\n")

test("decomposition runtime handles empty input without creating unsupported claims", () => {
  const result = decompositionRuntime.runDecompositionRuntime({ rawText: "   \n\n  " })

  assert.deepEqual(result.chapters, [])
  assert.deepEqual(result.chunks, [])
  assert.deepEqual(result.facts, [])
  assert.deepEqual(result.entities.characters, [])
  assert.deepEqual(result.entities.locations, [])
  assert.deepEqual(result.entities.items, [])
  assert.equal(result.evidenceIndex.length, 0)
  assert.match(result.warnings.join("\n"), /empty_input/)
  assert.match(result.markdownReport, /No source text/)
})

test("decomposition runtime creates chapters chunks evidence and entity candidates from sample text", () => {
  const result = decompositionRuntime.runDecompositionRuntime({
    rawText: sampleText,
    sourceId: "source_test_book",
    title: "测试旧书",
    chunkSizeChars: 80,
    overlapChars: 0,
  })

  assert.equal(result.metadata.source_id, "source_test_book")
  assert.equal(result.metadata.title, "测试旧书")
  assert.equal(result.chapters.length, 2)
  assert.ok(result.chunks.length >= 2)
  assert.ok(result.evidenceIndex.length >= 4)
  assert.ok(result.entities.characters.some((entity) => entity.name === "林澈"))
  assert.ok(result.entities.characters.some((entity) => entity.name === "苏晚"))
  assert.ok(result.entities.locations.some((entity) => entity.name === "青岚城"))
  assert.ok(result.entities.locations.some((entity) => entity.name === "归云山"))
  assert.ok(result.entities.items.some((entity) => entity.name === "青铜令"))
  assert.ok(result.entities.items.some((entity) => entity.name === "黑书"))
  assert.match(result.markdownReport, /# Decomposition Report/)
  assert.match(result.markdownReport, /测试旧书/)
})

test("decomposition runtime filters obvious character extraction noise from scene phrases", () => {
  const result = decompositionRuntime.runDecompositionRuntime({
    rawText: sampleText,
    sourceId: "source_noise_filter_book",
    chunkSizeChars: 120,
    overlapChars: 0,
  })
  const characterNames = result.entities.characters.map((entity) => entity.name)

  assert.ok(characterNames.includes("林澈"))
  assert.ok(characterNames.includes("苏晚"))
  assert.equal(characterNames.includes("雨巷里"), false)
  assert.equal(characterNames.includes("女苏晚"), false)
  assert.equal(characterNames.includes("归云山"), false)
  assert.equal(characterNames.includes("他不要"), false)
})

test("decomposition runtime preserves source chapter chunk paragraph and character evidence fields", () => {
  const result = decompositionRuntime.runDecompositionRuntime({
    rawText: sampleText,
    sourceId: "source_evidence_book",
    chunkSizeChars: 120,
    overlapChars: 0,
  })

  for (const evidence of result.evidenceIndex) {
    assert.equal(evidence.source_id, "source_evidence_book")
    assert.match(evidence.chapter_id, /^chapter_\d{3}$/)
    assert.match(evidence.chunk_id, /^chunk_\d{3}$/)
    assert.equal(typeof evidence.paragraph_index, "number")
    assert.equal(typeof evidence.char_start, "number")
    assert.equal(typeof evidence.char_end, "number")
    assert.ok(evidence.char_end > evidence.char_start)
    assert.ok(sampleText.includes(evidence.quote))
  }

  const entityCandidates = [
    ...result.entities.characters,
    ...result.entities.locations,
    ...result.entities.items,
  ]
  assert.ok(entityCandidates.length > 0)
  for (const entity of entityCandidates) {
    assert.ok(entity.evidence_ids.length > 0)
    assert.ok(entity.confidence > 0)
    assert.equal(entity.status, "candidate")
  }

  for (const fact of result.facts) {
    assert.ok(fact.evidence_ids.length > 0)
    assert.equal(fact.kind, "factual_extraction")
  }
})

test("decomposition runtime does not expose narrative simulation fields", () => {
  const result = decompositionRuntime.runDecompositionRuntime({ rawText: sampleText })

  assert.equal(Object.hasOwn(result, "agentActions"), false)
  assert.equal(Object.hasOwn(result, "worldUpdates"), false)
  assert.equal(Object.hasOwn(result, "nextStoryState"), false)
  assert.equal(Object.hasOwn(result, "narrativeEvents"), false)
  assert.equal(Object.hasOwn(result, "continuation"), false)
})

test("decomposition runtime stays isolated from UI system governance and narrative execution", () => {
  const source = readFileSync(join(root, "core/runtime/decompositionRuntimeEngine.ts"), "utf8")

  assert.doesNotMatch(source, /@\/app|from ["']\.\.\/\.\.\/app/)
  assert.doesNotMatch(source, /skillExecutionRouter|skillExecutionGate|skillExecutionTrace/)
  assert.doesNotMatch(source, /system\/nuwa|Nuwa|agentActions|nextStoryState|worldUpdates/)
  assert.doesNotMatch(source, /processDevCanvasInput|processDevCanvasProductInput/)
})

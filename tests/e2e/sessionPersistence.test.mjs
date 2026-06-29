import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, rmSync, symlinkSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../..", import.meta.url))
const outDir = join(root, ".tmp/e2e-session-persistence-tests")
const scopedAliasDir = join(outDir, "node_modules/@")

function compileRuntimeForSessionTests() {
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

compileRuntimeForSessionTests()

process.on("exit", () => {
  rmSync(outDir, { recursive: true, force: true })
})

const requireFromRuntime = createRequire(join(outDir, "core/kernel/index.js"))
const kernel = requireFromRuntime(join(outDir, "core/kernel/index.js"))
const sessionStore = requireFromRuntime(join(outDir, "runtime/session/sessionStateStore.js"))
const sessionManager = requireFromRuntime(join(outDir, "runtime/session/writingSessionManager.js"))

test("Kernel response includes persisted writing session state", () => {
  const response = kernel.processDevCanvasInput({
    input: "第一章：林栖在雨夜推开鹤湾旧宅，青铜铃响起。",
  })

  assert.equal(response.sessionState.sessionId, "devcanvas-writing-session")
  assert.equal(response.sessionState.chapterState.currentChapter, 1)
  assert.ok(response.sessionState.characterState.length >= 1)
  assert.ok(response.sessionState.worldState.definedSettings.length >= 1)
  assert.ok(response.sessionState.eventState.events.length >= 1)
  assert.equal(response.sessionState.checkpoints.at(-1).type, "auto")
})

test("session state resumes across Kernel turns without resetting story memory", () => {
  const first = kernel.processDevCanvasInput({
    input: "第一章：林栖在雨夜推开鹤湾旧宅，青铜铃响起。",
  })
  const second = kernel.processDevCanvasInput({
    input: "第二章：林栖发现账册缺页，决定继续追查。",
    currentTianyiState: first.nextTianyiState,
    narrativeState: first.narrativeState,
    sessionState: first.sessionState,
  })

  assert.equal(second.sessionState.chapterState.currentChapter, 2)
  assert.ok(second.sessionState.eventState.events.length >= first.sessionState.eventState.events.length)
  assert.ok(second.sessionState.characterState.some((character) => character.name === "林栖"))
  assert.ok(second.sessionState.storyMemory.unresolvedForeshadows.includes("青铜铃为何响起"))
  assert.ok(second.sessionState.checkpoints.length > first.sessionState.checkpoints.length)
})

test("Kernel can resume continuity from session state without separate narrative state", () => {
  const first = kernel.processDevCanvasInput({
    input: "第一章：林栖在雨夜推开鹤湾旧宅，青铜铃响起。",
  })
  const resumed = kernel.processDevCanvasInput({
    input: "第二章：林栖发现账册缺页，决定继续追查。",
    currentTianyiState: first.nextTianyiState,
    sessionState: first.sessionState,
  })

  assert.equal(resumed.sessionState.chapterState.currentChapter, 2)
  assert.ok(resumed.sessionState.characterState.some((character) => character.name === "林栖"))
  assert.ok(resumed.sessionState.storyMemory.unresolvedForeshadows.includes("青铜铃为何响起"))
  assert.ok(resumed.sessionState.eventState.events.length >= first.sessionState.eventState.events.length)
})

test("session store can save and resume the latest session snapshot", () => {
  const store = sessionStore.createMemorySessionStateStore()
  const response = kernel.processDevCanvasInput({
    input: "第三章：林栖回到旧宅，确认青铜铃和账册缺页有关。",
  })

  store.save(response.sessionState)
  const resumed = store.load(response.sessionState.sessionId)

  assert.deepEqual(resumed, response.sessionState)
})

test("session storage helpers ignore incomplete localStorage shims", () => {
  const previousStorage = globalThis.localStorage
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {},
  })

  try {
    const response = kernel.processDevCanvasInput({
      input: "第一章：林栖在雨夜推开鹤湾旧宅，青铜铃响起。",
    })
    assert.equal(sessionStore.loadSavedWritingSession(), null)
    assert.doesNotThrow(() => sessionStore.saveWritingSession(response.sessionState))
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: previousStorage,
    })
  }
})

test("manual checkpoints preserve current chapter character world and event state", () => {
  const response = kernel.processDevCanvasInput({
    input: "第四章：林栖在祠堂找到新的线索。",
  })
  const manual = sessionManager.createManualWritingCheckpoint(response.sessionState, "作者确认第四章方向")

  assert.equal(manual.checkpoints.at(-1).type, "manual")
  assert.equal(manual.checkpoints.at(-1).label, "作者确认第四章方向")
  assert.deepEqual(manual.chapterState, response.sessionState.chapterState)
  assert.deepEqual(manual.characterState, response.sessionState.characterState)
  assert.deepEqual(manual.worldState, response.sessionState.worldState)
  assert.deepEqual(manual.eventState, response.sessionState.eventState)
})

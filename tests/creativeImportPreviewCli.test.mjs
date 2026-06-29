import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const tempDir = join(root, ".tmp/creative-import-preview-cli-test")

process.on("exit", () => {
  rmSync(tempDir, { recursive: true, force: true })
})

function runPreviewCli(args = []) {
  return execFileSync(process.execPath, ["tools/runCreativeImportPreview.mjs", ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })
}

test("creative import preview CLI renders a sample world model preview", () => {
  const output = runPreviewCli()

  assert.match(output, /# Creative Import Review Preview/)
  assert.match(output, /## Candidate Entities/)
  assert.match(output, /林澈/)
  assert.match(output, /青岚城/)
  assert.match(output, /青铜令/)
  assert.match(output, /## Candidate Events/)
  assert.match(output, /## Evidence Samples/)
})

test("creative import preview CLI accepts a local source file", () => {
  mkdirSync(tempDir, { recursive: true })
  const sourcePath = join(tempDir, "sample-chapter.txt")
  writeFileSync(sourcePath, [
    "第一章 山门微光",
    "",
    "苏晚在归云山的石阶上把残破灯交给林澈，说青岚城已经有人失踪。",
  ].join("\n"))

  const output = runPreviewCli([sourcePath, "--title", "山门微光"])

  assert.match(output, /山门微光/)
  assert.match(output, /苏晚/)
  assert.match(output, /归云山/)
  assert.match(output, /残破灯/)
})

test("creative import preview CLI output stays preview-only", () => {
  const output = runPreviewCli()

  for (const forbiddenField of ["agentActions", "worldUpdates", "nextStoryState", "runtimeFrame", "systemCalls"]) {
    assert.equal(output.includes(forbiddenField), false)
  }
})

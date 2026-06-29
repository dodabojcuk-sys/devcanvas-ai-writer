import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))

function read(path) {
  return readFileSync(join(root, path), "utf8")
}

test("Tianyi workspace exposes Creative Import as a lightweight story intake", () => {
  const source = read("app/tianyi/TianyiImmersiveWorkspace.tsx")

  for (const token of [
    "runCreativeImportReviewPipeline",
    "creative-import-loom",
    "creative-import-source",
    "creative-import-file",
    "creative-import-preview",
    "拆出故事脉络",
    "候选人物",
    "候选地点",
    "候选物件",
    "候选事件",
    "原文依据",
  ]) {
    assert.match(source, new RegExp(token.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")))
  }

  assert.doesNotMatch(source, /agentActions|worldUpdates|nextStoryState|runtimeFrame|systemCalls/)
  assert.doesNotMatch(source, /Nuwa|女娲|simulation|推演|多元宇宙/)
  assert.doesNotMatch(source, /@\/system|runtime\/systemAdapter|processDevCanvasInput/)
})

test("Creative Import styling keeps the intake embedded in the writing world", () => {
  const css = read("app/globals.css")

  for (const token of [
    ".creative-import-loom",
    ".creative-import-source",
    ".creative-import-preview",
    ".creative-import-stat",
    ".creative-import-chip",
    ".creative-import-evidence",
  ]) {
    assert.match(css, new RegExp(token.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")))
  }

  assert.doesNotMatch(css, /dashboard|cockpit|grid-template-columns:\s*.*320px/)
})

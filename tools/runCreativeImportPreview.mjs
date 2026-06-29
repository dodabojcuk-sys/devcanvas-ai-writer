import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync } from "node:fs"
import { createRequire } from "node:module"
import { basename, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const outDir = join(root, ".tmp/creative-import-preview-cli")
const scopedAliasDir = join(outDir, "node_modules/@")

const sampleText = [
  "第一章 旧城夜雨",
  "",
  "林澈在青岚城的雨巷里握紧青铜令，听见远处钟声三响。",
  "白衣少女苏晚从归云山赶来，提醒他不要打开那本黑书。",
].join("\n")

function parseArgs(argv) {
  const args = [...argv]
  const options = {
    sourcePath: null,
    title: null,
  }

  while (args.length) {
    const current = args.shift()
    if (current === "--title") {
      options.title = args.shift() ?? null
      continue
    }
    if (!options.sourcePath) {
      options.sourcePath = current
    }
  }

  return options
}

function compileRuntimeForPreview() {
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

function sourceFrom(options) {
  if (!options.sourcePath) {
    return {
      rawText: sampleText,
      sourceId: "source_cli_sample",
      title: options.title ?? "旧城夜雨",
    }
  }

  const absolutePath = resolve(root, options.sourcePath)
  const rawText = readFileSync(absolutePath, "utf8")

  return {
    rawText,
    sourceId: `source_file_${basename(absolutePath).replace(/[^a-zA-Z0-9_-]/g, "_")}`,
    title: options.title ?? basename(absolutePath),
  }
}

function bulletList(items, renderItem, emptyMessage = "- none") {
  if (!items.length) return [emptyMessage]
  return items.map(renderItem)
}

function renderPreview(result) {
  const entityLines = bulletList(result.draft.entities, (entity) => (
    `- ${entity.name} (${entity.entity_type}, confidence ${entity.confidence.toFixed(2)}, evidence ${entity.evidence_ids.join(", ")})`
  ))
  const eventLines = bulletList(result.draft.events, (event) => (
    `- ${event.description} (evidence ${event.evidence_ids.join(", ")})`
  ))
  const evidenceLines = bulletList(result.draft.evidence.slice(0, 8), (evidence) => (
    `- ${evidence.evidence_id}: ${evidence.quote} [${evidence.chapter_id}/${evidence.chunk_id}/p${evidence.paragraph_index}]`
  ))

  return [
    result.preview.markdownSummary.trimEnd(),
    "",
    "## Candidate Entities",
    "",
    ...entityLines,
    "",
    "## Candidate Events",
    "",
    ...eventLines,
    "",
    "## Evidence Samples",
    "",
    ...evidenceLines,
    "",
  ].join("\n")
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  compileRuntimeForPreview()

  const requireFromPreview = createRequire(join(outDir, "core/runtime/creativeImportReviewPipeline.js"))
  const { runCreativeImportReviewPipeline } = requireFromPreview(join(outDir, "core/runtime/creativeImportReviewPipeline.js"))
  const result = runCreativeImportReviewPipeline({
    ...sourceFrom(options),
    chunkSizeChars: 120,
  })

  process.stdout.write(`${renderPreview(result)}\n`)
}

main()

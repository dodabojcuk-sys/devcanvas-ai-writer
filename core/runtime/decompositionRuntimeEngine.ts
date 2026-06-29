type EntityType = "character" | "location" | "item"

export interface DecompositionRuntimeInput {
  rawText: string
  sourceId?: string
  title?: string
  chunkSizeChars?: number
  overlapChars?: number
}

export interface DecompositionMetadata {
  source_id: string
  title: string | null
  raw_text_hash: string
}

export interface DecompositionChapter {
  chapter_id: string
  source_id: string
  title: string
  order_index: number
  char_start: number
  char_end: number
  paragraph_start: number
  paragraph_end: number
}

export interface DecompositionChunk {
  source_id: string
  chapter_id: string
  chunk_id: string
  order_index: number
  paragraph_start: number
  paragraph_end: number
  char_start: number
  char_end: number
  text_hash: string
  text: string
}

export interface DecompositionEvidence {
  evidence_id: string
  source_id: string
  chapter_id: string
  chunk_id: string
  paragraph_index: number
  char_start: number
  char_end: number
  quote: string
}

export interface DecompositionEntityCandidate {
  entity_id: string
  name: string
  entity_type: EntityType
  evidence_ids: string[]
  confidence: number
  status: "candidate"
}

export interface DecompositionFactCandidate {
  fact_id: string
  kind: "factual_extraction"
  statement: string
  evidence_ids: string[]
  confidence: number
  status: "candidate"
}

export interface DecompositionResult {
  metadata: DecompositionMetadata
  chapters: DecompositionChapter[]
  chunks: DecompositionChunk[]
  facts: DecompositionFactCandidate[]
  entities: {
    characters: DecompositionEntityCandidate[]
    locations: DecompositionEntityCandidate[]
    items: DecompositionEntityCandidate[]
  }
  evidenceIndex: DecompositionEvidence[]
  markdownReport: string
  warnings: string[]
}

interface TextLine {
  text: string
  trimmed: string
  charStart: number
  charEnd: number
  trimmedStart: number
  trimmedEnd: number
}

interface Paragraph {
  chapterId: string
  paragraphIndex: number
  text: string
  charStart: number
  charEnd: number
}

interface EntityMatch {
  type: EntityType
  name: string
  charStart: number
  charEnd: number
  paragraph: Paragraph
  chunkId: string
}

const DEFAULT_CHUNK_SIZE = 4000
const MIN_CHUNK_SIZE = 200
const CHAPTER_TITLE_PATTERN = /^第[一二三四五六七八九十百千万零〇\d]+[章节回卷部](?:\s+.*|.*)$/
const LOCATION_PATTERN = /(?:^|[，。、“”\s]|在|从|到|回|入|至|往)([\u4e00-\u9fa5]{2,5}(?:城|山|谷|宫|镇|村|殿))/g
const ITEM_PATTERN = /(?:^|[，。、“”\s]|握紧|打开|那本|把|交给)([\u4e00-\u9fa5]{1,5}(?:剑|书|令|珠|灯|符))/g
const CHARACTER_BEFORE_ACTION_PATTERN = /([\u4e00-\u9fa5]{2,3})(?=在|从|把|说|听见|提醒|握紧|赶来)/g
const CHARACTER_AFTER_ACTION_PATTERN = /(?:交给|提醒|告诉)([\u4e00-\u9fa5]{2,3})/g
const LOCATION_LIKE_CHARACTER_PATTERN = /(?:城|山|谷|宫|镇|村|殿|巷|巷里|石阶)$/
const NON_CHARACTER_PHRASE_PATTERN = /^(?:他|她|它|他们|她们|不要|不能|已经|有人)/
const CHARACTER_DESCRIPTOR_PREFIX_PATTERN = /^(?:白衣|黑衣|红衣|青衣|少女|少年|女子|男子|女|男)+/

function pad(index: number) {
  return String(index).padStart(3, "0")
}

function normalizeText(rawText: string) {
  return rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
}

function stableHash(input: string) {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, "0")
}

function safeChunkSize(value: number | undefined) {
  if (!Number.isFinite(value) || !value) return DEFAULT_CHUNK_SIZE
  return Math.max(MIN_CHUNK_SIZE, Math.floor(value))
}

function sourceIdFor(input: DecompositionRuntimeInput, normalizedText: string) {
  return input.sourceId?.trim() || `source_${stableHash(normalizedText)}`
}

function buildLines(text: string): TextLine[] {
  const lines: TextLine[] = []
  let cursor = 0

  for (const segment of text.split("\n")) {
    const leadingWhitespace = segment.match(/^\s*/)?.[0].length ?? 0
    const trailingWhitespace = segment.match(/\s*$/)?.[0].length ?? 0
    const charStart = cursor
    const charEnd = cursor + segment.length
    const trimmedStart = charStart + leadingWhitespace
    const trimmedEnd = charEnd - trailingWhitespace

    lines.push({
      text: segment,
      trimmed: segment.trim(),
      charStart,
      charEnd,
      trimmedStart,
      trimmedEnd,
    })
    cursor = charEnd + 1
  }

  return lines
}

function identifyChapterRanges(lines: readonly TextLine[], sourceId: string, normalizedText: string): DecompositionChapter[] {
  const headers = lines
    .filter((line) => line.trimmed && CHAPTER_TITLE_PATTERN.test(line.trimmed))
    .map((line) => ({
      title: line.trimmed,
      charStart: line.trimmedStart,
    }))

  if (!headers.length) {
    return [{
      chapter_id: "chapter_001",
      source_id: sourceId,
      title: "正文",
      order_index: 1,
      char_start: 0,
      char_end: normalizedText.length,
      paragraph_start: 1,
      paragraph_end: 0,
    }]
  }

  return headers.map((header, index) => ({
    chapter_id: `chapter_${pad(index + 1)}`,
    source_id: sourceId,
    title: header.title,
    order_index: index + 1,
    char_start: header.charStart,
    char_end: index + 1 < headers.length ? headers[index + 1].charStart : normalizedText.length,
    paragraph_start: 1,
    paragraph_end: 0,
  }))
}

function paragraphBelongsToChapter(paragraph: TextLine, chapter: DecompositionChapter) {
  return paragraph.trimmedStart >= chapter.char_start && paragraph.trimmedStart < chapter.char_end
}

function buildParagraphs(lines: readonly TextLine[], chapters: readonly DecompositionChapter[]) {
  const paragraphs: Paragraph[] = []
  const paragraphCounts = new Map<string, number>()

  for (const line of lines) {
    if (!line.trimmed) continue
    const chapter = chapters.find((candidate) => paragraphBelongsToChapter(line, candidate))
    if (!chapter) continue
    const nextIndex = (paragraphCounts.get(chapter.chapter_id) ?? 0) + 1
    paragraphCounts.set(chapter.chapter_id, nextIndex)
    paragraphs.push({
      chapterId: chapter.chapter_id,
      paragraphIndex: nextIndex,
      text: line.trimmed,
      charStart: line.trimmedStart,
      charEnd: line.trimmedEnd,
    })
  }

  return {
    paragraphs,
    chapterParagraphCounts: paragraphCounts,
  }
}

function attachParagraphRanges(chapters: readonly DecompositionChapter[], paragraphCounts: ReadonlyMap<string, number>) {
  return chapters.map((chapter) => ({
    ...chapter,
    paragraph_start: paragraphCounts.has(chapter.chapter_id) ? 1 : 0,
    paragraph_end: paragraphCounts.get(chapter.chapter_id) ?? 0,
  }))
}

function makeChunk(
  sourceId: string,
  chapterId: string,
  chunkIndex: number,
  paragraphs: readonly Paragraph[],
  normalizedText: string,
): DecompositionChunk {
  const first = paragraphs[0]
  const last = paragraphs[paragraphs.length - 1]
  const text = normalizedText.slice(first.charStart, last.charEnd)

  return {
    source_id: sourceId,
    chapter_id: chapterId,
    chunk_id: `chunk_${pad(chunkIndex)}`,
    order_index: chunkIndex,
    paragraph_start: first.paragraphIndex,
    paragraph_end: last.paragraphIndex,
    char_start: first.charStart,
    char_end: last.charEnd,
    text_hash: stableHash(text),
    text,
  }
}

function buildChunks(
  sourceId: string,
  chapters: readonly DecompositionChapter[],
  paragraphs: readonly Paragraph[],
  normalizedText: string,
  chunkSizeChars: number,
) {
  const chunks: DecompositionChunk[] = []
  let chunkIndex = 1

  for (const chapter of chapters) {
    const chapterParagraphs = paragraphs.filter((paragraph) => paragraph.chapterId === chapter.chapter_id)
    let pending: Paragraph[] = []
    let pendingChars = 0

    for (const paragraph of chapterParagraphs) {
      const paragraphSize = paragraph.charEnd - paragraph.charStart
      if (pending.length && pendingChars + paragraphSize > chunkSizeChars) {
        chunks.push(makeChunk(sourceId, chapter.chapter_id, chunkIndex, pending, normalizedText))
        chunkIndex += 1
        pending = []
        pendingChars = 0
      }
      pending.push(paragraph)
      pendingChars += paragraphSize
    }

    if (pending.length) {
      chunks.push(makeChunk(sourceId, chapter.chapter_id, chunkIndex, pending, normalizedText))
      chunkIndex += 1
    }
  }

  return chunks
}

function findChunkForParagraph(chunks: readonly DecompositionChunk[], paragraph: Paragraph) {
  return chunks.find((chunk) => (
    chunk.chapter_id === paragraph.chapterId &&
    paragraph.paragraphIndex >= chunk.paragraph_start &&
    paragraph.paragraphIndex <= chunk.paragraph_end
  ))
}

function addCapturedMatches(args: {
  matches: EntityMatch[]
  type: EntityType
  pattern: RegExp
  paragraph: Paragraph
  chunkId: string
}) {
  for (const match of args.paragraph.text.matchAll(args.pattern)) {
    const rawName = match[1]?.trim()
    const name = normalizeEntityName(args.type, rawName)
    if (!name) continue
    const localStart = match.index + match[0].lastIndexOf(name)
    args.matches.push({
      type: args.type,
      name,
      charStart: args.paragraph.charStart + localStart,
      charEnd: args.paragraph.charStart + localStart + name.length,
      paragraph: args.paragraph,
      chunkId: args.chunkId,
    })
  }
}

function normalizeEntityName(type: EntityType, value: string | undefined) {
  if (!value) return ""
  if (type === "character") {
    const stripped = value.replace(CHARACTER_DESCRIPTOR_PREFIX_PATTERN, "")
    const name = stripped.length >= 2 ? stripped : value

    if (NON_CHARACTER_PHRASE_PATTERN.test(name)) return ""
    if (LOCATION_LIKE_CHARACTER_PATTERN.test(name)) return ""
    return name
  }
  if (type === "location") {
    return value.split(/[在从到回入至往]/).filter(Boolean).pop() ?? value
  }
  if (type === "item") {
    return value.replace(/^(那本|这本|一把|一枚|一盏|一张)/, "")
  }
  return value
}

function extractEntityMatches(paragraphs: readonly Paragraph[], chunks: readonly DecompositionChunk[]) {
  const matches: EntityMatch[] = []

  for (const paragraph of paragraphs) {
    const chunk = findChunkForParagraph(chunks, paragraph)
    if (!chunk) continue
    addCapturedMatches({ matches, type: "character", pattern: CHARACTER_BEFORE_ACTION_PATTERN, paragraph, chunkId: chunk.chunk_id })
    addCapturedMatches({ matches, type: "character", pattern: CHARACTER_AFTER_ACTION_PATTERN, paragraph, chunkId: chunk.chunk_id })
    addCapturedMatches({ matches, type: "location", pattern: LOCATION_PATTERN, paragraph, chunkId: chunk.chunk_id })
    addCapturedMatches({ matches, type: "item", pattern: ITEM_PATTERN, paragraph, chunkId: chunk.chunk_id })
  }

  return matches
}

function createEvidence(
  sourceId: string,
  evidenceIndex: DecompositionEvidence[],
  args: {
    chapterId: string
    chunkId: string
    paragraphIndex: number
    charStart: number
    charEnd: number
    quote: string
  },
) {
  const evidence: DecompositionEvidence = {
    evidence_id: `evidence_${pad(evidenceIndex.length + 1)}`,
    source_id: sourceId,
    chapter_id: args.chapterId,
    chunk_id: args.chunkId,
    paragraph_index: args.paragraphIndex,
    char_start: args.charStart,
    char_end: args.charEnd,
    quote: args.quote,
  }
  evidenceIndex.push(evidence)
  return evidence.evidence_id
}

function buildEntityCandidates(sourceId: string, matches: readonly EntityMatch[], evidenceIndex: DecompositionEvidence[]) {
  const byKey = new Map<string, DecompositionEntityCandidate>()

  for (const match of matches) {
    const key = `${match.type}:${match.name}`
    const evidenceId = createEvidence(sourceId, evidenceIndex, {
      chapterId: match.paragraph.chapterId,
      chunkId: match.chunkId,
      paragraphIndex: match.paragraph.paragraphIndex,
      charStart: match.charStart,
      charEnd: match.charEnd,
      quote: match.name,
    })
    const existing = byKey.get(key)
    if (existing) {
      existing.evidence_ids = Array.from(new Set([...existing.evidence_ids, evidenceId]))
      existing.confidence = Math.min(0.95, existing.confidence + 0.05)
      continue
    }
    byKey.set(key, {
      entity_id: `${match.type}_${pad(byKey.size + 1)}`,
      name: match.name,
      entity_type: match.type,
      evidence_ids: [evidenceId],
      confidence: 0.62,
      status: "candidate",
    })
  }

  const all = Array.from(byKey.values())
  return {
    characters: all.filter((entity) => entity.entity_type === "character"),
    locations: all.filter((entity) => entity.entity_type === "location"),
    items: all.filter((entity) => entity.entity_type === "item"),
  }
}

function isChapterTitle(paragraph: Paragraph, chapters: readonly DecompositionChapter[]) {
  return chapters.some((chapter) => chapter.chapter_id === paragraph.chapterId && chapter.title === paragraph.text)
}

function buildFactCandidates(
  sourceId: string,
  chapters: readonly DecompositionChapter[],
  paragraphs: readonly Paragraph[],
  chunks: readonly DecompositionChunk[],
  evidenceIndex: DecompositionEvidence[],
) {
  const facts: DecompositionFactCandidate[] = []

  for (const paragraph of paragraphs) {
    if (isChapterTitle(paragraph, chapters)) continue
    const chunk = findChunkForParagraph(chunks, paragraph)
    if (!chunk) continue
    const evidenceId = createEvidence(sourceId, evidenceIndex, {
      chapterId: paragraph.chapterId,
      chunkId: chunk.chunk_id,
      paragraphIndex: paragraph.paragraphIndex,
      charStart: paragraph.charStart,
      charEnd: paragraph.charEnd,
      quote: paragraph.text,
    })
    facts.push({
      fact_id: `fact_${pad(facts.length + 1)}`,
      kind: "factual_extraction",
      statement: paragraph.text,
      evidence_ids: [evidenceId],
      confidence: 0.7,
      status: "candidate",
    })
  }

  return facts
}

function renderMarkdownReport(result: Omit<DecompositionResult, "markdownReport">) {
  if (!result.chapters.length) {
    return [
      "# Decomposition Report",
      "",
      "No source text was available for decomposition.",
      "",
      "Warnings:",
      ...result.warnings.map((warning) => `- ${warning}`),
      "",
    ].join("\n")
  }

  return [
    "# Decomposition Report",
    "",
    `Source: ${result.metadata.source_id}`,
    `Title: ${result.metadata.title ?? "Untitled"}`,
    `Raw text hash: ${result.metadata.raw_text_hash}`,
    "",
    "## Summary",
    "",
    `- chapters: ${result.chapters.length}`,
    `- chunks: ${result.chunks.length}`,
    `- factual candidates: ${result.facts.length}`,
    `- character candidates: ${result.entities.characters.length}`,
    `- location candidates: ${result.entities.locations.length}`,
    `- item candidates: ${result.entities.items.length}`,
    `- evidence anchors: ${result.evidenceIndex.length}`,
    "",
    "## Chapters",
    "",
    ...result.chapters.map((chapter) => `- ${chapter.chapter_id}: ${chapter.title} (${chapter.paragraph_start}-${chapter.paragraph_end})`),
    "",
    "## Warnings",
    "",
    ...(result.warnings.length ? result.warnings.map((warning) => `- ${warning}`) : ["- none"]),
    "",
  ].join("\n")
}

export function runDecompositionRuntime(input: DecompositionRuntimeInput): DecompositionResult {
  const normalizedText = normalizeText(input.rawText)
  const rawTextHash = stableHash(normalizedText)
  const sourceId = sourceIdFor(input, normalizedText)
  const metadata: DecompositionMetadata = {
    source_id: sourceId,
    title: input.title?.trim() || null,
    raw_text_hash: rawTextHash,
  }

  if (!normalizedText.trim()) {
    const emptyResult: Omit<DecompositionResult, "markdownReport"> = {
      metadata,
      chapters: [],
      chunks: [],
      facts: [],
      entities: { characters: [], locations: [], items: [] },
      evidenceIndex: [],
      warnings: ["empty_input"],
    }
    return {
      ...emptyResult,
      markdownReport: renderMarkdownReport(emptyResult),
    }
  }

  const lines = buildLines(normalizedText)
  const chapterRanges = identifyChapterRanges(lines, sourceId, normalizedText)
  const { paragraphs, chapterParagraphCounts } = buildParagraphs(lines, chapterRanges)
  const chapters = attachParagraphRanges(chapterRanges, chapterParagraphCounts)
  const chunks = buildChunks(sourceId, chapters, paragraphs, normalizedText, safeChunkSize(input.chunkSizeChars))
  const evidenceIndex: DecompositionEvidence[] = []
  const entities = buildEntityCandidates(sourceId, extractEntityMatches(paragraphs, chunks), evidenceIndex)
  const facts = buildFactCandidates(sourceId, chapters, paragraphs, chunks, evidenceIndex)
  const warnings: string[] = []

  if (!chunks.length) warnings.push("no_chunks_created")
  if (!facts.length) warnings.push("no_factual_candidates_created")

  const resultWithoutReport: Omit<DecompositionResult, "markdownReport"> = {
    metadata,
    chapters,
    chunks,
    facts,
    entities,
    evidenceIndex,
    warnings,
  }

  return {
    ...resultWithoutReport,
    markdownReport: renderMarkdownReport(resultWithoutReport),
  }
}

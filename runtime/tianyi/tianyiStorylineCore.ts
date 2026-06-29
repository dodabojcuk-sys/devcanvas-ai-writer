import type {
  CompressedMemoryLayer,
  ProphecyCandidate,
  StoryAtomCandidate,
  StoryAtomType,
  StorylineCandidate,
  StorylineType,
  StoryNodeCandidate,
  StoryNodeType,
  TianyiCandidateStatus,
  TianyiConfidence,
  TianyiInputClassification,
  TianyiInputKind,
} from "@/types/tianyiStoryline"

function normalizeInput(text: string) {
  return text.replace(/\s+/g, " ").trim()
}

function stableId(prefix: string, value: string, index = 0) {
  let hash = 0
  const source = `${value}:${index}`
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0
  }
  return `${prefix}-${hash.toString(36)}`
}

function clampSummary(text: string, max = 80) {
  const value = normalizeInput(text)
  return value.length > max ? `${value.slice(0, max)}...` : value
}

function sentenceCount(text: string) {
  return (text.match(/[。！？!?]/g) ?? []).length
}

function paragraphCount(text: string) {
  return text.split(/\n+/).filter((line) => line.trim()).length
}

function hasAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text))
}

export function classifyTianyiInput(text: string): TianyiInputClassification {
  const normalized = normalizeInput(text)
  const reasons: string[] = []
  if (!normalized) {
    return { kind: "unknown", confidence: "low", reasons: ["empty_input"], textLength: 0 }
  }

  const length = normalized.length
  const sentenceTotal = sentenceCount(text)
  const paragraphTotal = paragraphCount(text)

  const revision = hasAny(normalized, [/\b(修改|重写|删掉|删除|加强|弱化|改成|润色|调整)\b/])
  const plotQuestion = hasAny(normalized, [/(怎么办|会怎样|接下来|下一步|如何发展|怎么回收|哪里有风险|会不会)/]) || /[?？]$/.test(normalized)
  const worldbuilding = hasAny(normalized, [/(世界观|设定|规则|势力|门派|王朝|神明|系统|法则|地图|城邦)/])
  const character = hasAny(normalized, [/(角色|人物|性格|主角|反派|女主|男主|配角|动机|身份)/])
  const manuscript = length >= 180 || paragraphTotal >= 3 || sentenceTotal >= 4

  let kind: TianyiInputKind = "idea"
  if (revision) {
    kind = "revision_note"
    reasons.push("revision_language")
  } else if (plotQuestion) {
    kind = "plot_question"
    reasons.push("question_language")
  } else if (manuscript) {
    kind = "manuscript"
    reasons.push("long_or_multi_sentence_text")
  } else if (worldbuilding) {
    kind = "worldbuilding"
    reasons.push("worldbuilding_terms")
  } else if (character) {
    kind = "character"
    reasons.push("character_terms")
  } else {
    reasons.push("short_inspiration")
  }

  const confidence = reasons[0] === "short_inspiration" && length < 8 ? "low" : reasons.length > 0 ? "high" : "medium"
  return { kind, confidence, reasons, textLength: length }
}

export function splitTextForStorylineIntake(text: string): string[] {
  const normalized = text.trim()
  if (!normalized) return []
  const paragraphSegments = normalized.split(/\n{2,}/).map((segment) => segment.trim()).filter(Boolean)
  const segments = paragraphSegments.length > 1 ? paragraphSegments : normalized.split(/(?<=[。！？!?])/).map((segment) => segment.trim()).filter(Boolean)
  return segments.slice(0, 12).map((segment) => clampSummary(segment, 220))
}

function atomTypeForSegment(segment: string): StoryAtomType {
  if (hasAny(segment, [/(为什么|怎么办|如何|会不会|？|\?)/])) return "question"
  if (hasAny(segment, [/(冲突|争夺|背叛|威胁|危险|风险|对立)/])) return "conflict"
  if (hasAny(segment, [/(伏笔|预兆|暗示|铃声|缺页|秘密|线索)/])) return "foreshadow"
  if (hasAny(segment, [/(规则|设定|世界观|法则|势力)/])) return "world_rule"
  if (hasAny(segment, [/(关系|父亲|母亲|师徒|兄弟|姐妹|仇人|盟友)/])) return "relationship"
  if (hasAny(segment, [/(决定|选择|答应|拒绝|离开|留下)/])) return "decision"
  if (hasAny(segment, [/(青铜铃|玉佩|账册|钥匙|物品|道具)/])) return "item_state"
  if (hasAny(segment, [/(角色|人物|性格|主角|反派|身份)/])) return "character_state"
  if (hasAny(segment, [/(发现|推开|进入|响起|出现|失踪|到达)/])) return "event"
  return "fact"
}

function nodeTypeForAtom(atom: StoryAtomCandidate, index: number): StoryNodeType {
  if (atom.type === "foreshadow" || atom.type === "clue") return "setup"
  if (atom.type === "conflict") return "conflict"
  if (atom.type === "decision") return "choice"
  if (atom.type === "question") return "reveal"
  if (index === 0) return "setup"
  if (index === 1) return "turning_point"
  return "aftermath"
}

function evidenceIdForSegment(segment: string, index: number) {
  return `tianyi-evidence-preview-${stableId("segment", segment, index)}`
}

export function deriveStoryAtomCandidates(text: string): StoryAtomCandidate[] {
  const segments = splitTextForStorylineIntake(text)
  const fallback = segments.length ? segments : normalizeInput(text) ? [normalizeInput(text)] : []
  return fallback.slice(0, 10).map((segment, index) => ({
    id: stableId("story-atom", segment, index),
    type: atomTypeForSegment(segment),
    summary: clampSummary(segment, 96),
    sourceEvidenceIds: [evidenceIdForSegment(segment, index)],
    confidence: index === 0 ? "medium" : "low",
    status: "candidate",
  }))
}

function extractRelatedCharacters(text: string) {
  const matches = text.match(/[\u4e00-\u9fa5]{2,4}/g) ?? []
  const blocked = new Set(["世界观", "故事线", "剧情线", "青铜铃", "旧宅", "账册", "证据", "角色"])
  return Array.from(new Set(matches.filter((name) => !blocked.has(name)).slice(0, 4)))
}

function storylineTypeForAtoms(atoms: StoryAtomCandidate[]): StorylineType {
  if (atoms.some((atom) => atom.type === "world_rule")) return "world"
  if (atoms.some((atom) => atom.type === "foreshadow" || atom.type === "clue")) return "hidden"
  if (atoms.some((atom) => atom.type === "character_state")) return "character"
  if (atoms.some((atom) => atom.type === "item_state")) return "item"
  if (atoms.some((atom) => atom.type === "relationship")) return "relationship"
  return "main"
}

function buildNodeFromAtom(atom: StoryAtomCandidate, index: number, lineId: string): StoryNodeCandidate {
  return {
    id: stableId("story-node", atom.id, index),
    order: index + 1,
    type: nodeTypeForAtom(atom, index),
    title: `节点 ${index + 1}`,
    summary: atom.summary,
    evidenceIds: atom.sourceEvidenceIds,
    storyAtomIds: [atom.id],
    lineId,
    status: atom.status,
  }
}

export function deriveStorylineCandidates(atoms: StoryAtomCandidate[]): StorylineCandidate[] {
  if (!atoms.length) return []
  const text = atoms.map((atom) => atom.summary).join(" ")
  const primaryType = storylineTypeForAtoms(atoms)
  const primaryLineId = stableId("storyline", text, 0)
  const primary: StorylineCandidate = {
    id: primaryLineId,
    type: primaryType,
    title: primaryType === "hidden" ? "隐藏线候选" : primaryType === "world" ? "世界观线候选" : "主线候选",
    summary: clampSummary(text, 120),
    nodes: atoms.slice(0, 6).map((atom, index) => buildNodeFromAtom(atom, index, primaryLineId)),
    relatedCharacters: extractRelatedCharacters(text),
    relatedItems: hasAny(text, [/(青铜铃|玉佩|账册|钥匙)/]) ? ["青铜铃 / 道具线索"] : [],
    relatedLocations: hasAny(text, [/(旧宅|茶馆|祠堂|城|山|巷)/]) ? ["关键场景待确认"] : [],
    sourceEvidenceIds: Array.from(new Set(atoms.flatMap((atom) => atom.sourceEvidenceIds))),
    openQuestions: atoms.some((atom) => atom.type === "question") ? ["作者提出的问题需要后续回答。"] : ["这条故事线仍需作者确认走向。"],
    risks: atoms.some((atom) => atom.type === "foreshadow") ? ["伏笔线需要后续回收证据。"] : ["当前只是候选故事线，不能当作正史。"],
    status: "needs_author_confirmation",
  }

  const secondaryLines: StorylineCandidate[] = []
  if (atoms.some((atom) => atom.type === "character_state")) {
    const lineId = stableId("storyline-character", text, 1)
    secondaryLines.push({
      ...primary,
      id: lineId,
      type: "character",
      title: "角色线候选",
      nodes: atoms.filter((atom) => atom.type === "character_state" || atom.type === "relationship").slice(0, 4).map((atom, index) => buildNodeFromAtom(atom, index, lineId)),
      status: "candidate",
    })
  }
  if (atoms.some((atom) => atom.type === "foreshadow")) {
    const lineId = stableId("storyline-foreshadow", text, 2)
    secondaryLines.push({
      ...primary,
      id: lineId,
      type: "foreshadow",
      title: "伏笔线候选",
      nodes: atoms.filter((atom) => atom.type === "foreshadow" || atom.type === "clue").slice(0, 4).map((atom, index) => buildNodeFromAtom(atom, index, lineId)),
      risks: ["伏笔仍未回收，后续需要原文依据或作者确认。"],
      status: "candidate",
    })
  }

  return [primary, ...secondaryLines].slice(0, 3)
}

export function deriveCompressedMemoryPreview(lines: StorylineCandidate[]): CompressedMemoryLayer[] {
  const storylineIds = lines.map((line) => line.id)
  const evidenceIds = Array.from(new Set(lines.flatMap((line) => line.sourceEvidenceIds))).slice(0, 12)
  const storylineSummary = lines.map((line) => `${line.title}: ${line.summary}`).join(" / ")
  return [
    {
      level: "L1",
      title: "Evidence Anchors",
      summary: `记录 ${evidenceIds.length} 条来源锚点，用于回查原文。`,
      sourceEvidenceIds: evidenceIds,
      storylineIds,
      status: "derived_preview",
    },
    {
      level: "L3",
      title: "Story Atoms",
      summary: "故事原子层只保存候选摘要，不替代原文。",
      sourceEvidenceIds: evidenceIds,
      storylineIds,
      status: "derived_preview",
    },
    {
      level: "L4",
      title: "Storylines",
      summary: clampSummary(storylineSummary, 180),
      sourceEvidenceIds: evidenceIds,
      storylineIds,
      status: "derived_preview",
    },
    {
      level: "L5",
      title: "Project Memory",
      summary: `当前可读记忆包含 ${lines.length} 条候选故事线；需要验证时必须回查原文依据。`,
      sourceEvidenceIds: evidenceIds,
      storylineIds,
      status: "derived_preview",
    },
  ]
}

export function deriveProphecyCandidates(lines: StorylineCandidate[]): ProphecyCandidate[] {
  return lines.slice(0, 3).map((line, index) => ({
    id: stableId("prophecy", line.id, index),
    title: `${line.title}的下一步预言`,
    prediction: `${line.summary} 可能会继续推进，但仍需要作者确认和原文证据支持。`,
    basedOnStorylineIds: [line.id],
    basedOnNodeIds: line.nodes.map((node) => node.id).slice(0, 4),
    evidenceIds: line.sourceEvidenceIds.slice(0, 6),
    risk: line.risks.length ? "medium" : "low",
    confidence: line.sourceEvidenceIds.length >= 2 ? "medium" : "low",
    nextQuestions: line.openQuestions.length ? line.openQuestions : ["作者是否认可这条故事线的方向？"],
    status: line.sourceEvidenceIds.length ? "needs_author_confirmation" : "needs_evidence",
  }))
}

export type {
  CompressedMemoryLayer,
  ProphecyCandidate,
  StoryAtomCandidate,
  StorylineCandidate,
  StoryNodeCandidate,
  TianyiCandidateStatus,
  TianyiConfidence,
  TianyiInputClassification,
  TianyiInputKind,
}

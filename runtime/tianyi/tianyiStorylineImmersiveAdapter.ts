import {
  classifyTianyiInput,
  deriveCompressedMemoryPreview,
  deriveProphecyCandidates,
  deriveStoryAtomCandidates,
  deriveStorylineCandidates,
  type CompressedMemoryLayer,
  type ProphecyCandidate,
  type StoryAtomCandidate,
  type StorylineCandidate,
  type TianyiCandidateStatus,
  type TianyiConfidence,
  type TianyiInputKind,
} from "./tianyiStorylineCore"
import type { StoryAtomType, StorylineType } from "../../types/tianyiStoryline"

export type TianyiImmersiveCardKind =
  | "character"
  | "location"
  | "item"
  | "clue"
  | "foreshadow"
  | "plot"
  | "node"

export interface TianyiImmersiveCardView {
  id: string
  cardKind: TianyiImmersiveCardKind
  typeLabel: string
  title: string
  summary: string
  sourceLabel: "本轮对话"
  statusLabel: "候选"
  evidenceLabel: string
  boundaryLabel: string
}

export interface TianyiImmersiveGraphNodeView {
  id: string
  label: string
  cardKind: TianyiImmersiveCardKind | "core"
  x: number
  y: number
}

export interface TianyiImmersiveGraphEdgeView {
  from: string
  to: string
  label?: string
}

export interface TianyiImmersiveStorylineRailItem {
  id: string
  label: string
  typeLabel: string
  statusLabel: string
  riskLabel: string
}

export interface TianyiImmersiveMemoryLayerView {
  levelLabel: string
  title: string
  summary: string
  sourceLabel: string
  boundaryLabel: string
}

export interface TianyiImmersiveProphecyView {
  id: string
  title: string
  prediction: string
  basedOnLabel: string
  riskLabel: string
  confidenceLabel: string
  nextQuestionLabel: string
  statusLabel: string
  boundaryLabel: string
}

export interface TianyiImmersiveDerivedView {
  inputKindLabel: string
  inputSummary: string
  atomCards: TianyiImmersiveCardView[]
  storylineCards: TianyiImmersiveCardView[]
  graphNodes: TianyiImmersiveGraphNodeView[]
  graphEdges: TianyiImmersiveGraphEdgeView[]
  storylineRailItems: TianyiImmersiveStorylineRailItem[]
  compressedMemoryPreview: TianyiImmersiveMemoryLayerView[]
  prophecyPreviews: TianyiImmersiveProphecyView[]
  boundaryText: string
  isManuscript: boolean
}

const INPUT_KIND_LABELS: Record<TianyiInputKind, string> = {
  idea: "灵感",
  manuscript: "正文",
  worldbuilding: "世界观",
  character: "角色想法",
  plot_question: "剧情问题",
  revision_note: "修改意见",
  unknown: "未识别输入",
}

const ATOM_TYPE_LABELS: Record<StoryAtomType, string> = {
  event: "事件卡",
  fact: "事实卡",
  relationship: "关系卡",
  conflict: "冲突卡",
  foreshadow: "伏笔卡",
  clue: "线索卡",
  world_rule: "世界规则卡",
  character_state: "角色状态卡",
  item_state: "物品状态卡",
  decision: "选择卡",
  question: "未解问题卡",
}

const STORYLINE_TYPE_LABELS: Record<StorylineType, string> = {
  main: "主线",
  branch: "分支线",
  hidden: "暗线",
  character: "角色线",
  relationship: "关系线",
  item: "物品线",
  foreshadow: "伏笔线",
  world: "世界观线",
  theme: "主题线",
}

const STATUS_LABELS: Record<TianyiCandidateStatus, string> = {
  candidate: "候选",
  needs_author_confirmation: "待作者确认",
  confirmed: "已确认",
  rejected: "已拒绝",
}

const CONFIDENCE_LABELS: Record<TianyiConfidence, string> = {
  low: "低",
  medium: "中",
  high: "高",
}

function cleanSummary(text: string, max = 96) {
  const normalized = text.replace(/\s+/g, " ").trim()
  if (!normalized) return "天意还需要更多内容，才能提炼出稳定候选。"
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized
}

function cardKindForAtom(type: StoryAtomType): TianyiImmersiveCardKind {
  switch (type) {
    case "character_state":
      return "character"
    case "world_rule":
      return "location"
    case "item_state":
      return "item"
    case "foreshadow":
      return "foreshadow"
    case "clue":
      return "clue"
    case "conflict":
    case "relationship":
    case "decision":
      return "plot"
    case "event":
    case "fact":
    case "question":
      return "node"
  }
}

function cardKindForStoryline(type: StorylineType): TianyiImmersiveCardKind {
  switch (type) {
    case "character":
      return "character"
    case "item":
      return "item"
    case "foreshadow":
      return "foreshadow"
    case "hidden":
      return "clue"
    case "world":
      return "location"
    case "main":
    case "branch":
    case "relationship":
    case "theme":
      return "plot"
  }
}

function statusLabel(status: TianyiCandidateStatus) {
  return status === "confirmed" ? "待作者确认" : STATUS_LABELS[status]
}

function atomToCard(atom: StoryAtomCandidate, index: number): TianyiImmersiveCardView {
  return {
    id: `atom-card-${atom.id}`,
    cardKind: cardKindForAtom(atom.type),
    typeLabel: ATOM_TYPE_LABELS[atom.type],
    title: `${ATOM_TYPE_LABELS[atom.type]} ${index + 1}`,
    summary: atom.summary,
    sourceLabel: "本轮对话",
    statusLabel: "候选",
    evidenceLabel: `依据预览 ${atom.sourceEvidenceIds.length} 条`,
    boundaryLabel: `${statusLabel(atom.status)}，未入正史`,
  }
}

function storylineToCard(line: StorylineCandidate, index: number): TianyiImmersiveCardView {
  const typeLabel = STORYLINE_TYPE_LABELS[line.type]
  return {
    id: `storyline-card-${line.id}`,
    cardKind: cardKindForStoryline(line.type),
    typeLabel: `${typeLabel}卡`,
    title: line.title || `${typeLabel}候选 ${index + 1}`,
    summary: line.summary,
    sourceLabel: "本轮对话",
    statusLabel: "候选",
    evidenceLabel: `关联依据 ${line.sourceEvidenceIds.length} 条`,
    boundaryLabel: `${statusLabel(line.status)}，未入正史`,
  }
}

function memoryTitle(layer: CompressedMemoryLayer) {
  switch (layer.level) {
    case "L0":
      return "L0 原文层"
    case "L1":
      return "L1 原文依据"
    case "L2":
      return "L2 场景摘要"
    case "L3":
      return "L3 故事原子"
    case "L4":
      return "L4 故事线"
    case "L5":
      return "L5 天意可读记忆"
  }
}

function memoryToView(layer: CompressedMemoryLayer): TianyiImmersiveMemoryLayerView {
  return {
    levelLabel: memoryTitle(layer),
    title: memoryTitle(layer),
    summary: layer.summary,
    sourceLabel: `关联 ${layer.sourceEvidenceIds.length} 条来源预览`,
    boundaryLabel: "摘要不是原文依据，需要验证时会回到原文。",
  }
}

function riskLabel(risk: ProphecyCandidate["risk"]) {
  switch (risk) {
    case "high":
      return "高风险"
    case "medium":
      return "中风险"
    case "low":
      return "低风险"
  }
}

function prophecyStatusLabel(status: ProphecyCandidate["status"]) {
  switch (status) {
    case "preview":
      return "候选预言"
    case "needs_evidence":
      return "需要证据"
    case "needs_author_confirmation":
      return "待作者确认"
  }
}

function prophecyToView(prophecy: ProphecyCandidate, lines: StorylineCandidate[]): TianyiImmersiveProphecyView {
  const basedOnLines = prophecy.basedOnStorylineIds
    .map((lineId) => lines.find((line) => line.id === lineId))
    .filter((line): line is StorylineCandidate => Boolean(line))
  const basedOnLabel = basedOnLines.length
    ? basedOnLines.map((line) => line.title || STORYLINE_TYPE_LABELS[line.type]).join(" / ")
    : "当前候选故事线"

  return {
    id: `prophecy-view-${prophecy.id}`,
    title: prophecy.title,
    prediction: prophecy.prediction,
    basedOnLabel,
    riskLabel: riskLabel(prophecy.risk),
    confidenceLabel: `可信度 ${CONFIDENCE_LABELS[prophecy.confidence]}`,
    nextQuestionLabel: prophecy.nextQuestions[0] ?? "作者是否认可这个方向？",
    statusLabel: prophecyStatusLabel(prophecy.status),
    boundaryLabel: "候选预言，未入正史。",
  }
}

function graphFromStorylines(lines: StorylineCandidate[], atomCards: TianyiImmersiveCardView[]) {
  const positions = [
    { x: 28, y: 30 },
    { x: 68, y: 32 },
    { x: 74, y: 66 },
    { x: 34, y: 72 },
    { x: 52, y: 20 },
    { x: 18, y: 55 },
    { x: 84, y: 52 },
  ]
  const lineNodes: TianyiImmersiveGraphNodeView[] = lines.flatMap((line, lineIndex) =>
    line.nodes.slice(0, lineIndex === 0 ? 4 : 2).map((node, nodeIndex) => {
      const position = positions[(lineIndex * 3 + nodeIndex) % positions.length]
      return {
        id: `graph-${node.id}`,
        label: cleanSummary(node.summary, 12),
        cardKind: cardKindForStoryline(line.type),
        x: position.x,
        y: position.y,
      }
    }),
  )
  const fallbackNodes: TianyiImmersiveGraphNodeView[] = atomCards.slice(0, 5).map((card, index) => {
    const position = positions[index % positions.length]
    return {
      id: `graph-${card.id}`,
      label: cleanSummary(card.summary, 12),
      cardKind: card.cardKind,
      x: position.x,
      y: position.y,
    }
  })
  const graphNodes = lineNodes.length ? lineNodes : fallbackNodes
  const graphEdges = graphNodes.map((node) => ({ from: "core", to: node.id, label: "显影" }))
  return {
    graphNodes: [{ id: "core", label: "天意", cardKind: "core" as const, x: 50, y: 50 }, ...graphNodes],
    graphEdges,
  }
}

export function deriveTianyiImmersiveView(input: string): TianyiImmersiveDerivedView {
  const classification = classifyTianyiInput(input)
  const atoms = deriveStoryAtomCandidates(input)
  const storylines = deriveStorylineCandidates(atoms)
  const compressedMemory = deriveCompressedMemoryPreview(storylines)
  const prophecies = deriveProphecyCandidates(storylines)
  const atomCards = atoms.slice(0, 5).map(atomToCard)
  const storylineCards = storylines.slice(0, 3).map(storylineToCard)
  const { graphNodes, graphEdges } = graphFromStorylines(storylines, atomCards)

  return {
    inputKindLabel: INPUT_KIND_LABELS[classification.kind],
    inputSummary: cleanSummary(input, classification.kind === "manuscript" ? 120 : 80),
    atomCards,
    storylineCards,
    graphNodes,
    graphEdges,
    storylineRailItems: storylines.slice(0, 5).map((line) => ({
      id: `rail-${line.id}`,
      label: line.title,
      typeLabel: STORYLINE_TYPE_LABELS[line.type],
      statusLabel: statusLabel(line.status),
      riskLabel: line.risks[0] ?? "等待作者确认走向。",
    })),
    compressedMemoryPreview: compressedMemory.map(memoryToView),
    prophecyPreviews: prophecies.map((prophecy) => prophecyToView(prophecy, storylines)),
    boundaryText: "本轮为本地预演，未调用真实模型；候选故事线、压缩记忆和候选预言都不会写正史。",
    isManuscript: classification.kind === "manuscript",
  }
}

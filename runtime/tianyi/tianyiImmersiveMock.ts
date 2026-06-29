import type {
  TianyiImmersiveDerivedView,
  TianyiImmersiveMemoryLayerView,
  TianyiImmersiveProphecyView,
} from "./tianyiStorylineImmersiveAdapter"

export type TianyiMode = "creative" | "dialogue"

export type TianyiCardType =
  | "character"
  | "location"
  | "item"
  | "clue"
  | "foreshadow"
  | "plot"
  | "node"

export type TianyiExtractedCard = {
  id: string
  type: TianyiCardType
  displayTypeLabel?: string
  title: string
  summary: string
  source: "本轮对话"
  status: "候选"
  saved: boolean
  evidenceLabel?: string
  boundaryLabel?: string
}

export type TianyiGraphNode = {
  id: string
  label: string
  type: TianyiCardType | "core"
  x: number
  y: number
}

export type TianyiGraphEdge = {
  from: string
  to: string
  label?: string
}

export type TianyiMessage = {
  id: string
  role: "author" | "tianyi"
  text: string
}

export type TianyiImmersiveState = {
  mode: TianyiMode
  messages: TianyiMessage[]
  cards: TianyiExtractedCard[]
  graphNodes: TianyiGraphNode[]
  graphEdges: TianyiGraphEdge[]
  storyline: string[]
  savedCardIds: string[]
  turnCount: number
  inputKindLabel: string | null
  inputSummary: string | null
  boundaryText: string
  compressedMemoryPreview: TianyiImmersiveMemoryLayerView[]
  prophecyPreviews: TianyiImmersiveProphecyView[]
  manuscriptBranch: {
    title: string
    text: string
  } | null
}

const CARD_SEEDS: Array<Omit<TianyiExtractedCard, "id" | "saved"> & { nodeLabel: string; x: number; y: number }> = [
  {
    type: "character",
    title: "林栖",
    summary: "可能是故事的感知中心，和旧宅、铃声或继承疑云有关。",
    source: "本轮对话",
    status: "候选",
    nodeLabel: "林栖",
    x: 24,
    y: 35,
  },
  {
    type: "location",
    title: "鹤湾旧宅",
    summary: "像是故事开端或秘密聚集的地点，可以承载回忆、遗产和风险。",
    source: "本轮对话",
    status: "候选",
    nodeLabel: "旧宅",
    x: 70,
    y: 30,
  },
  {
    type: "item",
    title: "青铜铃",
    summary: "适合作为反复出现的道具，可能连接人物身世或某个未解事件。",
    source: "本轮对话",
    status: "候选",
    nodeLabel: "青铜铃",
    x: 58,
    y: 68,
  },
  {
    type: "clue",
    title: "账册缺页",
    summary: "可以成为推动调查的线索，让人物从情绪进入行动。",
    source: "本轮对话",
    status: "候选",
    nodeLabel: "缺页",
    x: 33,
    y: 72,
  },
  {
    type: "foreshadow",
    title: "雨夜铃声",
    summary: "适合做伏笔：先当异象出现，后面再解释它来自人、物或记忆。",
    source: "本轮对话",
    status: "候选",
    nodeLabel: "雨夜铃声",
    x: 78,
    y: 55,
  },
  {
    type: "plot",
    title: "继承疑云",
    summary: "可作为短线剧情：从遗物、账册和隐瞒关系推进到一次选择。",
    source: "本轮对话",
    status: "候选",
    nodeLabel: "继承疑云",
    x: 43,
    y: 20,
  },
  {
    type: "node",
    title: "第一次隐瞒",
    summary: "一个关键节点：角色选择不说真话，后续关系张力由此产生。",
    source: "本轮对话",
    status: "候选",
    nodeLabel: "隐瞒",
    x: 18,
    y: 58,
  },
]

const STORYLINE_SEEDS = ["雨夜旧宅", "青铜铃响", "账册缺页", "继承疑云", "第一次隐瞒"]

export function createInitialTianyiImmersiveState(): TianyiImmersiveState {
  return {
    mode: "dialogue",
    messages: [],
    cards: [],
    graphNodes: [{ id: "core", label: "天意", type: "core", x: 50, y: 50 }],
    graphEdges: [],
    storyline: [],
    savedCardIds: [],
    turnCount: 0,
    inputKindLabel: null,
    inputSummary: null,
    boundaryText: "本轮为本地预演：只演示天意交互结构，未调用真实模型。",
    compressedMemoryPreview: [],
    prophecyPreviews: [],
    manuscriptBranch: null,
  }
}

function uniqueById<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values())
}

function nextCardSeeds(turnCount: number) {
  const start = Math.min(turnCount * 2, CARD_SEEDS.length - 1)
  return CARD_SEEDS.slice(start, start + 3)
}

export function advanceTianyiSphere(state: TianyiImmersiveState, text: string): TianyiImmersiveState {
  const cleanText = text.trim()
  if (!cleanText) return state

  const turn = state.turnCount + 1
  const seeds = nextCardSeeds(state.turnCount)
  const newCards: TianyiExtractedCard[] = seeds.map((seed, index) => ({
    id: `tianyi-card-${state.turnCount}-${seed.type}-${index}`,
    type: seed.type,
    title: seed.title,
    summary: seed.summary,
    source: seed.source,
    status: seed.status,
    saved: false,
  }))
  const newNodes: TianyiGraphNode[] = seeds.map((seed, index) => ({
    id: `tianyi-node-${state.turnCount}-${seed.type}-${index}`,
    label: seed.nodeLabel,
    type: seed.type,
    x: seed.x,
    y: seed.y,
  }))
  const newEdges: TianyiGraphEdge[] = newNodes.map((node) => ({ from: "core", to: node.id, label: "浮现" }))
  const storyline = STORYLINE_SEEDS.slice(0, Math.min(STORYLINE_SEEDS.length, Math.max(2, turn + 2)))

  return {
    ...state,
    turnCount: turn,
    messages: [
      ...state.messages,
      { id: `author-sphere-${turn}`, role: "author", text: cleanText },
      {
        id: `tianyi-sphere-${turn}`,
        role: "tianyi",
        text: "我先记录这些想法，并把可能的角色、地点、物品和线索放到候选区。",
      },
    ],
    cards: uniqueById([...state.cards, ...newCards]),
    graphNodes: uniqueById([...state.graphNodes, ...newNodes]),
    graphEdges: uniqueById([...state.graphEdges, ...newEdges].map((edge, index) => ({ ...edge, id: `${edge.from}-${edge.to}-${index}` } as TianyiGraphEdge & { id: string }))).map(({ id: _id, ...edge }) => edge),
    storyline,
  }
}

export function appendTianyiDialogueTurn(state: TianyiImmersiveState, text: string): TianyiImmersiveState {
  const cleanText = text.trim()
  if (!cleanText) return state
  const turn = state.turnCount + 1
  const reply = state.cards.length
    ? "我会先沿着已浮现的候选看未来走向：人物选择、道具回响和未解释线索会一起影响下一幕。当前仍是本地预演，不会写入正史。"
    : "我还没有足够的故事材料。你可以先说人物、地点、冲突或一个画面，我会把它们整理成候选。"

  return {
    ...state,
    mode: "dialogue",
    turnCount: turn,
    messages: [
      ...state.messages,
      { id: `author-dialogue-${turn}`, role: "author", text: cleanText },
      { id: `tianyi-dialogue-${turn}`, role: "tianyi", text: reply },
    ],
  }
}

export function applyTianyiDerivedView(
  state: TianyiImmersiveState,
  text: string,
  view: TianyiImmersiveDerivedView,
): TianyiImmersiveState {
  const cleanText = text.trim()
  if (!cleanText) return state
  const turn = state.turnCount + 1
  const derivedCards: TianyiExtractedCard[] = [...view.atomCards, ...view.storylineCards].slice(0, 7).map((card) => ({
    id: card.id,
    type: card.cardKind,
    displayTypeLabel: card.typeLabel,
    title: card.title,
    summary: card.summary,
    source: card.sourceLabel,
    status: card.statusLabel === "候选" ? "候选" : "候选",
    saved: false,
    evidenceLabel: card.evidenceLabel,
    boundaryLabel: card.boundaryLabel,
  }))
  const storyline = view.storylineRailItems.length
    ? view.storylineRailItems.map((item) => item.label).slice(0, 6)
    : view.atomCards.map((card) => card.title).slice(0, 4)
  const tianyiReply = view.isManuscript
    ? "我识别到这是一段正文。先展示故事线、压缩记忆和候选预言；如果你确认，再进入拆分预览。"
    : `我识别为${view.inputKindLabel}，先把可用的故事原子、候选故事线和可能走向放到预演区。`

  return {
    ...state,
    mode: state.mode,
    turnCount: turn,
    messages: [
      ...state.messages,
      { id: `author-storyline-${turn}`, role: "author", text: cleanText },
      { id: `tianyi-storyline-${turn}`, role: "tianyi", text: tianyiReply },
    ],
    cards: derivedCards,
    graphNodes: view.graphNodes.map((node) => ({
      id: node.id,
      label: node.label,
      type: node.cardKind,
      x: node.x,
      y: node.y,
    })),
    graphEdges: view.graphEdges,
    storyline,
    inputKindLabel: view.inputKindLabel,
    inputSummary: view.inputSummary,
    boundaryText: view.boundaryText,
    compressedMemoryPreview: view.compressedMemoryPreview,
    prophecyPreviews: view.prophecyPreviews,
    manuscriptBranch: view.isManuscript ? { title: "天意投喂正文", text: cleanText } : null,
  }
}

export function appendTianyiProphecyDialogueTurn(
  state: TianyiImmersiveState,
  text: string,
  view: TianyiImmersiveDerivedView,
): TianyiImmersiveState {
  const cleanText = text.trim()
  if (!cleanText) return state
  const turn = state.turnCount + 1
  const prophecy = view.prophecyPreviews[0]
  const reply = prophecy
    ? `基于当前候选故事线，天意预演出一个可能走向：${prophecy.prediction} 风险：${prophecy.riskLabel}。还需要确认：${prophecy.nextQuestionLabel}。这是候选预言，未入正史。`
    : "我还没有足够的故事材料。你可以先说人物、地点、冲突或一个画面，我会把它们整理成候选。"

  return {
    ...applyTianyiDerivedView({ ...state, mode: "dialogue" }, cleanText, view),
    mode: "dialogue",
    messages: [
      ...state.messages,
      { id: `author-dialogue-${turn}`, role: "author", text: cleanText },
      { id: `tianyi-dialogue-${turn}`, role: "tianyi", text: reply },
    ],
    turnCount: turn,
  }
}

export function saveTianyiCard(state: TianyiImmersiveState, cardId: string): TianyiImmersiveState {
  if (!state.cards.some((card) => card.id === cardId)) return state
  const savedCardIds = state.savedCardIds.includes(cardId) ? state.savedCardIds : [...state.savedCardIds, cardId]
  return {
    ...state,
    savedCardIds,
    cards: state.cards.map((card) => (card.id === cardId ? { ...card, saved: true } : card)),
  }
}

export function setTianyiMode(state: TianyiImmersiveState, mode: TianyiMode): TianyiImmersiveState {
  return { ...state, mode }
}

export function savedTianyiCards(state: TianyiImmersiveState) {
  const saved = new Set(state.savedCardIds)
  return state.cards.filter((card) => saved.has(card.id))
}

export function tianyiCardTypeLabel(type: TianyiCardType) {
  switch (type) {
    case "character": return "角色卡"
    case "location": return "地点卡"
    case "item": return "物品卡"
    case "clue": return "线索卡"
    case "foreshadow": return "伏笔卡"
    case "plot": return "剧情线卡"
    case "node": return "节点卡"
  }
}

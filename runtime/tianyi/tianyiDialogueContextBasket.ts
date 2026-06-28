export const TIANYI_CONTEXT_BASKET_MIME = "application/x-devcanvas-tianyi-context"
export const TIANYI_CONTEXT_BASKET_MAX_ITEMS = 6
export const TIANYI_CONTEXT_BASKET_ADD_EVENT = "devcanvas:tianyi-context-add"

export type TianyiDialogueContextItemKind =
  | "candidate_card"
  | "story_object"
  | "story_node"
  | "story_branch"
  | "source_evidence"
  | "unknown"

export interface TianyiDialogueContextItem {
  id: string
  kind: TianyiDialogueContextItemKind
  kindLabel: string
  title: string
  summary: string
  sourceLabel: string
  evidenceLabel?: string
  riskLabel?: string
  candidateOnly: true
}

export interface TianyiDialogueContextBasketView {
  items: TianyiDialogueContextItem[]
  maxItems: number
  summary: string
  boundaryText: string
}

const KIND_LABELS: Record<TianyiDialogueContextItemKind, string> = {
  candidate_card: "候选卡",
  story_object: "故事对象",
  story_node: "故事节点",
  story_branch: "候选分支",
  source_evidence: "原文依据",
  unknown: "上下文",
}

function cleanText(value: unknown, fallback: string, maxLength = 140) {
  const text = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : ""
  const safe = text || fallback
  return safe.length > maxLength ? `${safe.slice(0, maxLength - 1)}…` : safe
}

function normalizeKind(value: unknown): TianyiDialogueContextItemKind {
  const allowed: TianyiDialogueContextItemKind[] = [
    "candidate_card",
    "story_object",
    "story_node",
    "story_branch",
    "source_evidence",
    "unknown",
  ]
  return allowed.includes(value as TianyiDialogueContextItemKind)
    ? (value as TianyiDialogueContextItemKind)
    : "unknown"
}

export function normalizeTianyiContextItem(
  input: Partial<TianyiDialogueContextItem>,
): TianyiDialogueContextItem {
  const kind = normalizeKind(input.kind)
  const title = cleanText(input.title, "未命名上下文", 80)
  return {
    id: cleanText(input.id, `${kind}:${title}`, 120),
    kind,
    kindLabel: cleanText(input.kindLabel, KIND_LABELS[kind], 40),
    title,
    summary: cleanText(input.summary, "作者加入的候选上下文。", 180),
    sourceLabel: cleanText(input.sourceLabel, "来源待确认", 80),
    evidenceLabel: cleanText(input.evidenceLabel, "依据待确认", 80),
    riskLabel: input.riskLabel ? cleanText(input.riskLabel, "风险待确认", 80) : undefined,
    candidateOnly: true,
  }
}

export function addTianyiContextItem(
  items: TianyiDialogueContextItem[],
  item: Partial<TianyiDialogueContextItem>,
  maxItems = TIANYI_CONTEXT_BASKET_MAX_ITEMS,
): TianyiDialogueContextItem[] {
  const normalized = normalizeTianyiContextItem(item)
  const exists = items.some((current) => current.kind === normalized.kind && current.id === normalized.id)
  if (exists) return items
  if (items.length >= maxItems) return items
  return [...items, normalized]
}

export function removeTianyiContextItem(
  items: TianyiDialogueContextItem[],
  id: string,
): TianyiDialogueContextItem[] {
  return items.filter((item) => item.id !== id)
}

export function encodeTianyiContextDragData(item: TianyiDialogueContextItem): string {
  return JSON.stringify(normalizeTianyiContextItem(item))
}

export function decodeTianyiContextDragData(value: string): TianyiDialogueContextItem | null {
  try {
    const parsed = JSON.parse(value) as Partial<TianyiDialogueContextItem>
    if (!parsed || typeof parsed !== "object") return null
    return normalizeTianyiContextItem(parsed)
  } catch {
    return null
  }
}

export function buildTianyiContextBasketView(
  items: TianyiDialogueContextItem[],
  maxItems = TIANYI_CONTEXT_BASKET_MAX_ITEMS,
): TianyiDialogueContextBasketView {
  const safeItems = items.slice(0, maxItems).map((item) => normalizeTianyiContextItem(item))
  return {
    items: safeItems,
    maxItems,
    summary: safeItems.length ? `已加入 ${safeItems.length} / ${maxItems}` : `已加入 0 / ${maxItems}`,
    boundaryText: "候选未入正史；这里只是本地提问上下文。",
  }
}

export function buildTianyiContextBasketPrompt({
  items,
  question,
}: {
  items: TianyiDialogueContextItem[]
  question: string
}): string {
  const safeItems = items.slice(0, TIANYI_CONTEXT_BASKET_MAX_ITEMS).map((item) => normalizeTianyiContextItem(item))
  const cleanQuestion = cleanText(question, "请帮我判断这些上下文之间的关系。", 300)
  const lines = safeItems.map((item, index) => {
    const detail = [item.summary, item.sourceLabel, item.evidenceLabel, item.riskLabel].filter(Boolean).join("；")
    return `${index + 1}. ${item.kindLabel}：${item.title}。${detail}`
  })

  return [
    "请围绕以下上下文思考：",
    ...lines,
    `我的问题是：${cleanQuestion}`,
    "注意：这些内容仍是候选观察，未入正史；请只做本地预演式分析。",
  ].join("\n")
}

export function dispatchTianyiContextItem(item: Partial<TianyiDialogueContextItem>) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent<TianyiDialogueContextItem>(TIANYI_CONTEXT_BASKET_ADD_EVENT, {
      detail: normalizeTianyiContextItem(item),
    }),
  )
}

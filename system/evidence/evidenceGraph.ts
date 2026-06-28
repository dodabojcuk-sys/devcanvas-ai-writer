export type EvidenceMemoryIndexKind = "character" | "location" | "item" | "time"

export interface EvidenceMemoryReference {
  id: string
  kind: EvidenceMemoryIndexKind
  label: string
  evidenceId: string
  readOnly: true
}

function matches(input: string, pattern: RegExp, fallback: string) {
  return input.match(pattern)?.[0] ?? fallback
}

export function buildEvidenceGraph(payload: Record<string, unknown>): EvidenceMemoryReference[] {
  const input = typeof payload.input === "string" ? payload.input : ""
  return [
    {
      id: "evidence-character-primary",
      kind: "character",
      label: matches(input, /[\u4e00-\u9fa5]{2,4}/, "角色待确认"),
      evidenceId: "evidence-preview-character",
      readOnly: true,
    },
    {
      id: "evidence-location-primary",
      kind: "location",
      label: matches(input, /(旧宅|祠堂|茶馆|城|山|巷|湾)/, "地点待确认"),
      evidenceId: "evidence-preview-location",
      readOnly: true,
    },
    {
      id: "evidence-item-primary",
      kind: "item",
      label: matches(input, /(青铜铃|账册|钥匙|玉佩|物品|道具)/, "物品待确认"),
      evidenceId: "evidence-preview-item",
      readOnly: true,
    },
    {
      id: "evidence-time-primary",
      kind: "time",
      label: matches(input, /(雨夜|清晨|傍晚|当年|后来)/, "时间待确认"),
      evidenceId: "evidence-preview-time",
      readOnly: true,
    },
  ]
}

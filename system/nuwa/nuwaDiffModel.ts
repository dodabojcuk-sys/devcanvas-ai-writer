export type NuwaRewriteAction =
  | "rewrite_text"
  | "expand_paragraph"
  | "compress_paragraph"
  | "style_transform"

export interface NuwaRewriteDiff {
  action: NuwaRewriteAction
  before: string
  after: string
  changeSummary: string
  approvalGate: "kernel_required"
}

function cleanText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().replace(/\s+/g, " ") : "当前段落"
}

export function buildNuwaRewriteDiff(action: NuwaRewriteAction, sourceText: unknown): NuwaRewriteDiff {
  const before = cleanText(sourceText)
  const actionLabel: Record<NuwaRewriteAction, string> = {
    rewrite_text: "重写",
    expand_paragraph: "扩写",
    compress_paragraph: "压缩",
    style_transform: "风格转换",
  }

  return {
    action,
    before,
    after: `${before}（${actionLabel[action]}候选稿，等待作者确认）`,
    changeSummary: `${actionLabel[action]}只生成候选差异，不写入正史。`,
    approvalGate: "kernel_required",
  }
}

export type KernelIntentKind =
  | "dialogue"
  | "story_structure"
  | "revision"
  | "evidence_question"
  | "prediction"
  | "validation"
  | "history_trace"
  | "state_query"
  | "uncertain"

export type KernelIntentConfidence = "low" | "medium" | "high"

export interface KernelIntent {
  kind: KernelIntentKind
  confidence: KernelIntentConfidence
  reasons: string[]
  normalizedInput: string
}

function normalizeInput(input: string) {
  return input.replace(/\s+/g, " ").trim()
}

function hasAny(input: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(input))
}

export function classifyKernelIntent(input: string): KernelIntent {
  const normalizedInput = normalizeInput(input)
  if (!normalizedInput) {
    return {
      kind: "uncertain",
      confidence: "low",
      reasons: ["empty_input"],
      normalizedInput,
    }
  }

  const checks: Array<{ kind: KernelIntentKind; reason: string; patterns: RegExp[] }> = [
    {
      kind: "revision",
      reason: "revision_or_expansion_request",
      patterns: [/(修改|重写|扩写|续写|润色|调整|删掉|加强|弱化|改成)/],
    },
    {
      kind: "evidence_question",
      reason: "evidence_or_source_request",
      patterns: [/(证据|依据|来源|原文|出处|可追溯|从哪里|哪一段)/],
    },
    {
      kind: "prediction",
      reason: "prediction_request",
      patterns: [/(预测|预言|接下来|会怎样|未来|走向|风险)/],
    },
    {
      kind: "validation",
      reason: "validation_request",
      patterns: [/(验证|校验|检查|是否合理|模型|执行|可靠)/],
    },
    {
      kind: "history_trace",
      reason: "audit_or_history_request",
      patterns: [/(历史|追踪|审计|记录|变更|日志)/],
    },
    {
      kind: "state_query",
      reason: "living_book_state_request",
      patterns: [/(状态|当前世界|活书|Living Book|正史|世界状态)/i],
    },
    {
      kind: "story_structure",
      reason: "event_line_or_structure_request",
      patterns: [/(事件线|故事线|结构|主线|暗线|分支|因果|伏笔|时间线)/],
    },
  ]

  const matched = checks.find((check) => hasAny(normalizedInput, check.patterns))
  if (matched) {
    return {
      kind: matched.kind,
      confidence: "high",
      reasons: [matched.reason],
      normalizedInput,
    }
  }

  if (hasAny(normalizedInput, [/(随便|看看|都行|不知道|你决定|无所谓)/])) {
    return {
      kind: "uncertain",
      confidence: "low",
      reasons: ["vague_or_underspecified_prompt"],
      normalizedInput,
    }
  }

  if (/[?？]$/.test(normalizedInput)) {
    return {
      kind: "dialogue",
      confidence: "medium",
      reasons: ["question_without_system_target"],
      normalizedInput,
    }
  }

  return {
    kind: normalizedInput.length >= 180 ? "story_structure" : "dialogue",
    confidence: normalizedInput.length >= 180 ? "medium" : "medium",
    reasons: [normalizedInput.length >= 180 ? "long_story_material" : "general_tianyi_dialogue"],
    normalizedInput,
  }
}

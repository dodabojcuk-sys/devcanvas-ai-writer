import type { KernelManagedContext } from "./contextManager"
import type { KernelIntent } from "./intentClassifier"
import type { KernelSystemTarget } from "./router"

export interface KernelConstraintInput {
  intent: KernelIntent
  systemsRequested?: KernelSystemTarget[]
  context: KernelManagedContext
}

export interface KernelConstraintEvaluation {
  allowed: boolean
  primarySystem: KernelSystemTarget
  secondarySystems: KernelSystemTarget[]
  blockedSystems: KernelSystemTarget[]
  violations: string[]
  fallbackTo?: "tianyi"
  systemsRequested: KernelSystemTarget[]
  executionMode: "derived" | "fallback"
}

const DIRECT_ENTRY_PATTERNS: Array<{ target: KernelSystemTarget; patterns: RegExp[] }> = [
  { target: "event_line", patterns: [/(直接|打开|进入|调用).{0,8}(事件线|故事线)/, /(事件线|故事线).{0,8}(直接|打开|进入|调用)/] },
  { target: "nuwa", patterns: [/(直接|打开|进入|调用).{0,8}(女娲|nuwa)/i, /(女娲|nuwa).{0,8}(直接|打开|进入|调用)/i] },
  { target: "evidence", patterns: [/(直接|打开|进入|调用).{0,8}(证据|evidence)/i, /(证据|evidence).{0,8}(直接|打开|进入|调用)/i] },
  { target: "model", patterns: [/(直接|打开|进入|调用).{0,8}(模型|model)/i, /(模型|model).{0,8}(直接|打开|进入|调用)/i] },
]

function defaultRequestedSystems(intent: KernelIntent): KernelSystemTarget[] {
  switch (intent.kind) {
    case "dialogue":
      return ["tianyi"]
    case "story_structure":
      return ["event_line"]
    case "revision":
      return ["tianyi", "nuwa"]
    case "evidence_question":
      return ["tianyi", "evidence"]
    case "prediction":
      return ["event_line", "evidence", "model"]
    case "validation":
      return ["tianyi", "model"]
    case "history_trace":
      return ["tianyi", "audit"]
    case "state_query":
      return ["tianyi", "living_book"]
    case "uncertain":
      return ["tianyi"]
  }
}

function directEntryTargets(input: string): KernelSystemTarget[] {
  return DIRECT_ENTRY_PATTERNS
    .filter((entry) => entry.patterns.some((pattern) => pattern.test(input)))
    .map((entry) => entry.target)
}

function fallbackEvaluation(args: {
  systemsRequested: KernelSystemTarget[]
  blockedSystems: KernelSystemTarget[]
  violations: string[]
}): KernelConstraintEvaluation {
  return {
    allowed: false,
    primarySystem: "tianyi",
    secondarySystems: [],
    blockedSystems: Array.from(new Set(args.blockedSystems)),
    violations: args.violations,
    fallbackTo: "tianyi",
    systemsRequested: args.systemsRequested,
    executionMode: "fallback",
  }
}

export function evaluateKernelConstraints({
  intent,
  systemsRequested = defaultRequestedSystems(intent),
  context,
}: KernelConstraintInput): KernelConstraintEvaluation {
  const directTargets = directEntryTargets(context.input)
  if (directTargets.length) {
    return fallbackEvaluation({
      systemsRequested,
      blockedSystems: directTargets,
      violations: directTargets.map((target) => `${target}_direct_entry_forbidden`),
    })
  }

  if (intent.kind === "uncertain") {
    return fallbackEvaluation({
      systemsRequested,
      blockedSystems: ["event_line", "evidence", "model", "nuwa"],
      violations: ["uncertain_intent_requires_tianyi_fallback"],
    })
  }

  if (intent.kind === "prediction") {
    return {
      allowed: true,
      primarySystem: "event_line",
      secondarySystems: ["evidence", "model"],
      blockedSystems: systemsRequested.filter((target) => !["event_line", "evidence", "model"].includes(target)),
      violations: [],
      systemsRequested,
      executionMode: "derived",
    }
  }

  if (systemsRequested.length === 1 && systemsRequested[0] === "model") {
    return fallbackEvaluation({
      systemsRequested,
      blockedSystems: ["model"],
      violations: ["model_cannot_execute_alone"],
    })
  }

  const primarySystem = systemsRequested[0] === "model" ? "tianyi" : systemsRequested[0]
  const secondarySystems = systemsRequested
    .filter((target) => target !== primarySystem)
    .slice(0, 2)

  return {
    allowed: true,
    primarySystem,
    secondarySystems,
    blockedSystems: systemsRequested.slice(3),
    violations: [],
    systemsRequested,
    executionMode: "derived",
  }
}

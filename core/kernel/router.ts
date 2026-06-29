import type { KernelManagedContext } from "@/core/kernel/contextManager"
import { evaluateKernelConstraints, type KernelConstraintEvaluation } from "@/core/kernel/constraintEngine"
import type { KernelIntent } from "@/core/kernel/intentClassifier"
import { resolveSystemPriority, type KernelSystemPriorityPlan } from "@/core/kernel/systemPriorityResolver"

export type KernelSystemTarget =
  | "tianyi"
  | "event_line"
  | "nuwa"
  | "evidence"
  | "model"
  | "audit"
  | "living_book"

export interface KernelRoute {
  intent: KernelIntent
  targets: KernelSystemTarget[]
  executionPlan: {
    primarySystem: KernelSystemTarget
    secondarySystems: KernelSystemTarget[]
    blockedSystems: KernelSystemTarget[]
    entrySurface: "kernel"
    reason: string
  }
  constraintApproved: boolean
  constraint: KernelConstraintEvaluation
  coordinationMode: "single_system" | "multi_system_vote" | "multi_system_pipeline"
  returnSurface: "tianyi"
  boundaryText: string
}

const ROUTE_TABLE: Record<KernelIntent["kind"], KernelSystemTarget[]> = {
  "dialogue": ["tianyi"],
  "story_structure": ["event_line"],
  "revision": ["nuwa"],
  "evidence_question": ["evidence"],
  "prediction": ["event_line", "evidence", "model"],
  "validation": ["model"],
  "history_trace": ["audit"],
  "state_query": ["living_book"],
  "uncertain": ["tianyi", "event_line", "evidence"],
}

function buildRoute(intent: KernelIntent, priorityPlan: KernelSystemPriorityPlan): KernelRoute {
  const targets = [priorityPlan.primary, ...priorityPlan.secondary]
  const coordinationMode =
    priorityPlan.constraint.fallbackTo
      ? "multi_system_vote"
      : targets.length > 1
        ? "multi_system_pipeline"
        : "single_system"

  return {
    intent,
    targets,
    executionPlan: {
      primarySystem: priorityPlan.primary,
      secondarySystems: priorityPlan.secondary,
      blockedSystems: priorityPlan.blocked,
      entrySurface: "kernel",
      reason: priorityPlan.reason,
    },
    constraintApproved: true,
    constraint: priorityPlan.constraint,
    coordinationMode,
    returnSurface: "tianyi",
    boundaryText: "Kernel 是唯一调度入口；系统能力只返回给 AI 天意，不直接暴露为入口。",
  }
}

export function routeKernelIntent(
  intent: KernelIntent,
  context: KernelManagedContext,
  priorityPlan?: KernelSystemPriorityPlan,
): KernelRoute {
  const constraint = priorityPlan?.constraint ?? evaluateKernelConstraints({
    intent,
    systemsRequested: ROUTE_TABLE[intent.kind] ?? ROUTE_TABLE.uncertain,
    context,
  })
  return buildRoute(intent, priorityPlan ?? resolveSystemPriority(constraint))
}

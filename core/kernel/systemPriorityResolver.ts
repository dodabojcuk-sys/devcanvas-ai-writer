import type { KernelConstraintEvaluation } from "./constraintEngine"
import type { KernelSystemTarget } from "./router"

export interface KernelSystemPriorityPlan {
  primary: KernelSystemTarget
  secondary: KernelSystemTarget[]
  blocked: KernelSystemTarget[]
  reason: string
  constraint: KernelConstraintEvaluation
}

const SYSTEM_PRIORITY: KernelSystemTarget[] = [
  "tianyi",
  "event_line",
  "evidence",
  "nuwa",
  "model",
  "audit",
  "living_book",
]

function sortByPriority(systems: KernelSystemTarget[]) {
  return [...systems].sort((left, right) => SYSTEM_PRIORITY.indexOf(left) - SYSTEM_PRIORITY.indexOf(right))
}

export function resolveSystemPriority(constraint: KernelConstraintEvaluation): KernelSystemPriorityPlan {
  if (constraint.fallbackTo) {
    return {
      primary: "tianyi",
      secondary: [],
      blocked: sortByPriority([
        ...constraint.blockedSystems,
        ...constraint.systemsRequested.filter((target) => target !== "tianyi"),
      ]),
      reason: `fallback:${constraint.violations.join(",") || "constraint_violation"}`,
      constraint,
    }
  }

  return {
    primary: constraint.primarySystem,
    secondary: sortByPriority(constraint.secondarySystems).slice(0, 2),
    blocked: sortByPriority(constraint.blockedSystems),
    reason: constraint.allowed ? "constraint_approved" : "constraint_denied",
    constraint,
  }
}

import type { KernelConstraintEvaluation } from "./constraintEngine"
import type { KernelIntent } from "./intentClassifier"
import type { KernelRoute } from "./router"
import type { KernelDispatchResult } from "./systemDispatcher"

export interface KernelDecisionLog {
  intentSummary: string
  constraintSummary: string
  routingSummary: string
  fallbackReason: string | null
  dispatchSummary: string
}

function fallbackReasonFor(constraint: KernelConstraintEvaluation) {
  if (!constraint.fallbackTo) return null
  return constraint.violations.join(",") || "constraint_fallback"
}

export function logKernelDecision({
  input,
  intent,
  route,
  dispatch,
}: {
  input: string
  intent: KernelIntent
  route: KernelRoute
  dispatch: KernelDispatchResult
}): KernelDecisionLog {
  const fallbackReason = fallbackReasonFor(route.constraint)
  return {
    intentSummary: `Input "${input}" classified as ${intent.kind} (${intent.confidence}).`,
    constraintSummary: route.constraint.allowed
      ? `Constraint approved primary ${route.executionPlan.primarySystem}.`
      : `Constraint fallback to Tianyi because ${fallbackReason}.`,
    routingSummary: `Route primary ${route.executionPlan.primarySystem}; secondary ${route.executionPlan.secondarySystems.join(" / ") || "none"}; blocked ${route.executionPlan.blockedSystems.join(" / ") || "none"}.`,
    fallbackReason,
    dispatchSummary: `Dispatcher produced ${dispatch.systemResults.length} system result(s): ${dispatch.systemResults.map((result) => result.target).join(" / ")}.`,
  }
}

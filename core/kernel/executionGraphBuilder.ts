import type { KernelManagedContext } from "./contextManager"
import { logKernelDecision } from "./decisionLogger"
import { createExecutionStep, createExecutionTrace, type KernelExecutionStep } from "./executionTracer"
import type { KernelIntent } from "./intentClassifier"
import type { KernelRoute } from "./router"
import type { KernelDispatchResult } from "./systemDispatcher"

export interface KernelExecutionGraph {
  input: string
  intent: KernelIntent["kind"]
  constraintResult: {
    allowed: boolean
    violations: string[]
    fallbackTo?: "tianyi"
  }
  routingDecision: {
    primarySystem: KernelRoute["executionPlan"]["primarySystem"]
    secondarySystems: KernelRoute["executionPlan"]["secondarySystems"]
    blockedSystems: KernelRoute["executionPlan"]["blockedSystems"]
    reason: string
  }
  primarySystem: KernelRoute["executionPlan"]["primarySystem"]
  secondarySystems: KernelRoute["executionPlan"]["secondarySystems"]
  blockedSystems: KernelRoute["executionPlan"]["blockedSystems"]
  fallbackReason: string | null
  executionSteps: KernelExecutionStep[]
}

function dispatchSteps(dispatch: KernelDispatchResult) {
  return dispatch.systemResults.map((result) => {
    const validationLabel = result.target === "model" ? " model validation-only." : ""
    return createExecutionStep(
      "dispatch",
      `${result.target}: ${result.summary}${validationLabel}`,
      result.status === "executed" ? "completed" : "planned",
    )
  })
}

export function buildKernelExecutionGraph({
  context,
  intent,
  route,
  dispatch,
}: {
  context: KernelManagedContext
  intent: KernelIntent
  route: KernelRoute
  dispatch: KernelDispatchResult
}): KernelExecutionGraph {
  const log = logKernelDecision({ input: context.input, intent, route, dispatch })
  const fallbackReason = log.fallbackReason
  const steps = createExecutionTrace([
    createExecutionStep("input", `Received user input: ${context.input}`),
    createExecutionStep("intent", log.intentSummary),
    createExecutionStep("constraint", log.constraintSummary, fallbackReason ? "blocked" : "completed"),
    createExecutionStep("priority", `Priority plan: ${route.executionPlan.reason}.`),
    createExecutionStep("route", log.routingSummary),
    createExecutionStep("gatekeeper", "Execution gatekeeper accepted Kernel caller."),
    ...dispatchSteps(dispatch),
    createExecutionStep("response", "Response assembled for Tianyi presentation."),
  ])

  return {
    input: context.input,
    intent: intent.kind,
    constraintResult: {
      allowed: route.constraint.allowed,
      violations: route.constraint.violations,
      fallbackTo: route.constraint.fallbackTo,
    },
    routingDecision: {
      primarySystem: route.executionPlan.primarySystem,
      secondarySystems: route.executionPlan.secondarySystems,
      blockedSystems: route.executionPlan.blockedSystems,
      reason: route.executionPlan.reason,
    },
    primarySystem: route.executionPlan.primarySystem,
    secondarySystems: route.executionPlan.secondarySystems,
    blockedSystems: route.executionPlan.blockedSystems,
    fallbackReason,
    executionSteps: steps,
  }
}

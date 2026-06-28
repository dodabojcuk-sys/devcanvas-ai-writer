import { buildKernelContext, type KernelInputContext } from "./contextManager"
import { evaluateKernelConstraints } from "./constraintEngine"
import { createKernelExecutionGate } from "./executionGatekeeper"
import { buildKernelExecutionGraph } from "./executionGraphBuilder"
import { classifyKernelIntent } from "./intentClassifier"
import { assembleKernelResponse } from "./responseAssembler"
import { routeKernelIntent } from "./router"
import { dispatchKernelSystems } from "./systemDispatcher"
import { resolveSystemPriority } from "./systemPriorityResolver"
import type { WritingSessionState } from "../../runtime/session/writingSessionManager"

export type { KernelInputContext } from "./contextManager"
export { createInitialKernelTianyiState } from "./contextManager"
export type { KernelTianyiState } from "./contextManager"
export type { KernelConstraintEvaluation } from "./constraintEngine"
export type { KernelExecutionGate, KernelGateDecision } from "./executionGatekeeper"
export type { KernelExecutionGraph } from "./executionGraphBuilder"
export type { KernelExecutionStep } from "./executionTracer"
export type { KernelIntent, KernelIntentKind } from "./intentClassifier"
export type { DevCanvasKernelResponse, KernelPresentationResponse } from "./responseAssembler"
export type { KernelRoute, KernelSystemTarget } from "./router"
export type { KernelDispatchResult, KernelSystemResult } from "./systemDispatcher"
export type { KernelSystemPriorityPlan } from "./systemPriorityResolver"

export interface DevCanvasProductKernelResponse {
  finalText: string
  suggestions: string[]
  sessionState: WritingSessionState
}

export function processDevCanvasInput(input: KernelInputContext) {
  const context = buildKernelContext(input)
  const intent = classifyKernelIntent(context.input)
  const constraint = evaluateKernelConstraints({ intent, context })
  const priorityPlan = resolveSystemPriority(constraint)
  const route = routeKernelIntent(intent, context, priorityPlan)
  const dispatch = dispatchKernelSystems(route, context, createKernelExecutionGate())
  const executionGraph = buildKernelExecutionGraph({ context, intent, route, dispatch })

  return assembleKernelResponse(dispatch, executionGraph)
}

export function processDevCanvasProductInput(input: KernelInputContext): DevCanvasProductKernelResponse {
  const response = processDevCanvasInput(input)
  const suggestions = response.events
    .map((event) => event.title)
    .filter(Boolean)
    .slice(0, 3)

  return {
    finalText: response.text,
    suggestions: suggestions.length ? suggestions : ["继续写下一段"],
    sessionState: response.sessionState,
  }
}

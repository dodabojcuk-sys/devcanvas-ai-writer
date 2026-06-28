import type { KernelManagedContext } from "./contextManager"
import { assertExecutionAllowed, type KernelExecutionGate } from "./executionGatekeeper"
import type { KernelRoute, KernelSystemTarget } from "./router"
import { createRuntimeKernelGuard, type RuntimeKernelGuard } from "../../runtime/enforcement/runtimeGuard"
import { callSystemAdapter, type SystemAdapterResult, type SystemAdapterTarget } from "../../runtime/systemAdapter"
import {
  appendTianyiProphecyDialogueTurn,
  type TianyiImmersiveState,
} from "../../runtime/tianyi/tianyiImmersiveMock"
import {
  deriveTianyiImmersiveView,
  type TianyiImmersiveDerivedView,
} from "../../runtime/tianyi/tianyiStorylineImmersiveAdapter"
import type { NarrativeState } from "../../types/narrativeContinuity"
import type { WritingSessionState } from "../../runtime/session/writingSessionManager"

export interface KernelSystemResult {
  target: KernelSystemTarget
  status: "executed" | "planned"
  summary: string
  trace: string[]
  payload: Record<string, unknown>
}

export interface KernelDispatchResult {
  route: KernelRoute
  derivedView: TianyiImmersiveDerivedView
  nextTianyiState: TianyiImmersiveState
  systemResults: KernelSystemResult[]
  multiSystem: boolean
  narrativeState: NarrativeState
  previousSessionState?: WritingSessionState
}

function adapterTargetFor(target: KernelSystemTarget): SystemAdapterTarget | null {
  if (target === "tianyi") return null
  return target === "living_book" ? "living_book" : target
}

function adapterResultFor(target: KernelSystemTarget, payload: Record<string, unknown>, runtimeGuard: RuntimeKernelGuard): SystemAdapterResult | null {
  const system = adapterTargetFor(target)
  if (!system) return null
  return callSystemAdapter({ system, payload }, runtimeGuard)
}

function resultForTarget(
  target: KernelSystemTarget,
  derivedView: TianyiImmersiveDerivedView,
  runtimeGuard: RuntimeKernelGuard,
  input: string,
  narrativeState: NarrativeState,
  sessionState?: WritingSessionState,
): KernelSystemResult {
  switch (target) {
    case "tianyi":
      return {
        target,
        status: "executed",
        summary: "天意生成对话回应，并把结果保持为候选态。",
        trace: ["kernel.route.tianyi", "system.tianyi.dialogue"],
        payload: { inputKindLabel: derivedView.inputKindLabel },
      }
    case "event_line":
      const eventLinePayload = {
        storylineCount: derivedView.storylineRailItems.length,
        chapterGrouping: true,
        timelineView: true,
        graphView: true,
      }
      const eventLineAdapter = adapterResultFor(target, eventLinePayload, runtimeGuard)
      return {
        target,
        status: "executed",
        summary: `事件线接收 ${derivedView.storylineRailItems.length} 条候选结构。`,
        trace: ["kernel.route.event_line", ...(eventLineAdapter?.trace ?? []), "system.event_line.derive_structure"],
        payload: eventLineAdapter?.payload ?? eventLinePayload,
      }
    case "nuwa":
      const nuwaPayload = { candidateOnly: true, sourceText: input, input, narrativeState, sessionState }
      const nuwaAdapter = adapterResultFor(target, nuwaPayload, runtimeGuard)
      return {
        target,
        status: "planned",
        summary: "女娲收到修改/扩写意图，只生成候选执行计划，不写正史。",
        trace: ["kernel.route.nuwa", ...(nuwaAdapter?.trace ?? []), "system.nuwa.plan_candidate"],
        payload: nuwaAdapter?.payload ?? nuwaPayload,
      }
    case "evidence":
      const evidencePayload = {
        evidencePreviewCount: [...derivedView.atomCards, ...derivedView.storylineCards].length,
        input,
        previousNarrativeState: narrativeState,
        previousSessionState: sessionState,
      }
      const evidenceAdapter = adapterResultFor(target, evidencePayload, runtimeGuard)
      return {
        target,
        status: "executed",
        summary: "Evidence 检查候选依据数量，并保持可追溯边界。",
        trace: ["kernel.route.evidence", ...(evidenceAdapter?.trace ?? []), "system.evidence.check_sources"],
        payload: evidenceAdapter?.payload ?? evidencePayload,
      }
    case "model":
      const modelPayload = { realModelCall: false, validationOnly: true }
      const modelAdapter = adapterResultFor(target, modelPayload, runtimeGuard)
      return {
        target,
        status: "planned",
        summary: "Model 层只做验证计划，当前不调用真实模型。",
        trace: ["kernel.route.model", ...(modelAdapter?.trace ?? []), "system.model.validation_plan"],
        payload: modelAdapter?.payload ?? modelPayload,
      }
    case "audit":
      const auditPayload = { traceable: true }
      const auditAdapter = adapterResultFor(target, auditPayload, runtimeGuard)
      return {
        target,
        status: "executed",
        summary: "Audit 记录本轮 Kernel 路由与候选输出。",
        trace: ["kernel.route.audit", ...(auditAdapter?.trace ?? []), "system.audit.trace"],
        payload: auditAdapter?.payload ?? auditPayload,
      }
    case "living_book":
      const livingBookPayload = { canonChanged: false }
      const livingBookAdapter = adapterResultFor(target, livingBookPayload, runtimeGuard)
      return {
        target,
        status: "planned",
        summary: "Living Book 返回候选状态摘要，不改变正史。",
        trace: ["kernel.route.living_book", ...(livingBookAdapter?.trace ?? []), "system.living_book.state_read"],
        payload: livingBookAdapter?.payload ?? livingBookPayload,
      }
  }
}

export function dispatchKernelSystems(
  route: KernelRoute,
  context: KernelManagedContext,
  gate?: KernelExecutionGate,
): KernelDispatchResult {
  assertExecutionAllowed(route, gate)
  const runtimeGuard = createRuntimeKernelGuard()
  const derivedView = deriveTianyiImmersiveView(context.input)
  const nextTianyiState = appendTianyiProphecyDialogueTurn(context.tianyiState, context.input, derivedView)
  const continuityAdapter = callSystemAdapter({
    system: "evidence",
    payload: {
      input: context.input,
      evidencePreviewCount: [...derivedView.atomCards, ...derivedView.storylineCards].length,
      previousNarrativeState: context.narrativeState,
      continuityUpdate: true,
      previousSessionState: context.sessionState,
    },
  }, runtimeGuard)
  const narrativeState = continuityAdapter.payload.narrativeState as NarrativeState
  const systemResults = route.targets.map((target) => (
    resultForTarget(target, derivedView, runtimeGuard, context.input, narrativeState, context.sessionState)
  ))

  return {
    route,
    derivedView,
    nextTianyiState,
    systemResults,
    multiSystem: systemResults.length > 1,
    narrativeState,
    previousSessionState: context.sessionState,
  }
}

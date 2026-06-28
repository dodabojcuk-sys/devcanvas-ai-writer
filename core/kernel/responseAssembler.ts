import type { KernelIntent } from "./intentClassifier"
import type { KernelDispatchResult } from "./systemDispatcher"
import type { KernelExecutionGraph } from "./executionGraphBuilder"
import { verifyRuntimeSanity, type RuntimeConsistencyAuditResult } from "../../runtime/audit/runtimeSanityVerifier"
import type { TianyiImmersiveState } from "../../runtime/tianyi/tianyiImmersiveMock"
import { buildWritingSessionState, type WritingSessionState } from "../../runtime/session/writingSessionManager"
import type { NarrativeState } from "../../types/narrativeContinuity"

export interface KernelPresentationResponse {
  surface: "tianyi"
  title: string
  message: string
  handoffNotice: string | null
  explainability: string[]
}

export interface DevCanvasStoryEvent {
  id: string
  title: string
  summary: string
  chapterGroup: string
  timelineOrder: number
  graphNodeId: string
  derivedFrom: "tianyi" | "nuwa"
  sourceSystem: "tianyi" | "event_line"
}

export interface DevCanvasSystemCallView {
  system: Exclude<KernelDispatchResult["systemResults"][number]["target"], "tianyi">
  status: KernelDispatchResult["systemResults"][number]["status"]
  summary: string
  trace: string[]
  payload: Record<string, unknown>
}

export interface DevCanvasKernelResponse {
  intent: KernelIntent
  text: string
  presentation: KernelPresentationResponse
  executionPlan: KernelDispatchResult["route"]["executionPlan"]
  executionGraph: KernelExecutionGraph
  nextTianyiState: TianyiImmersiveState
  trace: string[]
  systemResults: KernelDispatchResult["systemResults"]
  events: DevCanvasStoryEvent[]
  systemCalls: DevCanvasSystemCallView[]
  narrativeState: NarrativeState
  sessionState: WritingSessionState
  auditResult: RuntimeConsistencyAuditResult
}

function handoffNoticeFor(dispatch: KernelDispatchResult) {
  if (dispatch.route.targets.includes("event_line")) {
    return "Kernel 已生成事件线候选结构；事件线只能作为天意派生结果进入。"
  }
  if (dispatch.route.targets.includes("nuwa")) {
    return "Kernel 已识别修改/扩写请求；女娲只生成候选计划，不直接写正史。"
  }
  if (dispatch.route.targets.length > 1) {
    return "Kernel 已启用多系统协调，结果会回到天意统一呈现。"
  }
  return null
}

function chapterGroupFor(index: number) {
  return `第 ${Math.floor(index / 3) + 1} 章候选`
}

function buildStoryEvents(dispatch: KernelDispatchResult): DevCanvasStoryEvent[] {
  const railItems = dispatch.derivedView.storylineRailItems.length
    ? dispatch.derivedView.storylineRailItems
    : dispatch.derivedView.atomCards.map((card) => ({
        id: card.id,
        label: card.title,
        typeLabel: card.typeLabel,
        statusLabel: card.statusLabel,
        riskLabel: card.boundaryLabel,
      }))

  return railItems.slice(0, 8).map((item, index) => ({
    id: `devcanvas-event-${item.id}`,
    title: item.label,
    summary: `${item.typeLabel} / ${item.statusLabel} / ${item.riskLabel}`,
    chapterGroup: chapterGroupFor(index),
    timelineOrder: index + 1,
    graphNodeId: dispatch.derivedView.graphNodes[index + 1]?.id ?? dispatch.derivedView.graphNodes[0]?.id ?? "graph-core",
    derivedFrom: "tianyi",
    sourceSystem: dispatch.route.targets.includes("event_line") ? "event_line" : "tianyi",
  }))
}

function buildSystemCalls(dispatch: KernelDispatchResult): DevCanvasSystemCallView[] {
  return dispatch.systemResults
    .filter((result): result is KernelDispatchResult["systemResults"][number] & { target: DevCanvasSystemCallView["system"] } => result.target !== "tianyi")
    .map((result) => ({
      system: result.target,
      status: result.status,
      summary: result.summary,
      trace: result.trace,
      payload: result.payload,
    }))
}

function tianyiTextFor(dispatch: KernelDispatchResult) {
  const messages = dispatch.nextTianyiState.messages
  const lastMessage = messages[messages.length - 1]
  return lastMessage?.text ?? dispatch.systemResults.map((result) => result.summary).join(" ")
}

export function assembleKernelResponse(
  dispatch: KernelDispatchResult,
  executionGraph: KernelExecutionGraph,
): DevCanvasKernelResponse {
  const summaries = dispatch.systemResults.map((result) => `${result.target}: ${result.summary}`)
  const events = buildStoryEvents(dispatch)
  const sessionState = buildWritingSessionState({
    narrativeState: dispatch.narrativeState,
    events,
    previousSessionState: dispatch.previousSessionState,
  })
  const trace = [
    "kernel.intent_classifier",
    "kernel.constraint_engine",
    "kernel.system_priority_resolver",
    "kernel.router",
    "kernel.execution_gatekeeper",
    ...dispatch.systemResults.flatMap((result) => result.trace),
    "kernel.response_assembler",
    "presentation.tianyi",
  ]

  const response: Omit<DevCanvasKernelResponse, "auditResult"> = {
    intent: dispatch.route.intent,
    text: tianyiTextFor(dispatch),
    presentation: {
      surface: "tianyi",
      title: "Kernel 调度完成",
      message: summaries.join(" "),
      handoffNotice: handoffNoticeFor(dispatch),
      explainability: [
        `意图：${dispatch.route.intent.kind}`,
        `主系统：${dispatch.route.executionPlan.primarySystem}`,
        `辅助系统：${dispatch.route.executionPlan.secondarySystems.join(" / ") || "无"}`,
        `阻断系统：${dispatch.route.executionPlan.blockedSystems.join(" / ") || "无"}`,
        `调度模式：${dispatch.route.coordinationMode}`,
        `目标系统：${dispatch.route.targets.join(" / ")}`,
        dispatch.route.boundaryText,
      ],
    },
    executionPlan: dispatch.route.executionPlan,
    executionGraph,
    nextTianyiState: dispatch.nextTianyiState,
    trace,
    systemResults: dispatch.systemResults,
    events,
    systemCalls: buildSystemCalls(dispatch),
    narrativeState: dispatch.narrativeState,
    sessionState,
  }

  return {
    ...response,
    auditResult: verifyRuntimeSanity(response),
  }
}

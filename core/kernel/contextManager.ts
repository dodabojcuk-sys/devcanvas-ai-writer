import type { TianyiDialogueContextItem } from "../../runtime/tianyi/tianyiDialogueContextBasket"
import type { NarrativeState } from "../../types/narrativeContinuity"
import type { WritingSessionState } from "../../runtime/session/writingSessionManager"
import {
  createInitialTianyiImmersiveState,
  type TianyiImmersiveState,
} from "../../runtime/tianyi/tianyiImmersiveMock"

export interface KernelInputContext {
  input: string
  currentTianyiState?: TianyiImmersiveState
  contextBasketItems?: TianyiDialogueContextItem[]
  narrativeState?: NarrativeState
  sessionState?: WritingSessionState
}

export interface KernelManagedContext {
  input: string
  tianyiState: TianyiImmersiveState
  contextBasketItems: TianyiDialogueContextItem[]
  contextSummary: string
  narrativeState?: NarrativeState
  sessionState?: WritingSessionState
}

export type KernelTianyiState = TianyiImmersiveState

export function createInitialKernelTianyiState(): KernelTianyiState {
  return createInitialTianyiImmersiveState()
}

function narrativeStateFromSession(sessionState?: WritingSessionState): NarrativeState | undefined {
  if (!sessionState) return undefined
  return {
    characters: sessionState.characterState,
    world: sessionState.worldState,
    storyProgress: {
      currentChapter: sessionState.chapterState.currentChapter,
      completedEvents: sessionState.eventState.events.map((event) => event.title),
      unresolvedForeshadows: sessionState.storyMemory.unresolvedForeshadows,
      currentConflict: sessionState.storyMemory.currentConflict,
    },
  }
}

export function buildKernelContext({
  input,
  currentTianyiState,
  contextBasketItems = [],
  narrativeState,
  sessionState,
}: KernelInputContext): KernelManagedContext {
  const tianyiState = currentTianyiState ?? createInitialTianyiImmersiveState()
  const contextSummary = contextBasketItems.length
    ? `上下文篮 ${contextBasketItems.length} 项：${contextBasketItems.map((item) => item.title).join(" / ")}`
    : "上下文篮为空。"

  return {
    input,
    tianyiState,
    contextBasketItems,
    contextSummary,
    narrativeState: narrativeState ?? narrativeStateFromSession(sessionState),
    sessionState,
  }
}

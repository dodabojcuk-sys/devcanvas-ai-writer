import { buildNuwaRewriteDiff, type NuwaRewriteAction, type NuwaRewriteDiff } from "./nuwaDiffModel"
import type { NarrativeState } from "../../types/narrativeContinuity"

export interface NuwaRewritePlan {
  approvalGate: "kernel_required"
  candidateOnly: true
  continuityRead: boolean
  characterContinuityHints: string[]
  worldContinuityHints: string[]
  rewriteActions: NuwaRewriteAction[]
  diffs: NuwaRewriteDiff[]
  rollbackSnapshot: {
    available: true
    label: string
  }
}

function narrativeState(value: unknown): NarrativeState | null {
  if (!value || typeof value !== "object") return null
  const state = value as Partial<NarrativeState>
  return Array.isArray(state.characters) && Boolean(state.world) && Boolean(state.storyProgress)
    ? (state as NarrativeState)
    : null
}

function narrativeStateFromSession(value: unknown): NarrativeState | null {
  if (!value || typeof value !== "object") return null
  const session = value as {
    chapterState?: { currentChapter?: unknown }
    characterState?: unknown
    worldState?: unknown
    eventState?: { events?: Array<{ title?: unknown }> }
    storyMemory?: { unresolvedForeshadows?: unknown; currentConflict?: unknown }
  }
  if (!Array.isArray(session.characterState) || !session.worldState || !session.chapterState) return null
  return {
    characters: session.characterState as NarrativeState["characters"],
    world: session.worldState as NarrativeState["world"],
    storyProgress: {
      currentChapter: typeof session.chapterState.currentChapter === "number" ? session.chapterState.currentChapter : 1,
      completedEvents: (session.eventState?.events ?? [])
        .map((event) => event.title)
        .filter((title): title is string => typeof title === "string"),
      unresolvedForeshadows: Array.isArray(session.storyMemory?.unresolvedForeshadows)
        ? (session.storyMemory.unresolvedForeshadows as string[])
        : [],
      currentConflict: typeof session.storyMemory?.currentConflict === "string"
        ? session.storyMemory.currentConflict
        : "当前冲突待确认",
    },
  }
}

function characterHints(state: NarrativeState | null) {
  return (state?.characters ?? []).slice(0, 4).map((character) => (
    `${character.name}: ${character.currentState}; ${character.emotionalChanges.slice(-1)[0] ?? "情绪待确认"}`
  ))
}

function worldHints(state: NarrativeState | null) {
  if (!state) return []
  return [
    `章节：${state.storyProgress.currentChapter}`,
    `时间：${state.world.timeProgression.currentTimeLabel}`,
    `冲突：${state.storyProgress.currentConflict}`,
  ]
}

function requestedActions(input: string): NuwaRewriteAction[] {
  const actions = new Set<NuwaRewriteAction>()
  if (/重写|改写|润色|修改/.test(input)) actions.add("rewrite_text")
  if (/扩写|续写|展开|加强/.test(input)) actions.add("expand_paragraph")
  if (/压缩|缩写|精简/.test(input)) actions.add("compress_paragraph")
  if (/风格|语气|文风/.test(input)) actions.add("style_transform")
  if (!actions.size) actions.add("rewrite_text")
  return Array.from(actions)
}

export function runNuwaRewriteEngine(payload: Record<string, unknown>): NuwaRewritePlan {
  const sourceText = typeof payload.sourceText === "string" ? payload.sourceText : typeof payload.input === "string" ? payload.input : ""
  const actions = requestedActions(sourceText)
  const state = narrativeState(payload.narrativeState) ?? narrativeStateFromSession(payload.sessionState)

  return {
    approvalGate: "kernel_required",
    candidateOnly: true,
    continuityRead: Boolean(state),
    characterContinuityHints: characterHints(state),
    worldContinuityHints: worldHints(state),
    rewriteActions: actions,
    diffs: actions.map((action) => buildNuwaRewriteDiff(action, sourceText)),
    rollbackSnapshot: {
      available: true,
      label: "可回滚到 Kernel 调用前候选文本",
    },
  }
}

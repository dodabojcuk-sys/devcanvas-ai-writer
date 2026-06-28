import { createWritingSessionCheckpoint, type WritingSessionCheckpoint } from "@/runtime/session/sessionCheckpointEngine"
import type { NarrativeCharacterState, NarrativeState, NarrativeWorldState } from "@/types/narrativeContinuity"

export const DEFAULT_WRITING_SESSION_ID = "devcanvas-writing-session"

export interface WritingSessionChapterState {
  currentChapter: number
  currentChapterTitle: string
}

export interface WritingSessionEventItem {
  id: string
  title: string
  chapterGroup: string
  timelineOrder: number
}

export interface WritingSessionEventState {
  events: WritingSessionEventItem[]
  latestEventHint: string
}

export interface WritingSessionStoryMemory {
  unresolvedForeshadows: string[]
  currentConflict: string
}

export interface WritingSessionState {
  sessionId: string
  chapterState: WritingSessionChapterState
  characterState: NarrativeCharacterState[]
  worldState: NarrativeWorldState
  eventState: WritingSessionEventState
  storyMemory: WritingSessionStoryMemory
  checkpoints: WritingSessionCheckpoint[]
}

interface SessionEventInput {
  id: string
  title: string
  chapterGroup: string
  timelineOrder: number
}

function uniqueById<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values())
}

function chapterTitle(chapter: number) {
  return `第 ${chapter} 章`
}

function eventItems(events: SessionEventInput[], previous: WritingSessionEventItem[] = []): WritingSessionEventItem[] {
  return uniqueById([
    ...previous,
    ...events.map((event) => ({
      id: event.id,
      title: event.title,
      chapterGroup: event.chapterGroup,
      timelineOrder: event.timelineOrder,
    })),
  ]).slice(-160)
}

export function buildWritingSessionState(args: {
  narrativeState: NarrativeState
  events: SessionEventInput[]
  previousSessionState?: WritingSessionState | null
  sessionId?: string
}): WritingSessionState {
  const previous = args.previousSessionState ?? null
  const events = eventItems(args.events, previous?.eventState.events)
  const chapter = args.narrativeState.storyProgress.currentChapter
  const sessionState: Omit<WritingSessionState, "checkpoints"> = {
    sessionId: previous?.sessionId ?? args.sessionId ?? DEFAULT_WRITING_SESSION_ID,
    chapterState: {
      currentChapter: chapter,
      currentChapterTitle: chapterTitle(chapter),
    },
    characterState: args.narrativeState.characters,
    worldState: args.narrativeState.world,
    eventState: {
      events,
      latestEventHint: events.at(-1)?.title ?? "暂无事件提示",
    },
    storyMemory: {
      unresolvedForeshadows: args.narrativeState.storyProgress.unresolvedForeshadows,
      currentConflict: args.narrativeState.storyProgress.currentConflict,
    },
  }
  const checkpoint = createWritingSessionCheckpoint({
    type: "auto",
    label: `${sessionState.chapterState.currentChapterTitle} 自动保存`,
    characterState: sessionState.characterState,
    eventCount: sessionState.eventState.events.length,
    worldState: sessionState.worldState,
  })

  return {
    ...sessionState,
    checkpoints: [...(previous?.checkpoints ?? []), checkpoint].slice(-80),
  }
}

export function createManualWritingCheckpoint(sessionState: WritingSessionState, label = "作者确认当前方向"): WritingSessionState {
  const checkpoint = createWritingSessionCheckpoint({
    type: "manual",
    label,
    characterState: sessionState.characterState,
    eventCount: sessionState.eventState.events.length,
    worldState: sessionState.worldState,
  })

  return {
    ...sessionState,
    checkpoints: [...sessionState.checkpoints, checkpoint].slice(-80),
  }
}

export function summarizeWritingSession(sessionState: WritingSessionState) {
  return `${sessionState.chapterState.currentChapterTitle} / ${sessionState.characterState.length} 个角色 / ${sessionState.eventState.events.length} 个事件`
}

export { loadSavedWritingSession, saveWritingSession } from "@/runtime/session/sessionStateStore"

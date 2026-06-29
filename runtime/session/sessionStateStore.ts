import type { WritingSessionState } from "@/runtime/session/writingSessionManager"

export const WRITING_SESSION_STORAGE_KEY = "devcanvas:writing-session:v1"

export interface WritingSessionStateStore {
  save(sessionState: WritingSessionState): void
  load(sessionId?: string): WritingSessionState | null
  clear(sessionId?: string): void
}

function isWritingSessionState(value: unknown): value is WritingSessionState {
  if (!value || typeof value !== "object") return false
  const state = value as Partial<WritingSessionState>
  return typeof state.sessionId === "string" && Boolean(state.chapterState) && Array.isArray(state.characterState)
}

export function createMemorySessionStateStore(initial: WritingSessionState[] = []): WritingSessionStateStore {
  const sessions = new Map(initial.map((state) => [state.sessionId, state]))
  return {
    save(sessionState) {
      sessions.set(sessionState.sessionId, sessionState)
    },
    load(sessionId) {
      if (sessionId) return sessions.get(sessionId) ?? null
      return Array.from(sessions.values()).at(-1) ?? null
    },
    clear(sessionId) {
      if (sessionId) {
        sessions.delete(sessionId)
        return
      }
      sessions.clear()
    },
  }
}

function browserStorage(): Storage | null {
  if (typeof globalThis.localStorage === "undefined") return null
  const storage = globalThis.localStorage
  if (
    typeof storage.getItem !== "function" ||
    typeof storage.setItem !== "function" ||
    typeof storage.removeItem !== "function"
  ) {
    return null
  }
  return storage
}

export function loadSavedWritingSession(): WritingSessionState | null {
  const storage = browserStorage()
  if (!storage) return null
  const raw = storage.getItem(WRITING_SESSION_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return isWritingSessionState(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveWritingSession(sessionState: WritingSessionState): void {
  const storage = browserStorage()
  if (!storage) return
  storage.setItem(WRITING_SESSION_STORAGE_KEY, JSON.stringify(sessionState))
}

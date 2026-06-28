import { trackCharacterState } from "./characterStateTracker"
import { progressStoryState } from "./storyProgressionEngine"
import { trackWorldState } from "./worldStateTracker"
import type { NarrativeState } from "../../types/narrativeContinuity"

export function createEmptyNarrativeState(): NarrativeState {
  return {
    characters: [],
    world: {
      definedSettings: [],
      occurredChanges: [],
      timeProgression: {
        currentChapter: 1,
        currentTimeLabel: "第 1 章 / 时间待确认",
      },
      spatialChanges: [],
    },
    storyProgress: {
      currentChapter: 1,
      completedEvents: [],
      unresolvedForeshadows: [],
      currentConflict: "当前冲突待确认",
    },
  }
}

export function isNarrativeState(value: unknown): value is NarrativeState {
  if (!value || typeof value !== "object") return false
  const state = value as Partial<NarrativeState>
  return Array.isArray(state.characters) && Boolean(state.world) && Boolean(state.storyProgress)
}

export function updateNarrativeState(input: string, previous?: NarrativeState | null): NarrativeState {
  const base = isNarrativeState(previous) ? previous : createEmptyNarrativeState()
  const world = trackWorldState(input, base.world)
  const characters = trackCharacterState(input, base.characters)
  const storyProgress = progressStoryState(input, world, base.storyProgress)

  return {
    characters,
    world,
    storyProgress,
  }
}

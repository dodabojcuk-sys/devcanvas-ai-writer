import type { NarrativeCharacterState, NarrativeWorldState } from "../../types/narrativeContinuity"

export type WritingSessionCheckpointType = "auto" | "manual"

export interface WritingSessionCheckpointSnapshot {
  characterCount: number
  eventCount: number
  worldSettingCount: number
}

export interface WritingSessionCheckpoint {
  id: string
  type: WritingSessionCheckpointType
  label: string
  createdAt: string
  snapshot: WritingSessionCheckpointSnapshot
}

export function createWritingSessionCheckpoint(args: {
  type: WritingSessionCheckpointType
  label: string
  characterState: NarrativeCharacterState[]
  eventCount: number
  worldState: NarrativeWorldState
}): WritingSessionCheckpoint {
  const createdAt = new Date(0).toISOString()
  return {
    id: `session-checkpoint:${args.type}:${args.eventCount}:${args.characterState.length}:${args.worldState.definedSettings.length}`,
    type: args.type,
    label: args.label,
    createdAt,
    snapshot: {
      characterCount: args.characterState.length,
      eventCount: args.eventCount,
      worldSettingCount: args.worldState.definedSettings.length,
    },
  }
}

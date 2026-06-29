export interface NarrativeCharacterState {
  id: string
  name: string
  currentState: string
  occurredEvents: string[]
  emotionalChanges: string[]
  relationshipChanges: string[]
}

export interface NarrativeWorldState {
  definedSettings: string[]
  occurredChanges: string[]
  timeProgression: {
    currentChapter: number
    currentTimeLabel: string
  }
  spatialChanges: string[]
}

export interface NarrativeStoryProgress {
  currentChapter: number
  completedEvents: string[]
  unresolvedForeshadows: string[]
  currentConflict: string
}

export interface NarrativeState {
  characters: NarrativeCharacterState[]
  world: NarrativeWorldState
  storyProgress: NarrativeStoryProgress
}

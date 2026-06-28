import { buildEvidenceGraph, type EvidenceMemoryIndexKind, type EvidenceMemoryReference } from "./evidenceGraph"
import { isNarrativeState, updateNarrativeState } from "../continuity/narrativeStateManager"

export interface StoryMemoryIndex {
  readOnly: true
  narrativeStateUpdated: true
  memoryIndexes: EvidenceMemoryIndexKind[]
  references: EvidenceMemoryReference[]
  linkingMode: "context_injection"
  narrativeState: ReturnType<typeof updateNarrativeState>
}

export function buildStoryMemoryIndex(payload: Record<string, unknown>): StoryMemoryIndex {
  const references = buildEvidenceGraph(payload)
  const input = typeof payload.input === "string" ? payload.input : ""
  const previousNarrativeState = isNarrativeState(payload.previousNarrativeState) ? payload.previousNarrativeState : undefined
  const narrativeState = updateNarrativeState(input, previousNarrativeState)
  return {
    readOnly: true,
    narrativeStateUpdated: true,
    memoryIndexes: references.map((reference) => reference.kind),
    references,
    linkingMode: "context_injection",
    narrativeState,
  }
}

export type TianyiInputKind =
  | "idea"
  | "manuscript"
  | "worldbuilding"
  | "character"
  | "plot_question"
  | "revision_note"
  | "unknown"

export type TianyiInputClassification = {
  kind: TianyiInputKind
  confidence: "low" | "medium" | "high"
  reasons: string[]
  textLength: number
}

export type StoryAtomType =
  | "event"
  | "fact"
  | "relationship"
  | "conflict"
  | "foreshadow"
  | "clue"
  | "world_rule"
  | "character_state"
  | "item_state"
  | "decision"
  | "question"

export type StorylineType =
  | "main"
  | "branch"
  | "hidden"
  | "character"
  | "relationship"
  | "item"
  | "foreshadow"
  | "world"
  | "theme"

export type StoryNodeType =
  | "setup"
  | "turning_point"
  | "reveal"
  | "conflict"
  | "choice"
  | "payoff"
  | "aftermath"

export type TianyiCandidateStatus =
  | "candidate"
  | "needs_author_confirmation"
  | "confirmed"
  | "rejected"

export type TianyiConfidence = "low" | "medium" | "high"

export interface StoryAtomCandidate {
  id: string
  type: StoryAtomType
  summary: string
  sourceEvidenceIds: string[]
  confidence: TianyiConfidence
  status: TianyiCandidateStatus
}

export interface StoryNodeCandidate {
  id: string
  order: number
  type: StoryNodeType
  title: string
  summary: string
  evidenceIds: string[]
  storyAtomIds: string[]
  lineId: string | null
  status: TianyiCandidateStatus
}

export interface StorylineCandidate {
  id: string
  type: StorylineType
  title: string
  summary: string
  nodes: StoryNodeCandidate[]
  relatedCharacters: string[]
  relatedItems: string[]
  relatedLocations: string[]
  sourceEvidenceIds: string[]
  openQuestions: string[]
  risks: string[]
  status: TianyiCandidateStatus
}

export type CompressedMemoryLayerLevel = "L0" | "L1" | "L2" | "L3" | "L4" | "L5"

export interface CompressedMemoryLayer {
  level: CompressedMemoryLayerLevel
  title: string
  summary: string
  sourceEvidenceIds: string[]
  storylineIds: string[]
  status: "derived_preview"
}

export type ProphecyCandidateStatus = "preview" | "needs_evidence" | "needs_author_confirmation"

export interface ProphecyCandidate {
  id: string
  title: string
  prediction: string
  basedOnStorylineIds: string[]
  basedOnNodeIds: string[]
  evidenceIds: string[]
  risk: "low" | "medium" | "high"
  confidence: TianyiConfidence
  nextQuestions: string[]
  status: ProphecyCandidateStatus
}

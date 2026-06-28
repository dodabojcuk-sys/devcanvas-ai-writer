export type NarrativeGraphSource = "kernel" | "session" | "explanation";

export type NarrativeGraphDataState = "partial" | "unknown" | "inferred";

export type NarrativeGraphSnapshotStatus = "empty" | "partial" | "ready";

export type NarrativeGraphDirection = "directed" | "undirected" | "unknown";

export type TimelineOrder = "before" | "after" | "same_time" | "unknown";

export type EventNodeType = "event_line_candidate" | "session_marker" | "explanation_hint" | "unknown";

export type NarrativeGraphSourceRef = {
  source: NarrativeGraphSource;
  confidence: number;
  timestamp: string;
  responseId?: string;
  eventType?: string;
  explanationIntent?: string;
  sessionChapter?: string;
  sessionContinuity?: string;
};

export type NarrativeGraphEvidence = {
  sourceRef: NarrativeGraphSourceRef;
  note?: string;
};

export type NarrativeGraphEntityBase = {
  id: string;
  label: string;
  state: NarrativeGraphDataState;
  source: NarrativeGraphSource;
  confidence: number;
  timestamp: string;
  evidence: NarrativeGraphEvidence[];
};

export type CharacterNode = NarrativeGraphEntityBase & {
  kind: "character";
  aliases?: string[];
  role?: string;
  sceneRelevance?: number;
};

export type RelationEdge = NarrativeGraphEntityBase & {
  kind: "relation";
  fromCharacterId: string;
  toCharacterId: string;
  direction: NarrativeGraphDirection;
};

export type EventNode = NarrativeGraphEntityBase & {
  kind: "event";
  eventType: EventNodeType;
  chapter?: string;
  continuity?: string;
};

export type TimelineEdge = NarrativeGraphEntityBase & {
  kind: "timeline";
  fromEventId: string;
  toEventId: string;
  order: TimelineOrder;
};

export type NarrativeGraphSnapshot = {
  id: string;
  status: NarrativeGraphSnapshotStatus;
  generatedAt: string;
  sourceOfTruth: "processDevCanvas";
  sourceResponse: {
    responseId?: string;
    inputHash?: string;
    hasEvents: boolean;
    hasSessionState: boolean;
    hasExplanation: boolean;
  };
  characters: CharacterNode[];
  relations: RelationEdge[];
  events: EventNode[];
  timeline: TimelineEdge[];
  constraints: {
    readOnly: true;
    writebackAllowed: false;
    affectsWritingFlow: false;
  };
};

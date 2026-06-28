export type EvidenceMeta = {
  id: string;
  source: string;
  chunkId: string;
  paragraphIndex: number;
  charStart: number;
  charEnd: number;
  quote: string;
  confidence: number;
};

export type WorldModelDraftNodeBase = {
  id: string;
  label: string;
  detail: string;
  source: string;
  chunkId: string;
  paragraphIndex: number;
  charStart: number;
  charEnd: number;
  quote: string;
  confidence: number;
  evidenceId: string;
};

export type CharacterNode = WorldModelDraftNodeBase & {
  kind: "character";
};

export type RelationEdge = WorldModelDraftNodeBase & {
  kind: "relationship";
  from: string;
  to: string;
};

export type LocationNode = WorldModelDraftNodeBase & {
  kind: "location";
};

export type RuleNode = WorldModelDraftNodeBase & {
  kind: "rule";
};

export type TimelineEvent = WorldModelDraftNodeBase & {
  kind: "timeline_event";
  order: number;
};

export type WorldModelDraftItem =
  | CharacterNode
  | RelationEdge
  | LocationNode
  | RuleNode
  | TimelineEvent;

export type WorldModelDraft = {
  summary: string;
  characters: CharacterNode[];
  relationships: RelationEdge[];
  locations: LocationNode[];
  rules: RuleNode[];
  timeline: TimelineEvent[];
  evidence: EvidenceMeta[];
};

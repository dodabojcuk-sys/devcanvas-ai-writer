import type { NarrativeGraphSnapshot } from "./narrativeGraph";

export type {
  CharacterNode,
  EventNode,
  EventNodeType,
  NarrativeGraphDataState,
  NarrativeGraphDirection,
  NarrativeGraphEntityBase,
  NarrativeGraphEvidence,
  NarrativeGraphSnapshot,
  NarrativeGraphSnapshotStatus,
  NarrativeGraphSource,
  NarrativeGraphSourceRef,
  RelationEdge,
  TimelineEdge,
  TimelineOrder,
} from "./narrativeGraph";

export type NarrativeGraph = {
  snapshot: NarrativeGraphSnapshot;
};

export type NarrativeSnapshot = NarrativeGraphSnapshot;

import type {
  EventNode,
  EventNodeType,
  NarrativeGraphEvidence,
  NarrativeGraphSnapshot,
  NarrativeGraphSource,
  NarrativeGraphSourceRef,
  TimelineEdge,
} from "../../types/narrativeGraph";

type DevCanvasEventCandidate = {
  type?: string;
  title?: string;
  confidence?: number;
};

type DevCanvasSessionState = {
  chapter?: string;
  continuity?: string;
};

type DevCanvasExplanation = {
  intent?: string;
  reasoning?: string[];
};

type DevCanvasExecutionGraph = {
  entry?: string;
  contextProvided?: boolean;
};

export type NarrativeGraphSnapshotAssemblerInput = {
  responseId?: string;
  inputHash?: string;
  timestamp?: string;
  events?: DevCanvasEventCandidate[];
  sessionState?: DevCanvasSessionState;
  explanation?: DevCanvasExplanation;
  executionGraph?: DevCanvasExecutionGraph;
};

function clampConfidence(confidence: unknown, fallback: number) {
  if (typeof confidence !== "number" || Number.isNaN(confidence)) {
    return fallback;
  }

  return Math.min(1, Math.max(0, confidence));
}

function slug(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "unknown";
}

function makeSourceRef({
  source,
  confidence,
  timestamp,
  input,
  eventType,
}: {
  source: NarrativeGraphSource;
  confidence: number;
  timestamp: string;
  input: NarrativeGraphSnapshotAssemblerInput;
  eventType?: string;
}): NarrativeGraphSourceRef {
  return {
    source,
    confidence,
    timestamp,
    responseId: input.responseId,
    eventType,
    explanationIntent: input.explanation?.intent,
    sessionChapter: input.sessionState?.chapter,
    sessionContinuity: input.sessionState?.continuity,
  };
}

function makeEvidence(sourceRef: NarrativeGraphSourceRef, note?: string): NarrativeGraphEvidence[] {
  return [{ sourceRef, ...(note ? { note } : {}) }];
}

function toEventType(type: string | undefined): EventNodeType {
  return type === "event_line_candidate" ? "event_line_candidate" : "unknown";
}

function buildEventNodes(input: NarrativeGraphSnapshotAssemblerInput, timestamp: string): EventNode[] {
  const eventNodes: EventNode[] =
    input.events?.map((event, index) => {
      const label = event.title || event.type || "Unknown event";
      const confidence = clampConfidence(event.confidence, 0.5);
      const eventType = toEventType(event.type);
      const sourceRef = makeSourceRef({
        source: "kernel",
        confidence,
        timestamp,
        input,
        eventType,
      });

      return {
        id: `event-${index + 1}-${slug(label)}`,
        kind: "event" as const,
        label,
        state: "inferred" as const,
        source: "kernel" as const,
        confidence,
        timestamp,
        evidence: makeEvidence(sourceRef, "Derived from processDevCanvas event output."),
        eventType,
        chapter: input.sessionState?.chapter,
        continuity: input.sessionState?.continuity,
      };
    }) ?? [];

  if (input.sessionState?.chapter || input.sessionState?.continuity) {
    const confidence = 1;
    const label = [input.sessionState.chapter, input.sessionState.continuity].filter(Boolean).join(" / ");
    const sourceRef = makeSourceRef({
      source: "session",
      confidence,
      timestamp,
      input,
      eventType: "session_marker",
    });

    eventNodes.push({
      id: `session-${slug(label || "session-marker")}`,
      kind: "event",
      label: label || "Session marker",
      state: "partial",
      source: "session",
      confidence,
      timestamp,
      evidence: makeEvidence(sourceRef, "Derived from processDevCanvas sessionState."),
      eventType: "session_marker",
      chapter: input.sessionState.chapter,
      continuity: input.sessionState.continuity,
    });
  }

  if (input.explanation?.intent || input.explanation?.reasoning?.length) {
    const confidence = 0.6;
    const label = input.explanation.intent || "Explanation hint";
    const sourceRef = makeSourceRef({
      source: "explanation",
      confidence,
      timestamp,
      input,
      eventType: "explanation_hint",
    });

    eventNodes.push({
      id: `explanation-${slug(label)}`,
      kind: "event",
      label,
      state: "inferred",
      source: "explanation",
      confidence,
      timestamp,
      evidence: makeEvidence(sourceRef, "Derived from processDevCanvas explanation."),
      eventType: "explanation_hint",
      chapter: input.sessionState?.chapter,
      continuity: input.sessionState?.continuity,
    });
  }

  return eventNodes;
}

function buildTimelineEdges(events: EventNode[], input: NarrativeGraphSnapshotAssemblerInput, timestamp: string): TimelineEdge[] {
  const kernelEvents = events.filter((event) => event.source === "kernel");

  return kernelEvents.slice(0, -1).map((event, index) => {
    const nextEvent = kernelEvents[index + 1];
    const confidence = Math.min(event.confidence, nextEvent.confidence);
    const sourceRef = makeSourceRef({
      source: "kernel",
      confidence,
      timestamp,
      input,
      eventType: "event_line_candidate",
    });

    return {
      id: `timeline-${event.id}-to-${nextEvent.id}`,
      kind: "timeline",
      label: `${event.label} before ${nextEvent.label}`,
      state: "inferred",
      source: "kernel",
      confidence,
      timestamp,
      evidence: makeEvidence(sourceRef, "Derived from processDevCanvas event order."),
      fromEventId: event.id,
      toEventId: nextEvent.id,
      order: "before",
    };
  });
}

function buildConfidenceMap(events: EventNode[], timeline: TimelineEdge[]) {
  return [...events, ...timeline].reduce<Record<string, number>>((confidenceMap, item) => {
    confidenceMap[item.id] = item.confidence;
    return confidenceMap;
  }, {});
}

export function assembleNarrativeGraphSnapshot(input: NarrativeGraphSnapshotAssemblerInput): NarrativeGraphSnapshot {
  const timestamp = input.timestamp || new Date().toISOString();
  const events = buildEventNodes(input, timestamp);
  const timeline = buildTimelineEdges(events, input, timestamp);
  const hasEvents = Boolean(input.events?.length);
  const hasSessionState = Boolean(input.sessionState?.chapter || input.sessionState?.continuity);
  const hasExplanation = Boolean(input.explanation?.intent || input.explanation?.reasoning?.length);
  const hasAnySource = hasEvents || hasSessionState || hasExplanation || Boolean(input.executionGraph);

  return {
    id: `snapshot-${input.responseId || slug(timestamp)}`,
    status: hasAnySource ? "partial" : "empty",
    generatedAt: timestamp,
    sourceOfTruth: "processDevCanvas",
    sourceResponse: {
      responseId: input.responseId,
      inputHash: input.inputHash,
      hasEvents,
      hasSessionState,
      hasExplanation,
    },
    characters: [],
    relations: [],
    events,
    timeline,
    confidenceMap: buildConfidenceMap(events, timeline),
    constraints: {
      readOnly: true,
      writebackAllowed: false,
      affectsWritingFlow: false,
    },
  };
}

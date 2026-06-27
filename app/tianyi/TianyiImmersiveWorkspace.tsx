"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";

type FlowState = "idle" | "drafting" | "ready";

type KernelEventCandidate = {
  type: "event_line_candidate";
  title: string;
  confidence: number;
};

type KernelSessionState = {
  chapter: string;
  continuity: string;
};

type KernelStructuredResponse = {
  text: string;
  suggestions: string[];
  events: KernelEventCandidate[];
  sessionState: KernelSessionState;
};

type KernelProcessor = (input: string) => KernelStructuredResponse | Promise<KernelStructuredResponse>;

type KernelBridge = typeof globalThis & {
  processDevCanvasProductInput?: unknown;
};

const starterSuggestions = [
  "Clarify the protagonist's immediate goal.",
  "Turn the scene into sensory prose.",
  "Add conflict without changing the plot.",
];

const defaultSessionState: KernelSessionState = {
  chapter: "Chapter preview: unassigned",
  continuity: "Continuity preview: waiting for kernel output",
};

const narrativeShellStyle: CSSProperties = {
  gridTemplateColumns: "1fr",
};

const narrativeFlowStyle: CSSProperties = {
  width: "min(100%, 1040px)",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 18,
};

const inlineLayerStackStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 12,
};

const inlineLayerStyle: CSSProperties = {
  border: "1px solid #d7d0c1",
  borderRadius: 8,
  background: "#fffdf8",
  padding: 16,
};

const inlinePreviewGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 10,
};

const inlinePreviewItemStyle: CSSProperties = {
  border: "1px solid #cbd8cd",
  borderRadius: 8,
  background: "#eef3ec",
  color: "#26342c",
  padding: 12,
  lineHeight: 1.5,
};

function getKernelProcessor(): KernelProcessor | null {
  const candidate = (globalThis as KernelBridge).processDevCanvasProductInput;
  return typeof candidate === "function" ? (candidate as KernelProcessor) : null;
}

function normalizeKernelResponse(response: KernelStructuredResponse): KernelStructuredResponse {
  return {
    text: response.text || "Kernel returned no text output.",
    suggestions: Array.isArray(response.suggestions) ? response.suggestions : [],
    events: Array.isArray(response.events) ? response.events : [],
    sessionState: {
      chapter: response.sessionState?.chapter || "Chapter preview: kernel output",
      continuity: response.sessionState?.continuity || "Continuity preview: kernel output received",
    },
  };
}

function buildNuwaPreviews(kernelResponse: KernelStructuredResponse | null) {
  const sourceSuggestions = kernelResponse?.suggestions.length ? kernelResponse.suggestions : starterSuggestions;
  return sourceSuggestions.slice(0, 3).map((suggestion, index) => ({
    label: index === 0 ? "Rewrite direction" : index === 1 ? "Style variation" : "Inline polish",
    text: suggestion,
  }));
}

function buildEvidenceInsights(kernelResponse: KernelStructuredResponse | null, sessionState: KernelSessionState) {
  const eventCount = kernelResponse?.events.length ?? 0;

  return [
    {
      label: "Setting continuity",
      text: sessionState.continuity,
    },
    {
      label: "Fact reference",
      text: eventCount > 0 ? `${eventCount} event candidate(s) available for later evidence review.` : "No event evidence surfaced yet.",
    },
    {
      label: "Conflict check",
      text: kernelResponse ? "No blocking setting conflict reported by the current UI-bound output." : "Waiting for kernel output before checking story consistency.",
    },
  ];
}

function SessionIndicator({
  flowState,
  sessionState,
}: {
  flowState: FlowState;
  sessionState: KernelSessionState;
}) {
  const label = {
    idle: "Local session idle",
    drafting: "Kernel output streaming",
    ready: "Kernel output ready",
  }[flowState];

  return (
    <div className="dcw-session-indicator" aria-live="polite">
      <span className={`dcw-session-dot dcw-session-dot-${flowState}`} />
      {label} - {sessionState.chapter} - {sessionState.continuity}
    </div>
  );
}

function WritingInput({
  inputText,
  isGenerating,
  onInputChange,
  onGenerate,
}: {
  inputText: string;
  isGenerating: boolean;
  onInputChange: (value: string) => void;
  onGenerate: () => void;
}) {
  return (
    <form
      className="dcw-writing-input"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onGenerate();
      }}
    >
      <label className="dcw-input-label" htmlFor="tianyi-writing-input">
        AI Tianyi writing input
      </label>
      <textarea
        id="tianyi-writing-input"
        className="dcw-input-field"
        value={inputText}
        onChange={(event) => onInputChange(event.target.value)}
        placeholder="Write the next scene beat, paragraph idea, or revision request."
        rows={6}
      />
      <div className="dcw-input-actions">
        <span className="dcw-input-hint">UI binds to processDevCanvasProductInput output only.</span>
        <button className="dcw-generate-button" type="submit" disabled={isGenerating}>
          {isGenerating ? "Streaming..." : "Generate kernel draft"}
        </button>
      </div>
    </form>
  );
}

function WritingCanvas({ streamedText }: { streamedText: string }) {
  return (
    <section className="dcw-writing-canvas" aria-label="Writing canvas">
      {streamedText ? (
        <pre className="dcw-output-text">{streamedText}</pre>
      ) : (
        <div className="dcw-empty-canvas">
          <p>Writing area is ready.</p>
          <span>Enter a scene idea to render kernel output when the interface is available.</span>
        </div>
      )}
    </section>
  );
}

function EventLinePreviewLayer({ events }: { events: KernelEventCandidate[] }) {
  return (
    <section style={inlineLayerStyle} aria-label="EventLine preview layer">
      <p className="dcw-panel-eyebrow">EventLine Preview Layer</p>
      <div style={inlinePreviewGridStyle}>
        {events.length > 0 ? (
          events.map((event) => (
            <div style={inlinePreviewItemStyle} key={event.title} role="note">
              {event.title} - confidence {Math.round(event.confidence * 100)}%
            </div>
          ))
        ) : (
          <div style={inlinePreviewItemStyle}>Event suggestions will surface here without becoming a navigation entry.</div>
        )}
      </div>
    </section>
  );
}

function NuwaSuggestionLayer({ previews }: { previews: { label: string; text: string }[] }) {
  return (
    <section style={inlineLayerStyle} aria-label="Nuwa suggestion layer">
      <p className="dcw-panel-eyebrow">Nuwa Suggestion Layer</p>
      <div style={inlinePreviewGridStyle}>
        {previews.map((preview) => (
          <div style={inlinePreviewItemStyle} key={`${preview.label}-${preview.text}`} role="note">
            <strong>{preview.label}</strong>
            <br />
            {preview.text}
          </div>
        ))}
      </div>
    </section>
  );
}

function EvidenceInsightLayer({ insights }: { insights: { label: string; text: string }[] }) {
  return (
    <section style={inlineLayerStyle} aria-label="Evidence insight layer">
      <p className="dcw-panel-eyebrow">Evidence Insight Layer</p>
      <div style={inlinePreviewGridStyle}>
        {insights.map((insight) => (
          <div style={inlinePreviewItemStyle} key={insight.label} role="note">
            <strong>{insight.label}</strong>
            <br />
            {insight.text}
          </div>
        ))}
      </div>
    </section>
  );
}

function AITianyiCore({
  inputText,
  streamedText,
  flowState,
  sessionState,
  onInputChange,
  onGenerate,
}: {
  inputText: string;
  streamedText: string;
  flowState: FlowState;
  sessionState: KernelSessionState;
  onInputChange: (value: string) => void;
  onGenerate: () => void;
}) {
  return (
    <section style={narrativeFlowStyle} aria-label="AI Tianyi Core writing area">
      <SessionIndicator flowState={flowState} sessionState={sessionState} />
      <WritingInput
        inputText={inputText}
        isGenerating={flowState === "drafting"}
        onInputChange={onInputChange}
        onGenerate={onGenerate}
      />
      <WritingCanvas streamedText={streamedText} />
    </section>
  );
}

export default function TianyiImmersiveWorkspace() {
  const [inputText, setInputText] = useState("");
  const [streamedText, setStreamedText] = useState("");
  const [kernelResponse, setKernelResponse] = useState<KernelStructuredResponse | null>(null);
  const [flowState, setFlowState] = useState<FlowState>("idle");
  const [sessionState, setSessionState] = useState<KernelSessionState>(defaultSessionState);
  const streamTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (streamTimer.current) {
        clearTimeout(streamTimer.current);
      }
    };
  }, []);

  const streamResponse = (response: KernelStructuredResponse) => {
    const segments = response.text.split("\n\n");
    let nextSegmentIndex = 0;

    const pushNextSegment = () => {
      const segment = segments[nextSegmentIndex];

      if (!segment) {
        setKernelResponse(response);
        setSessionState(response.sessionState);
        setFlowState("ready");
        return;
      }

      setStreamedText((current) => (current ? `${current}\n\n${segment}` : segment));
      nextSegmentIndex += 1;
      streamTimer.current = setTimeout(pushNextSegment, 360);
    };

    pushNextSegment();
  };

  const handleGenerate = async () => {
    const trimmedInput = inputText.trim();
    const kernelProcessor = getKernelProcessor();

    if (!trimmedInput || flowState === "drafting") {
      return;
    }

    if (streamTimer.current) {
      clearTimeout(streamTimer.current);
    }

    setKernelResponse(null);
    setSessionState({
      chapter: "Chapter preview: reading input",
      continuity: "Continuity preview: waiting for kernel output",
    });
    setStreamedText("");

    if (!kernelProcessor) {
      setStreamedText("processDevCanvasProductInput is not available in this UI runtime.");
      setSessionState({
        chapter: "Chapter preview: unavailable",
        continuity: "Continuity preview: kernel interface missing",
      });
      setFlowState("ready");
      return;
    }

    setFlowState("drafting");

    try {
      const response = normalizeKernelResponse(await kernelProcessor(trimmedInput));
      streamResponse(response);
    } catch (error) {
      setStreamedText(error instanceof Error ? error.message : "Kernel output binding failed.");
      setSessionState({
        chapter: "Chapter preview: kernel error",
        continuity: "Continuity preview: output not rendered",
      });
      setFlowState("ready");
    }
  };

  return (
    <main className="dcw-tianyi-workspace" style={narrativeShellStyle}>
      <div style={narrativeFlowStyle}>
        <AITianyiCore
          inputText={inputText}
          streamedText={streamedText}
          flowState={flowState}
          sessionState={sessionState}
          onInputChange={setInputText}
          onGenerate={handleGenerate}
        />
        <div style={inlineLayerStackStyle} aria-label="Inline narrative intelligence previews">
          <EventLinePreviewLayer events={kernelResponse?.events ?? []} />
          <NuwaSuggestionLayer previews={buildNuwaPreviews(kernelResponse)} />
          <EvidenceInsightLayer insights={buildEvidenceInsights(kernelResponse, sessionState)} />
        </div>
      </div>
    </main>
  );
}

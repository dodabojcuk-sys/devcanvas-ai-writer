"use client";

import type { FormEvent } from "react";
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

function AISuggestionPanel({
  kernelResponse,
  selectedSuggestion,
  onUseSuggestion,
}: {
  kernelResponse: KernelStructuredResponse | null;
  selectedSuggestion: string;
  onUseSuggestion: (value: string) => void;
}) {
  const suggestions = kernelResponse?.suggestions.length ? kernelResponse.suggestions : starterSuggestions;
  const events = kernelResponse?.events ?? [];

  return (
    <aside className="dcw-suggestion-panel" aria-label="AI suggestion panel">
      <div>
        <p className="dcw-panel-eyebrow">Kernel output</p>
        <h2>Structured guidance</h2>
      </div>
      <div className="dcw-suggestion-list">
        {suggestions.map((suggestion) => (
          <button
            className="dcw-suggestion-chip"
            key={suggestion}
            type="button"
            onClick={() => onUseSuggestion(suggestion)}
          >
            {suggestion}
            {selectedSuggestion === suggestion ? " - selected locally" : ""}
          </button>
        ))}
      </div>
      {events.length > 0 ? (
        <div className="dcw-suggestion-list" aria-label="Event line candidates">
          <p className="dcw-panel-eyebrow">Event line candidates</p>
          {events.map((event) => (
            <div className="dcw-suggestion-chip" key={event.title} role="note">
              {event.title} - confidence {Math.round(event.confidence * 100)}%
            </div>
          ))}
        </div>
      ) : null}
    </aside>
  );
}

export default function TianyiImmersiveWorkspace() {
  const [inputText, setInputText] = useState("");
  const [streamedText, setStreamedText] = useState("");
  const [kernelResponse, setKernelResponse] = useState<KernelStructuredResponse | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState("");
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
    setSelectedSuggestion("");
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

  const handleUseSuggestion = (suggestion: string) => {
    setSelectedSuggestion(suggestion);
  };

  return (
    <main className="dcw-tianyi-workspace">
      <section className="dcw-workspace-primary" aria-label="AI Tianyi writing workspace">
        <SessionIndicator flowState={flowState} sessionState={sessionState} />
        <WritingInput
          inputText={inputText}
          isGenerating={flowState === "drafting"}
          onInputChange={setInputText}
          onGenerate={handleGenerate}
        />
        <WritingCanvas streamedText={streamedText} />
      </section>
      <AISuggestionPanel
        kernelResponse={kernelResponse}
        selectedSuggestion={selectedSuggestion}
        onUseSuggestion={handleUseSuggestion}
      />
    </main>
  );
}

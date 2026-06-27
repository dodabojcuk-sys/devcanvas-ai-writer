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

const starterSuggestions = [
  "Clarify the protagonist's immediate goal.",
  "Turn the scene into sensory prose.",
  "Add conflict without changing the plot.",
];

const defaultSessionState: KernelSessionState = {
  chapter: "Chapter preview: unassigned",
  continuity: "Continuity preview: local only",
};

function createKernelStructuredResponse(input: string): KernelStructuredResponse {
  const compactInput = input.length > 120 ? `${input.slice(0, 117)}...` : input;

  return {
    text: [
      "AI Tianyi kernel-shaped preview",
      "The input has been treated as a scene transition request. The next paragraph should stay close to the character's active choice, then let the obstacle surface through action instead of explanation.",
      `Draft anchor: ${compactInput}`,
      "Suggested continuation: The character notices the cost of the decision before anyone else names it. That pause gives the scene a clean hinge into the next beat.",
    ].join("\n\n"),
    suggestions: [
      "Sharpen the character's next concrete action.",
      "Carry one sensory detail into the following paragraph.",
      "Mark the unresolved tension before closing the beat.",
    ],
    events: [
      {
        type: "event_line_candidate",
        title: "Scene intent shifts from planning to visible consequence",
        confidence: 0.82,
      },
      {
        type: "event_line_candidate",
        title: "Continuity hook created around the character's delayed admission",
        confidence: 0.74,
      },
    ],
    sessionState: {
      chapter: "Chapter preview: current drafting node",
      continuity: "Continuity preview: cause-effect chain intact",
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
    drafting: "Kernel-shaped preview streaming",
    ready: "Kernel-shaped preview ready",
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
        <span className="dcw-input-hint">UI-level kernel structure simulation only.</span>
        <button className="dcw-generate-button" type="submit" disabled={isGenerating}>
          {isGenerating ? "Streaming..." : "Generate structured preview"}
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
          <span>Enter a scene idea to render a local kernel-shaped response.</span>
        </div>
      )}
    </section>
  );
}

function AISuggestionPanel({
  kernelResponse,
  onUseSuggestion,
}: {
  kernelResponse: KernelStructuredResponse | null;
  onUseSuggestion: (value: string) => void;
}) {
  const suggestions = kernelResponse?.suggestions ?? starterSuggestions;
  const events = kernelResponse?.events ?? [];

  return (
    <aside className="dcw-suggestion-panel" aria-label="AI suggestion panel">
      <div>
        <p className="dcw-panel-eyebrow">Structured preview</p>
        <h2>Kernel-shaped guidance</h2>
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

  const handleGenerate = () => {
    const trimmedInput = inputText.trim();

    if (!trimmedInput || flowState === "drafting") {
      return;
    }

    if (streamTimer.current) {
      clearTimeout(streamTimer.current);
    }

    const response = createKernelStructuredResponse(trimmedInput);
    setFlowState("drafting");
    setKernelResponse(null);
    setSessionState({
      chapter: "Chapter preview: reading input",
      continuity: "Continuity preview: evaluating transition",
    });
    setStreamedText("");
    streamResponse(response);
  };

  const handleUseSuggestion = (suggestion: string) => {
    setInputText((current) => (current ? `${current}\n\n${suggestion}` : suggestion));
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
      <AISuggestionPanel kernelResponse={kernelResponse} onUseSuggestion={handleUseSuggestion} />
    </main>
  );
}

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
  "Let the next sentence reveal what the character wants before explaining why.",
  "Keep one sensory detail moving through the paragraph.",
  "Let the tension surface as an action, not a label.",
];

const defaultSessionState: KernelSessionState = {
  chapter: "unplaced scene",
  continuity: "waiting for the next thread",
};

const narrativeShellStyle: CSSProperties = {
  gridTemplateColumns: "1fr",
};

const narrativeFlowStyle: CSSProperties = {
  width: "min(100%, 980px)",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 18,
};

const ambienceStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 10,
};

const quietHintStyle: CSSProperties = {
  borderLeft: "2px solid #cbd8cd",
  background: "rgb(255 253 248 / 72%)",
  color: "#445148",
  padding: "10px 0 10px 14px",
  lineHeight: 1.55,
  transition: "opacity 240ms ease, transform 240ms ease",
};

const whisperGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 8,
};

const whisperStyle: CSSProperties = {
  border: "1px solid rgb(203 216 205 / 70%)",
  borderRadius: 8,
  background: "rgb(238 243 236 / 58%)",
  color: "#354139",
  padding: 11,
  lineHeight: 1.55,
  transition: "background 220ms ease, opacity 220ms ease, transform 220ms ease",
};

const outputBlendStyle: CSSProperties = {
  opacity: 1,
  transform: "translateY(0)",
  transition: "opacity 260ms ease, transform 260ms ease",
};

function getKernelProcessor(): KernelProcessor | null {
  const candidate = (globalThis as KernelBridge).processDevCanvasProductInput;
  return typeof candidate === "function" ? (candidate as KernelProcessor) : null;
}

function normalizeKernelResponse(response: KernelStructuredResponse): KernelStructuredResponse {
  return {
    text: response.text || "The scene waits for its next sentence.",
    suggestions: Array.isArray(response.suggestions) ? response.suggestions : [],
    events: Array.isArray(response.events) ? response.events : [],
    sessionState: {
      chapter: response.sessionState?.chapter || "current scene",
      continuity: response.sessionState?.continuity || "story thread held",
    },
  };
}

function buildNextBeatHints(events: KernelEventCandidate[]) {
  if (!events.length) {
    return ["A structural hint will appear here when the scene exposes its next turn."];
  }

  return events.slice(0, 2).map((event) => `${event.title} (${Math.round(event.confidence * 100)}% confidence)`);
}

function buildLineWhispers(kernelResponse: KernelStructuredResponse | null) {
  const sourceSuggestions = kernelResponse?.suggestions.length ? kernelResponse.suggestions : starterSuggestions;
  return sourceSuggestions.slice(0, 3).map((suggestion, index) => ({
    label: index === 0 ? "next line" : index === 1 ? "texture" : "pressure",
    text: suggestion,
  }));
}

function buildStoryMemory(kernelResponse: KernelStructuredResponse | null, sessionState: KernelSessionState) {
  const eventCount = kernelResponse?.events.length ?? 0;

  return [
    `Chapter: ${sessionState.chapter}`,
    `Continuity: ${sessionState.continuity}`,
    eventCount > 0 ? `${eventCount} quiet story turn(s) are being held in memory.` : "No story turn has surfaced yet.",
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
    idle: "ready to continue",
    drafting: "following the thread",
    ready: "thread held",
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
        Continue the story
      </label>
      <textarea
        id="tianyi-writing-input"
        className="dcw-input-field"
        value={inputText}
        onChange={(event) => onInputChange(event.target.value)}
        placeholder="Write the next image, decision, or unfinished sentence."
        rows={6}
      />
      <div className="dcw-input-actions">
        <span className="dcw-input-hint">The assistant will continue the draft without opening another system.</span>
        <button className="dcw-generate-button" type="submit" disabled={isGenerating}>
          {isGenerating ? "Writing..." : "Continue"}
        </button>
      </div>
    </form>
  );
}

function WritingCanvas({ streamedText, isWriting }: { streamedText: string; isWriting: boolean }) {
  return (
    <section className="dcw-writing-canvas" aria-label="Writing canvas">
      {streamedText ? (
        <div style={{ ...outputBlendStyle, opacity: isWriting ? 0.94 : 1 }}>
          <pre className="dcw-output-text">{streamedText}</pre>
        </div>
      ) : (
        <div className="dcw-empty-canvas">
          <p>The page is listening.</p>
          <span>Start with an image, a choice, or a line of dialogue.</span>
        </div>
      )}
    </section>
  );
}

function NarrativeUndercurrent({
  nextBeats,
  lineWhispers,
  storyMemory,
}: {
  nextBeats: string[];
  lineWhispers: { label: string; text: string }[];
  storyMemory: string[];
}) {
  return (
    <section style={ambienceStyle} aria-label="Writing flow suggestions">
      <div style={quietHintStyle}>
        <span className="dcw-panel-eyebrow">the next turn</span>
        <div style={whisperGridStyle}>
          {nextBeats.map((hint) => (
            <div style={whisperStyle} key={hint} role="note">
              {hint}
            </div>
          ))}
        </div>
      </div>
      <div style={quietHintStyle}>
        <span className="dcw-panel-eyebrow">line-level drift</span>
        <div style={whisperGridStyle}>
          {lineWhispers.map((whisper) => (
            <div style={whisperStyle} key={`${whisper.label}-${whisper.text}`} role="note">
              <strong>{whisper.label}</strong>
              <br />
              {whisper.text}
            </div>
          ))}
        </div>
      </div>
      <div style={quietHintStyle}>
        <span className="dcw-panel-eyebrow">story memory</span>
        <div style={whisperGridStyle}>
          {storyMemory.map((memory) => (
            <div style={whisperStyle} key={memory} role="note">
              {memory}
            </div>
          ))}
        </div>
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
    <section style={narrativeFlowStyle} aria-label="AI Tianyi story continuation area">
      <SessionIndicator flowState={flowState} sessionState={sessionState} />
      <WritingInput
        inputText={inputText}
        isGenerating={flowState === "drafting"}
        onInputChange={onInputChange}
        onGenerate={onGenerate}
      />
      <WritingCanvas streamedText={streamedText} isWriting={flowState === "drafting"} />
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
    const sentences = response.text
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);
    const segments = sentences.length ? sentences : response.text.split("\n\n");
    let nextSegmentIndex = 0;

    const pushNextSegment = () => {
      const segment = segments[nextSegmentIndex];

      if (!segment) {
        setKernelResponse(response);
        setSessionState(response.sessionState);
        setFlowState("ready");
        return;
      }

      setStreamedText((current) => (current ? `${current} ${segment}` : segment));
      nextSegmentIndex += 1;
      streamTimer.current = setTimeout(pushNextSegment, 300);
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
      chapter: "the current passage",
      continuity: "finding the next thread",
    });
    setStreamedText("");

    if (!kernelProcessor) {
      setStreamedText("The story cannot continue yet because processDevCanvasProductInput is not available in this UI runtime.");
      setSessionState({
        chapter: "unavailable passage",
        continuity: "kernel interface missing",
      });
      setFlowState("ready");
      return;
    }

    setFlowState("drafting");

    try {
      const response = normalizeKernelResponse(await kernelProcessor(trimmedInput));
      streamResponse(response);
    } catch (error) {
      setStreamedText(error instanceof Error ? error.message : "The continuation could not be written from the current kernel output.");
      setSessionState({
        chapter: "interrupted passage",
        continuity: "output not rendered",
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
        <NarrativeUndercurrent
          nextBeats={buildNextBeatHints(kernelResponse?.events ?? [])}
          lineWhispers={buildLineWhispers(kernelResponse)}
          storyMemory={buildStoryMemory(kernelResponse, sessionState)}
        />
      </div>
    </main>
  );
}

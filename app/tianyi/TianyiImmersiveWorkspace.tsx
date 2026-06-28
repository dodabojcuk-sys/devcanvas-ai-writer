"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { processDevCanvas } from "../../core/api/devcanvas";

type WritingFlowState = "idle" | "generating" | "continuing_story" | "branching" | "refining";

type KernelEventCandidate = {
  type: "event_line_candidate";
  title: string;
  confidence: number;
};

type KernelSessionState = {
  chapter: string;
  continuity: string;
};

type DevCanvasExplanation = {
  intent: string;
  reasoning: string[];
  systemFlow: string[];
  decisionPoints: string[];
  fallbackReasons?: string[];
};

type KernelStructuredResponse = {
  text: string;
  suggestions: string[];
  events: KernelEventCandidate[];
  sessionState: KernelSessionState;
  explanation?: DevCanvasExplanation;
};

type NarrativeParagraph = {
  id: string;
  text: string;
  isEmerging: boolean;
};

type KernelProcessor = (input: string, context?: any) => KernelStructuredResponse | Promise<KernelStructuredResponse>;

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

const outputBlendStyle: CSSProperties = {
  opacity: 1,
  transform: "translateY(0)",
  transition: "opacity 260ms ease, transform 260ms ease",
};

const narrativeArticleStyle: CSSProperties = {
  display: "grid",
  gap: 18,
};

const narrativeParagraphStyle: CSSProperties = {
  margin: 0,
  color: "#26322b",
  fontSize: 17,
  lineHeight: 1.86,
  whiteSpace: "pre-wrap",
};

const emergingParagraphStyle: CSSProperties = {
  opacity: 0.88,
  transform: "translateY(1px)",
};

const emergingSentenceStyle: CSSProperties = {
  background: "linear-gradient(90deg, rgb(238 243 236 / 0%), rgb(238 243 236 / 68%))",
  borderRadius: 6,
  padding: "1px 3px",
};

const explainabilityStyle: CSSProperties = {
  borderLeft: "2px solid rgb(137 153 143 / 68%)",
  color: "#354139",
  padding: "10px 0 0 14px",
};

const explainabilitySummaryStyle: CSSProperties = {
  cursor: "pointer",
  fontWeight: 600,
};

const explanationListStyle: CSSProperties = {
  margin: "10px 0 0",
  paddingLeft: 18,
  lineHeight: 1.55,
};

function getKernelProcessor(): KernelProcessor {
  return processDevCanvas as KernelProcessor;
}

function normalizeKernelResponse(response: KernelStructuredResponse): KernelStructuredResponse {
  const continuationText =
    response.text === "mock narrative response" ? "mock narrative continuation" : response.text;

  return {
    text: continuationText || "The scene waits for its next sentence.",
    suggestions: Array.isArray(response.suggestions) ? response.suggestions : [],
    events: Array.isArray(response.events) ? response.events : [],
    sessionState: {
      chapter: response.sessionState?.chapter || "current scene",
      continuity: response.sessionState?.continuity || "story thread held",
    },
    explanation: response.explanation,
  };
}

function buildNarrativeParagraphs(text: string, isWriting: boolean): NarrativeParagraph[] {
  const blocks = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return blocks.map((paragraph, index) => ({
    id: `paragraph-${index}-${paragraph.slice(0, 24)}`,
    text: paragraph,
    isEmerging: isWriting && index === blocks.length - 1,
  }));
}

function renderNarrativeParagraph(paragraph: NarrativeParagraph) {
  const sentences = paragraph.text.match(/[^.!?。！？]+[.!?。！？]?/g)?.filter((sentence) => sentence.trim()) ?? [
    paragraph.text,
  ];

  return sentences.map((sentence, index) => {
    const isLastSentence = paragraph.isEmerging && index === sentences.length - 1;

    return (
      <span style={isLastSentence ? emergingSentenceStyle : undefined} key={`${paragraph.id}-${index}`}>
        {sentence}
        {index < sentences.length - 1 ? " " : ""}
      </span>
    );
  });
}

function getNextWritingFlowState(input: string): Exclude<WritingFlowState, "idle" | "generating"> {
  const normalizedInput = input.toLowerCase();

  if (/\b(branch|choice|fork|alternative|what if)\b/.test(normalizedInput) || /分支|选择|岔路|另一种/.test(input)) {
    return "branching";
  }

  if (/\b(rewrite|revise|polish|refine|tighten)\b/.test(normalizedInput) || /改写|重写|润色|修订|精修/.test(input)) {
    return "refining";
  }

  return "continuing_story";
}

function buildContinuationTrigger({
  input,
  streamedText,
  storyContext,
  sessionState,
}: {
  input: string;
  streamedText: string;
  storyContext: string[];
  sessionState: KernelSessionState;
}) {
  const recentContext = storyContext.slice(-3).join("\n\n");
  const currentDraftTail = streamedText.trim().slice(-900);

  return [
    "Continue this story as the next narrative beat, not as an answer.",
    recentContext ? `Previous carried context:\n${recentContext}` : null,
    currentDraftTail ? `Current draft tail:\n${currentDraftTail}` : null,
    `Session: ${sessionState.chapter} / ${sessionState.continuity}`,
    `Continuation trigger:\n${input}`,
  ]
    .filter(Boolean)
    .join("\n\n");
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
        placeholder="Add the next image, choice, or line of dialogue."
        rows={6}
      />
      <div className="dcw-input-actions">
        <span className="dcw-input-hint">The next line will carry the draft forward.</span>
        <button className="dcw-generate-button" type="submit" disabled={isGenerating}>
          {isGenerating ? "Writing..." : "Continue story"}
        </button>
      </div>
    </form>
  );
}

function WritingCanvas({ streamedText, isWriting }: { streamedText: string; isWriting: boolean }) {
  const paragraphs = buildNarrativeParagraphs(streamedText, isWriting);

  return (
    <section className="dcw-writing-canvas" aria-label="Writing canvas">
      {paragraphs.length ? (
        <div style={{ ...outputBlendStyle, opacity: isWriting ? 0.94 : 1 }}>
          <article style={narrativeArticleStyle} aria-label="Narrative draft">
            {paragraphs.map((paragraph) => (
              <p
                className="dcw-output-text"
                style={{
                  ...narrativeParagraphStyle,
                  ...(paragraph.isEmerging ? emergingParagraphStyle : {}),
                }}
                key={paragraph.id}
              >
                {renderNarrativeParagraph(paragraph)}
              </p>
            ))}
          </article>
        </div>
      ) : (
        <div className="dcw-empty-canvas">
          <p>The story is waiting for its first motion.</p>
          <span>Start with an image, a choice, or a line of dialogue. The story will keep carrying it.</span>
        </div>
      )}
    </section>
  );
}

function ExplanationDisclosure({ explanation }: { explanation?: DevCanvasExplanation }) {
  if (!explanation?.reasoning.length) {
    return null;
  }

  return (
    <details style={explainabilityStyle}>
      <summary style={explainabilitySummaryStyle}>Why this continuation?</summary>
      <ul style={explanationListStyle}>
        {explanation.reasoning.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </details>
  );
}

function NarrativeUndercurrent({
  explanation,
}: {
  explanation?: DevCanvasExplanation;
}) {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <section style={ambienceStyle} aria-label="Continuation notes">
      <ExplanationDisclosure explanation={explanation} />
    </section>
  );
}

function AITianyiCore({
  inputText,
  streamedText,
  flowState,
  onInputChange,
  onGenerate,
}: {
  inputText: string;
  streamedText: string;
  flowState: WritingFlowState;
  onInputChange: (value: string) => void;
  onGenerate: () => void;
}) {
  return (
    <section style={narrativeFlowStyle} aria-label="Story continuation area">
      <WritingInput
        inputText={inputText}
        isGenerating={flowState === "generating"}
        onInputChange={onInputChange}
        onGenerate={onGenerate}
      />
      <WritingCanvas streamedText={streamedText} isWriting={flowState === "generating"} />
    </section>
  );
}

export default function TianyiImmersiveWorkspace() {
  const [inputText, setInputText] = useState("");
  const [streamedText, setStreamedText] = useState("");
  const [kernelResponse, setKernelResponse] = useState<KernelStructuredResponse | null>(null);
  const [flowState, setFlowState] = useState<WritingFlowState>("idle");
  const [sessionState, setSessionState] = useState<KernelSessionState>(defaultSessionState);
  const [storyContext, setStoryContext] = useState<string[]>([]);
  const streamTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (streamTimer.current) {
        clearTimeout(streamTimer.current);
      }
    };
  }, []);

  const streamResponse = (response: KernelStructuredResponse, nextFlowState: Exclude<WritingFlowState, "idle" | "generating">) => {
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
        setStoryContext((current) => [...current, response.text].slice(-5));
        setFlowState(nextFlowState);
        return;
      }

      setStreamedText((current) => {
        if (!current) {
          return segment;
        }

        return nextSegmentIndex === 0 ? `${current}\n\n${segment}` : `${current} ${segment}`;
      });
      nextSegmentIndex += 1;
      streamTimer.current = setTimeout(pushNextSegment, 300);
    };

    pushNextSegment();
  };

  const handleGenerate = async () => {
    const trimmedInput = inputText.trim();
    const kernelProcessor = getKernelProcessor();
    const nextFlowState = getNextWritingFlowState(trimmedInput);

    if (!trimmedInput || flowState === "generating") {
      return;
    }

    if (streamTimer.current) {
      clearTimeout(streamTimer.current);
    }

    setKernelResponse(null);
    setSessionState({
      chapter: "the current passage",
      continuity: storyContext.length ? "carrying the previous thread" : "finding the first thread",
    });
    setFlowState("generating");

    try {
      const continuationTrigger = buildContinuationTrigger({
        input: trimmedInput,
        streamedText,
        storyContext,
        sessionState,
      });
      const response = normalizeKernelResponse(
        await kernelProcessor(continuationTrigger, {
          source: "tianyi-ui",
          flowState: nextFlowState,
          sessionState,
          storyContextSize: storyContext.length,
        }),
      );
      setInputText("");
      streamResponse(response, nextFlowState);
    } catch (error) {
      setStreamedText((current) => {
        const message =
          error instanceof Error ? error.message : "The continuation could not be written from the current passage.";
        return current ? `${current}\n\n[${message}]` : message;
      });
      setSessionState({
        chapter: "interrupted passage",
        continuity: "output not rendered",
      });
      setFlowState(nextFlowState);
    }
  };

  return (
    <main className="dcw-tianyi-workspace" style={narrativeShellStyle}>
      <div style={narrativeFlowStyle}>
        <AITianyiCore
          inputText={inputText}
          streamedText={streamedText}
          flowState={flowState}
          onInputChange={setInputText}
          onGenerate={handleGenerate}
        />
        <NarrativeUndercurrent explanation={kernelResponse?.explanation} />
      </div>
    </main>
  );
}

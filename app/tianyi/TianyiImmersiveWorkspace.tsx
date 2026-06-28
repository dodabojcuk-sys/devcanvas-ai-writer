"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { processDevCanvas } from "../../core/api/devcanvas";

type WritingFlowState = "idle" | "generating" | "continuing_story" | "branching" | "refining";

type StoryBeatCandidate = {
  type: "event_line_candidate";
  title: string;
  confidence: number;
};

type StoryThreadState = {
  chapter: string;
  continuity: string;
};

type WritingContinuationResponse = {
  text: string;
  suggestions: string[];
  events: StoryBeatCandidate[];
  sessionState: StoryThreadState;
  explanation?: unknown;
};

type NarrativeParagraph = {
  id: string;
  text: string;
  isEmerging: boolean;
};

type WritingContinuationProcessor = (input: string, context?: any) => WritingContinuationResponse | Promise<WritingContinuationResponse>;

const defaultStoryThread: StoryThreadState = {
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

const outputBlendStyle: CSSProperties = {
  opacity: 1,
  transform: "translateY(0)",
  transition: "opacity 320ms ease, transform 320ms ease",
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

function getWritingContinuationProcessor(): WritingContinuationProcessor {
  return processDevCanvas as WritingContinuationProcessor;
}

function normalizeContinuationResponse(response: WritingContinuationResponse): WritingContinuationResponse {
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
  storyThread,
}: {
  input: string;
  streamedText: string;
  storyContext: string[];
  storyThread: StoryThreadState;
}) {
  const recentContext = storyContext.slice(-3).join("\n\n");
  const currentDraftTail = streamedText.trim().slice(-900);

  return [
    "Continue this story as the next narrative beat, not as an answer.",
    recentContext ? `Previous carried context:\n${recentContext}` : null,
    currentDraftTail ? `Current draft tail:\n${currentDraftTail}` : null,
    `Story thread: ${storyThread.chapter} / ${storyThread.continuity}`,
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
        What happens next?
      </label>
      <textarea
        id="tianyi-writing-input"
        className="dcw-input-field"
        value={inputText}
        onChange={(event) => onInputChange(event.target.value)}
        placeholder="A flicker of neon, a withheld answer, a door left half open..."
        rows={6}
      />
      <div className="dcw-input-actions">
        <span className="dcw-input-hint">Tianyi listens for the next beat.</span>
        <button className="dcw-generate-button" type="submit" disabled={isGenerating}>
          {isGenerating ? "Following the thread..." : "Let it continue"}
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
          <p>The page is quiet.</p>
          <span>Give it one image, one choice, or one line of dialogue.</span>
        </div>
      )}
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
  const [flowState, setFlowState] = useState<WritingFlowState>("idle");
  const [storyThread, setStoryThread] = useState<StoryThreadState>(defaultStoryThread);
  const [storyContext, setStoryContext] = useState<string[]>([]);
  const streamTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (streamTimer.current) {
        clearTimeout(streamTimer.current);
      }
    };
  }, []);

  const streamResponse = (response: WritingContinuationResponse, nextFlowState: Exclude<WritingFlowState, "idle" | "generating">) => {
    const paragraphs = response.text
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
    const segments = (paragraphs.length ? paragraphs : [response.text]).flatMap((paragraph, paragraphIndex) => {
      const sentences = paragraph
        .split(/(?<=[.!?。！？])\s+/)
        .map((sentence) => sentence.trim())
        .filter(Boolean);

      return (sentences.length ? sentences : [paragraph]).map((sentence, sentenceIndex) => ({
        text: sentence,
        startsParagraph: paragraphIndex > 0 || sentenceIndex === 0,
      }));
    });
    let nextSegmentIndex = 0;

    const pushNextSegment = () => {
      const segment = segments[nextSegmentIndex];

      if (!segment) {
        setStoryThread(response.sessionState);
        setStoryContext((current) => [...current, response.text].slice(-5));
        setFlowState(nextFlowState);
        return;
      }

      setStreamedText((current) => {
        if (!current) {
          return segment.text;
        }

        return segment.startsParagraph ? `${current}\n\n${segment.text}` : `${current} ${segment.text}`;
      });
      nextSegmentIndex += 1;
      streamTimer.current = setTimeout(pushNextSegment, 280);
    };

    pushNextSegment();
  };

  const handleGenerate = async () => {
    const trimmedInput = inputText.trim();
    const writingCompanion = getWritingContinuationProcessor();
    const nextFlowState = getNextWritingFlowState(trimmedInput);

    if (!trimmedInput || flowState === "generating") {
      return;
    }

    if (streamTimer.current) {
      clearTimeout(streamTimer.current);
    }

    setStoryThread({
      chapter: "the current passage",
      continuity: storyContext.length ? "carrying the previous thread" : "finding the first thread",
    });
    setFlowState("generating");

    try {
      const continuationTrigger = buildContinuationTrigger({
        input: trimmedInput,
        streamedText,
        storyContext,
        storyThread,
      });
      const response = normalizeContinuationResponse(
        await writingCompanion(continuationTrigger, {
          source: "tianyi-ui",
          flowState: nextFlowState,
          storyThread,
          storyContextSize: storyContext.length,
        }),
      );
      setInputText("");
      streamResponse(response, nextFlowState);
    } catch {
      setStreamedText((current) => {
        const message = "The line slips out of reach. Try the next sentence again.";
        return current ? `${current}\n\n${message}` : message;
      });
      setStoryThread({
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
      </div>
    </main>
  );
}

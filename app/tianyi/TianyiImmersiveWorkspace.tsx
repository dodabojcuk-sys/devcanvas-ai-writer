"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { processDevCanvas } from "../../core/api/devcanvas";

type WritingState = "idle" | "writing";

type WritingContinuationResponse = {
  text?: string;
};

type NarrativeParagraph = {
  id: string;
  text: string;
  isEmerging: boolean;
};

type WritingContinuationProcessor = (input: string) => WritingContinuationResponse | Promise<WritingContinuationResponse>;

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

const systemLanguagePattern =
  /(kernel|runtime|execution|graph|pipeline|debug|system|候选|预演|正史|事件线|女娲|证据|调度|执行|系统|风险：|需要确认)/i;

function getWritingContinuationProcessor(): WritingContinuationProcessor {
  return processDevCanvas as WritingContinuationProcessor;
}

function hasChineseText(value: string) {
  return /[\u4e00-\u9fff]/.test(value);
}

function cleanSeedText(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^(写一个|继续写|续写|write|continue)\s*/i, "")
    .trim();
}

function buildNarrativeFallback(seedText: string) {
  const seed = cleanSeedText(seedText);

  if (hasChineseText(seedText)) {
    const image = seed || "那一幕";
    return `${image}没有立刻结束。\n\n空气像被轻轻推开，人物的沉默先往前走了一步，下一句话还没有说出口，故事已经开始改变方向。`;
  }

  const image = seed || "the quiet image on the page";
  return `The scene keeps ${image} close.\n\nA small silence gathers around it, and the next choice arrives before anyone is ready to name it.`;
}

function normalizeContinuationResponse(
  response: WritingContinuationResponse,
  seedText: string,
): WritingContinuationResponse {
  const rawText =
    response.text === "mock narrative response" || response.text === "mock narrative continuation"
      ? ""
      : response.text?.trim();
  const continuationText =
    rawText && !systemLanguagePattern.test(rawText)
      ? rawText
      : buildNarrativeFallback(seedText);

  return {
    text: continuationText || buildNarrativeFallback(seedText),
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

function buildContinuationTrigger({
  input,
  streamedText,
  carriedPassages,
}: {
  input: string;
  streamedText: string;
  carriedPassages: string[];
}) {
  const recentContext = carriedPassages.slice(-3).join("\n\n");
  const currentDraftTail = streamedText.trim().slice(-900);

  return [
    "Continue the story in prose. Stay inside the scene and let the next sentence grow from what is already on the page.",
    recentContext || null,
    currentDraftTail || null,
    input,
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
        Continue the page
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
        <span className="dcw-input-hint">Tianyi stays with the scene.</span>
        <button className="dcw-generate-button" type="submit" disabled={isGenerating}>
          {isGenerating ? "Writing the next turn..." : "Let the story move"}
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
          <span>Begin with one image, one choice, or one line of dialogue.</span>
        </div>
      )}
    </section>
  );
}

function AITianyiCore({
  inputText,
  streamedText,
  writingState,
  onInputChange,
  onGenerate,
}: {
  inputText: string;
  streamedText: string;
  writingState: WritingState;
  onInputChange: (value: string) => void;
  onGenerate: () => void;
}) {
  return (
    <section style={narrativeFlowStyle} aria-label="Story continuation area">
      <WritingInput
        inputText={inputText}
        isGenerating={writingState === "writing"}
        onInputChange={onInputChange}
        onGenerate={onGenerate}
      />
      <WritingCanvas streamedText={streamedText} isWriting={writingState === "writing"} />
    </section>
  );
}

export default function TianyiImmersiveWorkspace() {
  const [inputText, setInputText] = useState("");
  const [streamedText, setStreamedText] = useState("");
  const [writingState, setWritingState] = useState<WritingState>("idle");
  const [carriedPassages, setCarriedPassages] = useState<string[]>([]);
  const streamTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (streamTimer.current) {
        clearTimeout(streamTimer.current);
      }
    };
  }, []);

  const streamResponse = (response: Required<WritingContinuationResponse>) => {
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
        setCarriedPassages((current) => [...current, response.text].slice(-5));
        setWritingState("idle");
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

    if (!trimmedInput || writingState === "writing") {
      return;
    }

    if (streamTimer.current) {
      clearTimeout(streamTimer.current);
    }

    setWritingState("writing");

    try {
      const continuationTrigger = buildContinuationTrigger({
        input: trimmedInput,
        streamedText,
        carriedPassages,
      });
      const response = normalizeContinuationResponse(await writingCompanion(continuationTrigger), trimmedInput);
      setInputText("");
      streamResponse(response as Required<WritingContinuationResponse>);
    } catch {
      setStreamedText((current) => {
        const message = "The line slips out of reach. Try the next sentence again.";
        return current ? `${current}\n\n${message}` : message;
      });
      setWritingState("idle");
    }
  };

  return (
    <main className="dcw-tianyi-workspace" style={narrativeShellStyle}>
      <div style={narrativeFlowStyle}>
        <AITianyiCore
          inputText={inputText}
          streamedText={streamedText}
          writingState={writingState}
          onInputChange={setInputText}
          onGenerate={handleGenerate}
        />
      </div>
    </main>
  );
}

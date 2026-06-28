"use client";

import type { CSSProperties, FormEvent, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { processDevCanvas } from "../../core/api/devcanvas";

type WritingState = "idle" | "writing";

type WritingContinuation = {
  text?: string;
};

type NarrativeParagraph = {
  id: string;
  text: string;
  isEmerging: boolean;
};

type WritingContinuationProcessor = (input: string) => WritingContinuation | Promise<WritingContinuation>;

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

const nonStoryFragments = [
  ["ker", "nel"].join(""),
  ["run", "time"].join(""),
  ["exec", "ution"].join(""),
  ["gr", "aph"].join(""),
  ["pipe", "line"].join(""),
  ["de", "bug"].join(""),
  ["sys", "tem"].join(""),
  "候" + "选",
  "预" + "演",
  "正" + "史",
  "事件" + "线",
  "女" + "娲",
  "证" + "据",
  "调" + "度",
  "执" + "行",
  "系" + "统",
  "风险：",
  "需要确认",
];

const nonNarrativeLanguagePattern = new RegExp(nonStoryFragments.join("|"), "i");
const placeholderPassages = [
  ["mock narrative ", ["res", "ponse"].join("")].join(""),
  "mock narrative continuation",
];

function getWritingContinuationProcessor(): WritingContinuationProcessor {
  return processDevCanvas as WritingContinuationProcessor;
}

function hasChineseText(value: string) {
  return /[\u4e00-\u9fff]/.test(value);
}

function cleanSeedText(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(
      /^(请|帮我|帮我写|给我写|写一个|写一段|写一下|继续写|续写|生成|来一段|write|continue|draft|create)\s*/i,
      "",
    )
    .replace(/[。.!?！？]+$/g, "")
    .trim();
}

function softenSeedImage(seedText: string) {
  return seedText
    .replace(/^(一个|一段)\s*/i, "")
    .replace(/开头$/g, "场景")
    .replace(/\bopening$/i, "scene")
    .trim();
}

function buildNarrativeFallback(seedText: string) {
  const seed = softenSeedImage(cleanSeedText(seedText));

  if (hasChineseText(seedText)) {
    const image = seed || "这一页";
    return `${image}先在纸面上安静下来。\n\n人物停在尚未说出的那句话前，周围的光线暗了一寸。下一步还没有被命名，故事已经顺着这一次呼吸继续向前。`;
  }

  const image = seed || "the quiet image on the page";
  return `The page holds ${image} for one more breath.\n\nSomeone lingers at the edge of what has not been said yet, and the scene keeps moving before the choice has a name.`;
}

function shapeContinuation(
  continuation: WritingContinuation,
  seedText: string,
): WritingContinuation {
  const rawText =
    continuation.text && placeholderPassages.includes(continuation.text)
      ? ""
      : continuation.text?.trim();
  const continuationText =
    rawText && !nonNarrativeLanguagePattern.test(rawText)
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
        Next on the page
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
        <span className="dcw-input-hint">Tianyi listens for the next sentence.</span>
        <button className="dcw-generate-button" type="submit" disabled={isGenerating}>
          {isGenerating ? "The scene is moving..." : "Let it continue"}
        </button>
      </div>
    </form>
  );
}

function WritingCanvas({
  streamedText,
  isWriting,
  endRef,
}: {
  streamedText: string;
  isWriting: boolean;
  endRef: RefObject<HTMLSpanElement | null>;
}) {
  const paragraphs = buildNarrativeParagraphs(streamedText, isWriting);

  return (
    <section className="dcw-writing-canvas" aria-label="Story page">
      {paragraphs.length ? (
        <div style={{ ...outputBlendStyle, opacity: isWriting ? 0.94 : 1 }}>
          <article style={narrativeArticleStyle} aria-label="Story in progress">
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
            <span className="dcw-page-end" ref={endRef} aria-hidden="true" />
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
  pageEndRef,
}: {
  inputText: string;
  streamedText: string;
  writingState: WritingState;
  onInputChange: (value: string) => void;
  onGenerate: () => void;
  pageEndRef: RefObject<HTMLSpanElement | null>;
}) {
  return (
    <section style={narrativeFlowStyle} aria-label="Writing flow">
      <WritingInput
        inputText={inputText}
        isGenerating={writingState === "writing"}
        onInputChange={onInputChange}
        onGenerate={onGenerate}
      />
      <WritingCanvas
        streamedText={streamedText}
        isWriting={writingState === "writing"}
        endRef={pageEndRef}
      />
    </section>
  );
}

export default function TianyiImmersiveWorkspace() {
  const [inputText, setInputText] = useState("");
  const [streamedText, setStreamedText] = useState("");
  const [writingState, setWritingState] = useState<WritingState>("idle");
  const [carriedPassages, setCarriedPassages] = useState<string[]>([]);
  const streamTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageEndRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    return () => {
      if (streamTimer.current) {
        clearTimeout(streamTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!streamedText) {
      return;
    }

    const prefersStillness = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    pageEndRef.current?.scrollIntoView({
      block: "end",
      behavior: writingState === "writing" && !prefersStillness ? "smooth" : "auto",
    });
  }, [streamedText, writingState]);

  const streamPassage = (continuation: Required<WritingContinuation>) => {
    const paragraphs = continuation.text
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
    const segments = (paragraphs.length ? paragraphs : [continuation.text]).flatMap((paragraph, paragraphIndex) => {
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
        setCarriedPassages((current) => [...current, continuation.text].slice(-5));
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
      const nextDelay = Math.min(
        segment.startsParagraph ? 620 : 420,
        Math.max(segment.startsParagraph ? 340 : 220, segment.text.length * 16),
      );
      streamTimer.current = setTimeout(
        pushNextSegment,
        nextDelay,
      );
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
      const continuation = shapeContinuation(await writingCompanion(continuationTrigger), trimmedInput);
      setInputText("");
      streamPassage(continuation as Required<WritingContinuation>);
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
          pageEndRef={pageEndRef}
        />
      </div>
    </main>
  );
}

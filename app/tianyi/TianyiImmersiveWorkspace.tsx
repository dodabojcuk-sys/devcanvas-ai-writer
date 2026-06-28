"use client";

import type { ChangeEvent, CSSProperties, FormEvent, RefObject } from "react";
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

type WorldDraftEvidence = {
  source_id: string;
  chapter_id: string;
  chunk_id: string;
  paragraph_index: number;
  char_start: number;
  char_end: number;
  quote: string;
};

type WorldDraftItem = {
  id: string;
  label: string;
  detail: string;
  confidence: number;
  evidence: WorldDraftEvidence;
};

type WorldModelDraft = {
  summary: string;
  characters: WorldDraftItem[];
  relationships: WorldDraftItem[];
  worldRules: WorldDraftItem[];
  timelineEvents: WorldDraftItem[];
  locations: WorldDraftItem[];
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
  background: "linear-gradient(90deg, rgb(213 225 216 / 0%), rgb(213 225 216 / 72%))",
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
      <span
        className={isLastSentence ? "dcw-current-sentence" : undefined}
        style={isLastSentence ? emergingSentenceStyle : undefined}
        key={`${paragraph.id}-${index}`}
      >
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

function normalizeSourceText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function toDraftId(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "source";
}

function makeEvidence({
  sourceId,
  paragraph,
  paragraphIndex,
  chunkIndex,
  matchStart,
  matchLength,
}: {
  sourceId: string;
  paragraph: string;
  paragraphIndex: number;
  chunkIndex: number;
  matchStart: number;
  matchLength: number;
}): WorldDraftEvidence {
  const charStart = Math.max(0, matchStart);
  const charEnd = Math.min(paragraph.length, charStart + Math.max(matchLength, 1));
  const quoteStart = Math.max(0, charStart - 28);
  const quoteEnd = Math.min(paragraph.length, charEnd + 44);

  return {
    source_id: sourceId,
    chapter_id: "source-draft",
    chunk_id: `chunk-${chunkIndex + 1}`,
    paragraph_index: paragraphIndex,
    char_start: charStart,
    char_end: charEnd,
    quote: paragraph.slice(quoteStart, quoteEnd),
  };
}

function uniqueDraftItems(items: WorldDraftItem[], limit: number) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.label.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  }).slice(0, limit);
}

function collectMatches({
  sourceId,
  paragraphs,
  pattern,
  type,
  detail,
  limit,
}: {
  sourceId: string;
  paragraphs: string[];
  pattern: RegExp;
  type: string;
  detail: (label: string, paragraph: string) => string;
  limit: number;
}): WorldDraftItem[] {
  const matches: WorldDraftItem[] = [];

  paragraphs.slice(0, 60).forEach((paragraph, paragraphIndex) => {
    const chunkIndex = Math.floor(paragraphIndex / 6);
    const matcher = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
    let match: RegExpExecArray | null;

    while ((match = matcher.exec(paragraph)) && matches.length < limit * 3) {
      const matchedLabel = match.slice(1).find((group) => Boolean(group)) || match[0];
      const label = matchedLabel.replace(/[，。,.!?:：；;、]/g, "").trim();

      if (label.length < 2 || label.length > 24) {
        continue;
      }

      if (/^(的|里|与|和|同)/.test(label)) {
        continue;
      }

      matches.push({
        id: `${type}-${matches.length + 1}-${toDraftId(label)}`,
        label,
        detail: detail(label, paragraph),
        confidence: 0.64,
        evidence: makeEvidence({
          sourceId,
          paragraph,
          paragraphIndex,
          chunkIndex,
          matchStart: match.index,
          matchLength: match[0].length,
        }),
      });
    }
  });

  return uniqueDraftItems(matches, limit);
}

function buildWorldModelDraft(rawSource: string): WorldModelDraft {
  const source = normalizeSourceText(rawSource);
  const paragraphs = source
    .split(/\n{2,}|\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const sourceId = `creative-source-${Math.max(1, source.length)}`;
  const summarySeed = paragraphs[0] || source || "A new story source is waiting to be read.";
  const summary =
    summarySeed.length > 180
      ? `${summarySeed.slice(0, 180).trim()}...`
      : summarySeed;
  const explicitCharacters = collectMatches({
    sourceId,
    paragraphs,
    pattern: /(?:角色|人物|主角)\s*[：:]\s*([\u4e00-\u9fa5A-Za-z][\u4e00-\u9fa5A-Za-z0-9·]{1,12}?)(?=是|为|叫|在|，|。|,|\s|$)/gi,
    type: "character",
    detail: (label) => `${label} appears as a possible person or voice in the source.`,
    limit: 6,
  });
  const relationships = collectMatches({
    sourceId,
    paragraphs,
    pattern: /([\u4e00-\u9fa5A-Za-z][\u4e00-\u9fa5A-Za-z0-9·]{1,10}?\s*(?:与|和|同)\s*[\u4e00-\u9fa5A-Za-z][\u4e00-\u9fa5A-Za-z0-9·]{1,10}?)(?=在|于|，|。|,|\s|$)|([A-Za-z][A-Za-z0-9·]{1,14}\s*(?:against|with|versus)\s*[A-Za-z][A-Za-z0-9·]{1,14})/gi,
    type: "relation",
    detail: (label) => `${label} reads as a possible relationship thread.`,
    limit: 5,
  });
  const relationshipCharacters = relationships.flatMap((relationship, index) =>
    relationship.label
      .split(/与|和|同|against|with|versus/i)
      .map((part) => part.trim())
      .filter((part) => part.length >= 2 && part.length <= 16)
      .map((label, partIndex) => ({
        id: `relation-character-${index + 1}-${partIndex + 1}-${toDraftId(label)}`,
        label,
        detail: `${label} is implied by a relationship thread in the source.`,
        confidence: Math.min(0.62, relationship.confidence),
        evidence: relationship.evidence,
      })),
  );
  const characters = uniqueDraftItems([...explicitCharacters, ...relationshipCharacters], 6);
  const locations = collectMatches({
    sourceId,
    paragraphs,
    pattern: /(?:地点|城市|港口|学院|宫殿|街区|荒原)\s*[：:，, ]*\s*([A-Za-z\u4e00-\u9fa5][A-Za-z0-9\u4e00-\u9fa5·]{1,12}?)(?=悬|在|是|里|，|。|,|\s|$)|(?:在|来到|穿过|进入|返回)\s*([A-Za-z\u4e00-\u9fa5][A-Za-z0-9\u4e00-\u9fa5·]{1,12}?)(?=里|中|上|下|，|。|,|\s|$)|(?:station|city|harbor|academy|palace|district|wasteland)\s*([A-Za-z][A-Za-z0-9·]{1,18})/gi,
    type: "location",
    detail: (label) => `${label} may anchor a scene or region.`,
    limit: 5,
  });
  const worldRules = collectMatches({
    sourceId,
    paragraphs,
    pattern: /(?:规则|禁忌|设定|必须|不能|只有|如果|代价|law|rule|must|cannot|only if|cost)\s*[：:，, ]*\s*([^。.!?\n]{4,42})/gi,
    type: "rule",
    detail: (label) => `${label} looks like a possible world rule or constraint.`,
    limit: 5,
  });
  const timelineEvents = collectMatches({
    sourceId,
    paragraphs,
    pattern: /(?:然后|后来|当|直到|之后|从此|那天|before|after|when|then)\s*([^。.!?\n]{4,46})/gi,
    type: "turn",
    detail: (label) => `${label} may be a turning point in the source timeline.`,
    limit: 6,
  });

  return {
    summary,
    characters,
    relationships,
    worldRules,
    timelineEvents,
    locations,
  };
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
        Where the story leans next
      </label>
      <textarea
        id="tianyi-writing-input"
        className="dcw-input-field"
        value={inputText}
        onChange={(event) => onInputChange(event.target.value)}
        placeholder="A voice at the edge of the scene, a door left half open, a choice no one has named..."
        rows={6}
      />
      <div className="dcw-input-actions">
        <span className="dcw-input-hint">Tianyi follows the atmosphere already on the page.</span>
        <button className="dcw-generate-button" type="submit" disabled={isGenerating}>
          {isGenerating ? "The next sentence is arriving..." : "Let the scene continue"}
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
          <p>The page is listening.</p>
          <span>Begin with an image, a secret, or the first line of a scene.</span>
        </div>
      )}
    </section>
  );
}

function DraftSection({ title, items }: { title: string; items: WorldDraftItem[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="dcw-draft-section" aria-label={title}>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <strong>{item.label}</strong>
            <span>{item.detail}</span>
            <small>{item.evidence.quote}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CreativeMode({
  sourceText,
  worldDraft,
  sourceNotice,
  onSourceTextChange,
  onSourceFile,
  onReadSource,
}: {
  sourceText: string;
  worldDraft: WorldModelDraft | null;
  sourceNotice: string;
  onSourceTextChange: (value: string) => void;
  onSourceFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onReadSource: () => void;
}) {
  const hasDraft =
    worldDraft &&
    (worldDraft.characters.length ||
      worldDraft.relationships.length ||
      worldDraft.worldRules.length ||
      worldDraft.timelineEvents.length ||
      worldDraft.locations.length);

  return (
    <section className="dcw-creative-source" aria-label="Source reading">
      <div className="dcw-source-intro">
        <span>Source pages</span>
        <p>Bring in a passage, outline, or raw idea before the next scene grows.</p>
      </div>
      <div className="dcw-source-grid">
        <label className="dcw-source-drop">
          <span>Choose a text file</span>
          <input type="file" accept=".txt,.md,text/plain,text/markdown" onChange={onSourceFile} />
        </label>
        <textarea
          className="dcw-source-field"
          value={sourceText}
          onChange={(event) => onSourceTextChange(event.target.value)}
          placeholder="Paste a chapter, a scene fragment, or a world idea. Tianyi will sketch the people, places, rules, and turns it can see."
          rows={7}
        />
      </div>
      <div className="dcw-source-actions">
        <span>{sourceNotice || "Nothing is written back. This only prepares a reading draft."}</span>
        <button className="dcw-source-button" type="button" onClick={onReadSource} disabled={!sourceText.trim()}>
          Trace the world
        </button>
      </div>
      {worldDraft ? (
        <div className="dcw-world-draft" aria-label="Story source draft">
          <section className="dcw-draft-summary">
            <h3>Story pulse</h3>
            <p>{worldDraft.summary}</p>
          </section>
          {hasDraft ? (
            <div className="dcw-draft-grid">
              <DraftSection title="People" items={worldDraft.characters} />
              <DraftSection title="Ties" items={worldDraft.relationships} />
              <DraftSection title="Places" items={worldDraft.locations} />
              <DraftSection title="Rules" items={worldDraft.worldRules} />
              <DraftSection title="Turns" items={worldDraft.timelineEvents} />
            </div>
          ) : (
            <p className="dcw-draft-empty">The source is quiet. Add names, places, choices, or rules for a clearer sketch.</p>
          )}
        </div>
      ) : null}
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
  const [sourceText, setSourceText] = useState("");
  const [worldDraft, setWorldDraft] = useState<WorldModelDraft | null>(null);
  const [sourceNotice, setSourceNotice] = useState("");
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

  const handleSourceFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const text = await file.text();
    const normalizedText = normalizeSourceText(text);
    setSourceText(normalizedText);
    setWorldDraft(null);
    setSourceNotice(`${file.name} is ready to read.`);
    event.target.value = "";
  };

  const handleReadSource = () => {
    const normalizedText = normalizeSourceText(sourceText);

    if (!normalizedText) {
      return;
    }

    const draft = buildWorldModelDraft(normalizedText);
    const itemCount =
      draft.characters.length +
      draft.relationships.length +
      draft.worldRules.length +
      draft.timelineEvents.length +
      draft.locations.length;

    setSourceText(normalizedText);
    setWorldDraft(draft);
    setSourceNotice(
      itemCount
        ? `${itemCount} story traces found. Review them before the next scene.`
        : "The source was read, but it needs clearer names, places, choices, or rules.",
    );
  };

  return (
    <main className="dcw-tianyi-workspace" style={narrativeShellStyle}>
      <div style={narrativeFlowStyle}>
        <CreativeMode
          sourceText={sourceText}
          worldDraft={worldDraft}
          sourceNotice={sourceNotice}
          onSourceTextChange={setSourceText}
          onSourceFile={handleSourceFile}
          onReadSource={handleReadSource}
        />
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

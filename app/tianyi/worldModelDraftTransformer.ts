import type {
  CharacterNode,
  EvidenceMeta,
  LocationNode,
  RelationEdge,
  RuleNode,
  TimelineEvent,
  WorldModelDraft,
  WorldModelDraftItem,
} from "../../types/worldModelDraft";

type DraftKind = WorldModelDraftItem["kind"];

type DraftMatchConfig<T extends WorldModelDraftItem> = {
  sourceId: string;
  paragraphs: string[];
  pattern: RegExp;
  kind: DraftKind;
  detail: (label: string, paragraph: string) => string;
  limit: number;
  toItem: (base: DraftItemBase, label: string, index: number) => T;
};

type DraftItemBase = {
  id: string;
  label: string;
  detail: string;
  source: string;
  chunkId: string;
  paragraphIndex: number;
  charStart: number;
  charEnd: number;
  quote: string;
  confidence: number;
  evidenceId: string;
};

export function normalizeSourceText(value: string) {
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
  confidence,
}: {
  sourceId: string;
  paragraph: string;
  paragraphIndex: number;
  chunkIndex: number;
  matchStart: number;
  matchLength: number;
  confidence: number;
}): EvidenceMeta {
  const charStart = Math.max(0, matchStart);
  const charEnd = Math.min(paragraph.length, charStart + Math.max(matchLength, 1));
  const quoteStart = Math.max(0, charStart - 28);
  const quoteEnd = Math.min(paragraph.length, charEnd + 44);
  const chunkId = `chunk-${chunkIndex + 1}`;

  return {
    id: `evidence-${toDraftId(sourceId)}-${chunkId}-${paragraphIndex}-${charStart}-${charEnd}`,
    source: sourceId,
    chunkId,
    paragraphIndex,
    charStart,
    charEnd,
    quote: paragraph.slice(quoteStart, quoteEnd),
    confidence,
  };
}

function uniqueDraftItems<T extends WorldModelDraftItem>(items: T[], limit: number) {
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

function collectMatches<T extends WorldModelDraftItem>({
  sourceId,
  paragraphs,
  pattern,
  kind,
  detail,
  limit,
  toItem,
}: DraftMatchConfig<T>): T[] {
  const matches: T[] = [];

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

      const confidence = 0.64;
      const evidence = makeEvidence({
        sourceId,
        paragraph,
        paragraphIndex,
        chunkIndex,
        matchStart: match.index,
        matchLength: match[0].length,
        confidence,
      });
      const base: DraftItemBase = {
        id: `${kind}-${matches.length + 1}-${toDraftId(label)}`,
        label,
        detail: detail(label, paragraph),
        source: evidence.source,
        chunkId: evidence.chunkId,
        paragraphIndex: evidence.paragraphIndex,
        charStart: evidence.charStart,
        charEnd: evidence.charEnd,
        quote: evidence.quote,
        confidence: evidence.confidence,
        evidenceId: evidence.id,
      };

      matches.push(toItem(base, label, matches.length));
    }
  });

  return uniqueDraftItems(matches, limit);
}

function collectEvidence(items: WorldModelDraftItem[]) {
  const seen = new Set<string>();

  return items.reduce<EvidenceMeta[]>((evidence, item) => {
    if (seen.has(item.evidenceId)) {
      return evidence;
    }

    seen.add(item.evidenceId);
    evidence.push({
      id: item.evidenceId,
      source: item.source,
      chunkId: item.chunkId,
      paragraphIndex: item.paragraphIndex,
      charStart: item.charStart,
      charEnd: item.charEnd,
      quote: item.quote,
      confidence: item.confidence,
    });
    return evidence;
  }, []);
}

export function buildWorldModelDraft(rawSource: string): WorldModelDraft {
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
  const explicitCharacters = collectMatches<CharacterNode>({
    sourceId,
    paragraphs,
    pattern: /(?:角色|人物|主角)\s*[：:]\s*([\u4e00-\u9fa5A-Za-z][\u4e00-\u9fa5A-Za-z0-9·]{1,12}?)(?=是|为|叫|在|，|。|,|\s|$)/gi,
    kind: "character",
    detail: (label) => `${label} appears as a possible person or voice in the source.`,
    limit: 6,
    toItem: (base) => ({ ...base, kind: "character" }),
  });
  const relationships = collectMatches<RelationEdge>({
    sourceId,
    paragraphs,
    pattern: /([\u4e00-\u9fa5A-Za-z][\u4e00-\u9fa5A-Za-z0-9·]{1,10}?\s*(?:与|和|同)\s*[\u4e00-\u9fa5A-Za-z][\u4e00-\u9fa5A-Za-z0-9·]{1,10}?)(?=在|于|，|。|,|\s|$)|([A-Za-z][A-Za-z0-9·]{1,14}\s*(?:against|with|versus)\s*[A-Za-z][A-Za-z0-9·]{1,14})/gi,
    kind: "relationship",
    detail: (label) => `${label} reads as a possible relationship thread.`,
    limit: 5,
    toItem: (base, label) => {
      const [from = label, to = label] = label.split(/与|和|同|against|with|versus/i).map((part) => part.trim());

      return {
        ...base,
        kind: "relationship",
        from,
        to,
      };
    },
  });
  const relationshipCharacters = relationships.flatMap((relationship, index) =>
    [relationship.from, relationship.to]
      .filter((label) => label.length >= 2 && label.length <= 16)
      .map<CharacterNode>((label, partIndex) => ({
        id: `relation-character-${index + 1}-${partIndex + 1}-${toDraftId(label)}`,
        kind: "character",
        label,
        detail: `${label} is implied by a relationship thread in the source.`,
        source: relationship.source,
        chunkId: relationship.chunkId,
        paragraphIndex: relationship.paragraphIndex,
        charStart: relationship.charStart,
        charEnd: relationship.charEnd,
        quote: relationship.quote,
        confidence: Math.min(0.62, relationship.confidence),
        evidenceId: relationship.evidenceId,
      })),
  );
  const characters = uniqueDraftItems([...explicitCharacters, ...relationshipCharacters], 6);
  const locations = collectMatches<LocationNode>({
    sourceId,
    paragraphs,
    pattern: /(?:地点|城市|港口|学院|宫殿|街区|荒原)\s*[：:，, ]*\s*([A-Za-z\u4e00-\u9fa5][A-Za-z0-9\u4e00-\u9fa5·]{1,12}?)(?=悬|在|是|里|，|。|,|\s|$)|(?:在|来到|穿过|进入|返回)\s*([A-Za-z\u4e00-\u9fa5][A-Za-z0-9\u4e00-\u9fa5·]{1,12}?)(?=里|中|上|下|，|。|,|\s|$)|(?:station|city|harbor|academy|palace|district|wasteland)\s*([A-Za-z][A-Za-z0-9·]{1,18})/gi,
    kind: "location",
    detail: (label) => `${label} may anchor a scene or region.`,
    limit: 5,
    toItem: (base) => ({ ...base, kind: "location" }),
  });
  const rules = collectMatches<RuleNode>({
    sourceId,
    paragraphs,
    pattern: /(?:规则|禁忌|设定|必须|不能|只有|如果|代价|law|rule|must|cannot|only if|cost)\s*[：:，, ]*\s*([^。.!?\n]{4,42})/gi,
    kind: "rule",
    detail: (label) => `${label} looks like a possible world rule or constraint.`,
    limit: 5,
    toItem: (base) => ({ ...base, kind: "rule" }),
  });
  const timeline = collectMatches<TimelineEvent>({
    sourceId,
    paragraphs,
    pattern: /(?:然后|后来|当|直到|之后|从此|那天|before|after|when|then)\s*([^。.!?\n]{4,46})/gi,
    kind: "timeline_event",
    detail: (label) => `${label} may be a turning point in the source timeline.`,
    limit: 6,
    toItem: (base, _label, index) => ({ ...base, kind: "timeline_event", order: index + 1 }),
  });
  const evidence = collectEvidence([
    ...characters,
    ...relationships,
    ...locations,
    ...rules,
    ...timeline,
  ]);

  return {
    summary,
    characters,
    relationships,
    locations,
    rules,
    timeline,
    evidence,
  };
}

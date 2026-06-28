import { processDevCanvasInput } from "./index";

export type DevCanvasKernelEvent = {
  type: "event_line_candidate";
  title: string;
  confidence: number;
};

export type DevCanvasKernelSessionState = {
  chapter: string;
  continuity: string;
};

export type DevCanvasKernelResponse = {
  text: string;
  suggestions: string[];
  events: DevCanvasKernelEvent[];
  sessionState: DevCanvasKernelSessionState;
};

export function runDevCanvasKernel(input: string): DevCanvasKernelResponse {
  const response = processDevCanvasInput({ input });
  const events = response.events.map((event) => ({
    type: "event_line_candidate" as const,
    title: event.title,
    confidence: 0.72,
  }));
  const chapter = response.sessionState.chapterState.currentChapterTitle;
  const continuity =
    response.sessionState.eventState.latestEventHint ||
    response.sessionState.storyMemory.currentConflict ||
    "start";

  return {
    text: response.text,
    suggestions: events.map((event) => event.title).slice(0, 3),
    events,
    sessionState: {
      chapter,
      continuity,
    },
  };
}

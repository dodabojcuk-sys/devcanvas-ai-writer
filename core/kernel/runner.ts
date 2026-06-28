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
  void input;

  return {
    text: "mock narrative response",
    suggestions: [],
    events: [],
    sessionState: {
      chapter: "init",
      continuity: "start",
    },
  };
}

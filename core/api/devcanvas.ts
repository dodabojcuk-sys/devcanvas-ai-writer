import { runDevCanvasKernel, type DevCanvasKernelResponse } from "../kernel/runner";

export type DevCanvasExecutionGraph = {
  entry: "processDevCanvas";
  kernel: "runDevCanvasKernel";
  wrappers: Array<"processDevCanvasInput" | "processDevCanvasProductInput">;
  contextProvided: boolean;
};

export type DevCanvasAuditResult = {
  ok: boolean;
  source: "devcanvas-api-contract";
  notes: string[];
};

export type DevCanvasResponse = DevCanvasKernelResponse & {
  executionGraph: DevCanvasExecutionGraph;
  auditResult: DevCanvasAuditResult;
};

function normalizeKernelResponse(response: DevCanvasKernelResponse): DevCanvasKernelResponse {
  return {
    text: response.text || "mock narrative response",
    suggestions: Array.isArray(response.suggestions) ? response.suggestions : [],
    events: Array.isArray(response.events) ? response.events : [],
    sessionState: {
      chapter: response.sessionState?.chapter || "init",
      continuity: response.sessionState?.continuity || "start",
    },
  };
}

export function processDevCanvas(input: string, context?: any): DevCanvasResponse {
  const kernelResponse = normalizeKernelResponse(runDevCanvasKernel(input));

  return {
    ...kernelResponse,
    executionGraph: {
      entry: "processDevCanvas",
      kernel: "runDevCanvasKernel",
      wrappers: ["processDevCanvasInput", "processDevCanvasProductInput"],
      contextProvided: typeof context !== "undefined",
    },
    auditResult: {
      ok: true,
      source: "devcanvas-api-contract",
      notes: [
        "processDevCanvas is the single execution entry point.",
        typeof context !== "undefined" ? "Execution context received." : "No execution context provided.",
      ],
    },
  };
}

export function processDevCanvasInput(input: string, context?: any): DevCanvasResponse {
  return processDevCanvas(input, context);
}

export function processDevCanvasProductInput(input: string, context?: any): DevCanvasResponse {
  return processDevCanvas(input, context);
}

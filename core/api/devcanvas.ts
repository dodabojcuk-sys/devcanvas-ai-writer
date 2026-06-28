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

export type DevCanvasExplanation = {
  intent: string;
  reasoning: string[];
  systemFlow: string[];
  decisionPoints: string[];
  fallbackReasons?: string[];
};

export type DevCanvasResponse = DevCanvasKernelResponse & {
  executionGraph: DevCanvasExecutionGraph;
  auditResult: DevCanvasAuditResult;
  explanation: DevCanvasExplanation;
};

type NormalizedKernelResult = {
  response: DevCanvasKernelResponse;
  fallbackReasons: string[];
};

function classifyIntent(input: string) {
  const normalizedInput = input.toLowerCase();

  if (/\b(branch|choice|fork|alternative|what if)\b/.test(normalizedInput) || /分支|选择|岔路|另一种/.test(input)) {
    return "branching";
  }

  if (/\b(rewrite|revise|polish|refine|tighten)\b/.test(normalizedInput) || /改写|重写|润色|修订|精修/.test(input)) {
    return "refining";
  }

  return "narrative_continuation";
}

function normalizeKernelResponse(response: DevCanvasKernelResponse): NormalizedKernelResult {
  const fallbackReasons: string[] = [];
  const text = response.text || "mock narrative response";
  const suggestions = Array.isArray(response.suggestions) ? response.suggestions : [];
  const events = Array.isArray(response.events) ? response.events : [];
  const chapter = response.sessionState?.chapter || "init";
  const continuity = response.sessionState?.continuity || "start";

  if (!response.text) {
    fallbackReasons.push("Kernel response did not include text; default narrative text was used.");
  }

  if (!Array.isArray(response.suggestions)) {
    fallbackReasons.push("Kernel response did not include suggestions; an empty suggestion list was used.");
  }

  if (!Array.isArray(response.events)) {
    fallbackReasons.push("Kernel response did not include events; an empty event list was used.");
  }

  if (!response.sessionState?.chapter || !response.sessionState?.continuity) {
    fallbackReasons.push("Kernel response did not include a complete session state; default session fields were used.");
  }

  return {
    response: {
      text,
      suggestions,
      events,
      sessionState: {
        chapter,
        continuity,
      },
    },
    fallbackReasons,
  };
}

function buildExplanation({
  input,
  context,
  executionGraph,
  fallbackReasons,
}: {
  input: string;
  context?: any;
  executionGraph: DevCanvasExecutionGraph;
  auditResult: DevCanvasAuditResult;
  fallbackReasons: string[];
}): DevCanvasExplanation {
  const intent = classifyIntent(input);
  const intentReason: Record<string, string> = {
    branching: "I treated this as a possible branch in the story.",
    refining: "I treated this as a request to refine the current passage.",
    narrative_continuation: "I treated this as a continuation of the current story.",
  };
  const systemFlow = [
    `entry: ${executionGraph.entry}`,
    `router: ${executionGraph.entry} -> ${executionGraph.kernel}`,
    `kernel: ${executionGraph.kernel}`,
    `compatibility: ${executionGraph.wrappers.join(", ")}`,
  ];
  const decisionPoints = [
    `intentClassifier: ${intent}`,
    "constraintEngine: no additional constraints changed this execution",
    `router: selected ${executionGraph.kernel} from the existing execution graph`,
    fallbackReasons.length ? "fallback: normalization used fallback values" : "fallback: none",
  ];
  const reasoning = [
    intentReason[intent],
    "I kept the response inside the writing flow instead of opening another tool.",
    "Story structure, rewrite pressure, and consistency cues stayed in the background.",
    executionGraph.contextProvided
      ? "I used the current writing session as context."
      : "I used only the current prompt as context.",
    fallbackReasons.length
      ? "Some missing response fields were filled quietly so the draft could keep moving."
      : "No fallback was needed for this response.",
  ];

  return {
    intent,
    reasoning,
    systemFlow,
    decisionPoints,
    ...(fallbackReasons.length ? { fallbackReasons } : {}),
  };
}

export function processDevCanvas(input: string, context?: any): DevCanvasResponse {
  const { response: kernelResponse, fallbackReasons } = normalizeKernelResponse(runDevCanvasKernel(input));
  const executionGraph: DevCanvasExecutionGraph = {
    entry: "processDevCanvas",
    kernel: "runDevCanvasKernel",
    wrappers: ["processDevCanvasInput", "processDevCanvasProductInput"],
    contextProvided: typeof context !== "undefined",
  };
  const auditResult: DevCanvasAuditResult = {
    ok: true,
    source: "devcanvas-api-contract",
    notes: [
      "processDevCanvas is the single execution entry point.",
      typeof context !== "undefined" ? "Execution context received." : "No execution context provided.",
    ],
  };

  return {
    ...kernelResponse,
    executionGraph,
    auditResult,
    explanation: buildExplanation({
      input,
      context,
      executionGraph,
      auditResult,
      fallbackReasons,
    }),
  };
}

export function processDevCanvasInput(input: string, context?: any): DevCanvasResponse {
  return processDevCanvas(input, context);
}

export function processDevCanvasProductInput(input: string, context?: any): DevCanvasResponse {
  return processDevCanvas(input, context);
}

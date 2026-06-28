export type SystemRuntimeTarget =
  | "nuwa"
  | "evidence"
  | "model"
  | "audit"
  | "living_book"
  | "task"

export interface SystemRuntimePayload {
  [key: string]: unknown
}

export interface SystemRuntimeResult {
  target: SystemRuntimeTarget
  status: "executed" | "planned"
  summary: string
  trace: string[]
  payload: SystemRuntimePayload
}

import { buildStoryMemoryIndex } from "./evidence/storyMemoryIndex"
import { runNuwaRewriteEngine } from "./nuwa/nuwaRewriteEngine"

const SYSTEM_SUMMARIES: Record<SystemRuntimeTarget, string> = {
  nuwa: "Nuwa system accepted a candidate-only execution request.",
  evidence: "Evidence system accepted a traceable support request.",
  model: "Model system accepted a validation-only request.",
  audit: "Audit system accepted a trace recording request.",
  living_book: "Living Book system accepted a state read request.",
  task: "Task system accepted a packet planning request.",
}

function systemPayloadFor(target: SystemRuntimeTarget, payload: SystemRuntimePayload): SystemRuntimePayload {
  if (target === "nuwa") {
    return {
      ...payload,
      ...runNuwaRewriteEngine(payload),
    }
  }

  if (target === "evidence") {
    return {
      ...payload,
      ...buildStoryMemoryIndex(payload),
    }
  }

  return payload
}

export function callIsolatedSystem(target: SystemRuntimeTarget, payload: SystemRuntimePayload): SystemRuntimeResult {
  const enrichedPayload = systemPayloadFor(target, payload)
  return {
    target,
    status: target === "evidence" || target === "audit" ? "executed" : "planned",
    summary: SYSTEM_SUMMARIES[target],
    trace: [`system.${target}.isolated_boundary`],
    payload: enrichedPayload,
  }
}

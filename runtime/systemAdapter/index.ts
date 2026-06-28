import { callIsolatedSystem, type SystemRuntimePayload, type SystemRuntimeTarget } from "../../system"
import { assertSystemCallAllowed } from "../enforcement/systemCallInterceptor"
import type { RuntimeKernelGuard } from "../enforcement/runtimeGuard"

export type SystemAdapterTarget =
  | "event_line"
  | SystemRuntimeTarget

export interface SystemAdapterRequest {
  system: SystemAdapterTarget
  payload: SystemRuntimePayload
}

export interface SystemAdapterResult {
  system: SystemAdapterTarget
  status: "executed" | "planned"
  summary: string
  trace: string[]
  payload: SystemRuntimePayload
}

function isSystemRuntimeTarget(system: SystemAdapterTarget): system is SystemRuntimeTarget {
  return system !== "event_line"
}

function callEventLineBoundary(payload: SystemRuntimePayload): SystemAdapterResult {
  return {
    system: "event_line",
    status: "executed",
    summary: "EventLine core accepted a derived structure request through SystemAdapter.",
    trace: ["runtime.system_adapter.event_line.derived_boundary"],
    payload,
  }
}

export function callSystemAdapter({ system, payload }: SystemAdapterRequest, guard?: RuntimeKernelGuard): SystemAdapterResult {
  assertSystemCallAllowed(system, guard)

  if (!isSystemRuntimeTarget(system)) {
    return callEventLineBoundary(payload)
  }

  const result = callIsolatedSystem(system, payload)
  return {
    system: result.target,
    status: result.status,
    summary: result.summary,
    trace: ["runtime.system_adapter", ...result.trace],
    payload: result.payload,
  }
}

export const SystemAdapter = {
  call: callSystemAdapter,
}

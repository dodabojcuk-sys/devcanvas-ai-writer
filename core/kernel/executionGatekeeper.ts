import type { KernelRoute } from "./router"

export interface KernelExecutionGate {
  caller: "kernel.index"
}

export interface KernelGateDecision {
  allowed: boolean
  violations: string[]
}

export function createKernelExecutionGate(): KernelExecutionGate {
  return { caller: "kernel.index" }
}

export function evaluateExecutionGate(route: KernelRoute, gate?: KernelExecutionGate): KernelGateDecision {
  const violations: string[] = []

  if (!gate || gate.caller !== "kernel.index") {
    violations.push("gatekeeper_blocked_non_kernel_caller")
  }

  if (!route.constraintApproved) {
    violations.push("gatekeeper_blocked_missing_constraint_approval")
  }

  if (route.executionPlan.primarySystem === "model") {
    violations.push("gatekeeper_blocked_model_primary_escalation")
  }

  if (route.executionPlan.entrySurface !== "kernel") {
    violations.push("gatekeeper_blocked_non_kernel_entry_surface")
  }

  return {
    allowed: violations.length === 0,
    violations,
  }
}

export function assertExecutionAllowed(route: KernelRoute, gate?: KernelExecutionGate) {
  const decision = evaluateExecutionGate(route, gate)
  if (!decision.allowed) {
    throw new Error(`Kernel gatekeeper blocked execution: ${decision.violations.join(", ")}`)
  }
}

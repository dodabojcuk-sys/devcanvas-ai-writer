export type RuntimeAuditRiskLevel = "low" | "medium" | "high"

export interface RuntimeConsistencyAuditResult {
  isValid: boolean
  violations: string[]
  riskLevel: RuntimeAuditRiskLevel
  fallbackTriggered: boolean
}

export interface RuntimeAuditExecutionGraph {
  constraintResult?: {
    allowed?: boolean
    violations?: string[]
    fallbackTo?: string
  }
  executionSteps?: Array<{
    stage?: string
    status?: string
  }>
  fallbackReason?: string | null
}

export interface RuntimeAuditSubject {
  trace?: string[]
  executionGraph?: RuntimeAuditExecutionGraph
  executionPlan?: {
    primarySystem?: string
    secondarySystems?: string[]
    blockedSystems?: string[]
    entrySurface?: string
  }
  systemResults?: Array<{
    target?: string
    trace?: string[]
  }>
}

export function auditResultFromViolations(violations: string[], fallbackTriggered: boolean): RuntimeConsistencyAuditResult {
  return {
    isValid: violations.length === 0,
    violations,
    riskLevel: violations.some((violation) => violation.includes("_missing") || violation.includes("bypass") || violation.includes("interceptor"))
      ? "high"
      : violations.length > 0
        ? "medium"
        : "low",
    fallbackTriggered,
  }
}

export function validateKernelInvariants(subject: RuntimeAuditSubject): RuntimeConsistencyAuditResult {
  const violations: string[] = []
  const trace = subject.trace ?? []
  const constraintIndex = trace.indexOf("kernel.constraint_engine")
  const routerIndex = trace.indexOf("kernel.router")
  const fallbackTo = subject.executionGraph?.constraintResult?.fallbackTo

  if (!subject.executionGraph) {
    violations.push("kernel.execution_graph_missing")
  }

  if (constraintIndex < 0) {
    violations.push("kernel.constraint_engine_trace_missing")
  }

  if (routerIndex < 0) {
    violations.push("kernel.router_trace_missing")
  }

  if (constraintIndex >= 0 && routerIndex >= 0 && constraintIndex > routerIndex) {
    violations.push("kernel.constraint_engine_after_router")
  }

  if (fallbackTo && fallbackTo !== "tianyi") {
    violations.push("kernel.fallback_not_tianyi")
  }

  return auditResultFromViolations(violations, fallbackTo === "tianyi")
}

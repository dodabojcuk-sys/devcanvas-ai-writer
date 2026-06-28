import { auditResultFromViolations, validateKernelInvariants, type RuntimeConsistencyAuditResult, type RuntimeAuditSubject } from "./kernelInvariantValidator"
import { checkSystemConsistency } from "./systemConsistencyChecker"

export type { RuntimeConsistencyAuditResult } from "./kernelInvariantValidator"

function validateRuntimeInvariants(subject: RuntimeAuditSubject): RuntimeConsistencyAuditResult {
  const violations: string[] = []
  const fallbackTriggered = subject.executionGraph?.constraintResult?.fallbackTo === "tianyi"
  const steps = subject.executionGraph?.executionSteps ?? []
  const stepStages = new Set(steps.map((step) => step.stage))

  if (subject.executionGraph && steps.length === 0) {
    violations.push("runtime.execution_trace_missing")
  }

  if (subject.executionGraph && !stepStages.has("gatekeeper")) {
    violations.push("runtime.gatekeeper_step_missing")
  }

  if (subject.executionGraph && !stepStages.has("response")) {
    violations.push("runtime.response_step_missing")
  }

  for (const result of subject.systemResults ?? []) {
    if (!result.trace || result.trace.length === 0) {
      violations.push(`runtime.system_result_trace_missing:${result.target ?? "unknown"}`)
    }
  }

  return auditResultFromViolations(violations, fallbackTriggered)
}

function highestRisk(results: RuntimeConsistencyAuditResult[]) {
  if (results.some((result) => result.riskLevel === "high")) return "high"
  if (results.some((result) => result.riskLevel === "medium")) return "medium"
  return "low"
}

export function verifyRuntimeSanity(subject: RuntimeAuditSubject): RuntimeConsistencyAuditResult {
  const results = [
    validateKernelInvariants(subject),
    checkSystemConsistency(subject),
    validateRuntimeInvariants(subject),
  ]
  const violations = Array.from(new Set(results.flatMap((result) => result.violations)))

  return {
    isValid: violations.length === 0,
    violations,
    riskLevel: highestRisk(results),
    fallbackTriggered: results.some((result) => result.fallbackTriggered),
  }
}

import { auditResultFromViolations, type RuntimeConsistencyAuditResult, type RuntimeAuditSubject } from "./kernelInvariantValidator"

const SYSTEM_TARGETS_REQUIRING_ADAPTER = new Set(["event_line", "nuwa", "evidence", "model", "audit", "living_book", "task"])

export function checkSystemConsistency(subject: RuntimeAuditSubject): RuntimeConsistencyAuditResult {
  const violations: string[] = []
  const fallbackTriggered = subject.executionGraph?.constraintResult?.fallbackTo === "tianyi"

  for (const result of subject.systemResults ?? []) {
    const target = result.target ?? "unknown"
    const trace = result.trace ?? []

    if (trace.some((entry) => entry.startsWith("ui.") || entry.startsWith("app."))) {
      violations.push(`system.reverse_ui_dependency:${target}`)
    }

    if (SYSTEM_TARGETS_REQUIRING_ADAPTER.has(target) && !trace.some((entry) => entry.startsWith("runtime.system_adapter"))) {
      violations.push(`runtime.system_call_interceptor_missing:${target}`)
    }
  }

  return auditResultFromViolations(violations, fallbackTriggered)
}

export type KernelExecutionStage =
  | "input"
  | "intent"
  | "constraint"
  | "priority"
  | "route"
  | "gatekeeper"
  | "dispatch"
  | "response"

export type KernelExecutionStepStatus = "completed" | "blocked" | "planned"

export interface KernelExecutionStep {
  id: string
  stage: KernelExecutionStage
  summary: string
  status: KernelExecutionStepStatus
}

export function createExecutionStep(
  stage: KernelExecutionStage,
  summary: string,
  status: KernelExecutionStepStatus = "completed",
): KernelExecutionStep {
  return {
    id: `kernel-${stage}`,
    stage,
    summary,
    status,
  }
}

export function createExecutionTrace(steps: KernelExecutionStep[]): KernelExecutionStep[] {
  return steps.map((step, index) => ({
    ...step,
    id: `${step.id}-${index + 1}`,
  }))
}

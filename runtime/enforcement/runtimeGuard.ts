export interface RuntimeKernelGuard {
  caller: "kernel"
  constraintChecked: true
  adapterAllowed: true
}

export function createRuntimeKernelGuard(): RuntimeKernelGuard {
  return {
    caller: "kernel",
    constraintChecked: true,
    adapterAllowed: true,
  }
}

export function isRuntimeKernelGuard(value: unknown): value is RuntimeKernelGuard {
  if (!value || typeof value !== "object") return false
  const guard = value as Partial<RuntimeKernelGuard>
  return guard.caller === "kernel" && guard.constraintChecked === true && guard.adapterAllowed === true
}

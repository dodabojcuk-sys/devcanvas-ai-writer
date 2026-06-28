import { isRuntimeKernelGuard, type RuntimeKernelGuard } from "./runtimeGuard"

export type InterceptedSystemTarget =
  | "event_line"
  | "nuwa"
  | "evidence"
  | "model"
  | "audit"
  | "living_book"
  | "task"

export interface SystemCallInterceptResult {
  allowed: boolean
  target: InterceptedSystemTarget
  reason: string
}

export function interceptSystemCall(
  target: InterceptedSystemTarget,
  guard?: RuntimeKernelGuard,
): SystemCallInterceptResult {
  if (!isRuntimeKernelGuard(guard)) {
    return {
      allowed: false,
      target,
      reason: `runtime guard blocked direct system call to ${target}; route through Kernel`,
    }
  }

  return {
    allowed: true,
    target,
    reason: `runtime guard accepted Kernel-mediated system call to ${target}`,
  }
}

export function assertSystemCallAllowed(target: InterceptedSystemTarget, guard?: RuntimeKernelGuard) {
  const result = interceptSystemCall(target, guard)
  if (!result.allowed) {
    throw new Error(result.reason)
  }
}

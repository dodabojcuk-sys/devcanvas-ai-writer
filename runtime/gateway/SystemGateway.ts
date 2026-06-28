import {
  callSystemAdapter,
  type SystemAdapterRequest,
  type SystemAdapterResult,
  type SystemAdapterTarget,
} from "../systemAdapter";
import type { RuntimeKernelGuard } from "../enforcement/runtimeGuard";

export type SystemGatewayTarget = SystemAdapterTarget;
export type SystemGatewayRequest = SystemAdapterRequest;
export type SystemGatewayResult = SystemAdapterResult;

export function callSystemGateway(request: SystemGatewayRequest, guard?: RuntimeKernelGuard): SystemGatewayResult {
  return callSystemAdapter(request, guard);
}

export const SystemGateway = {
  call: callSystemGateway,
};

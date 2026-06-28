import {
  processDevCanvasInput,
  processDevCanvasProductInput,
  type KernelInputContext,
} from "./index";

export { processDevCanvasInput, processDevCanvasProductInput };
export type { KernelInputContext };

export const ExecutionKernel = {
  execute: processDevCanvasInput,
};

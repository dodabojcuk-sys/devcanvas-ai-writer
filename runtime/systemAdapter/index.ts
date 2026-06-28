import { processDevCanvas } from "../../core/api/devcanvas";

export function processDevCanvasInputThroughSystemAdapter(input: string, context?: any) {
  return processDevCanvas(input, context);
}

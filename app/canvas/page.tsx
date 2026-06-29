import { TianyiImmersiveWorkspace } from "@/app/tianyi/TianyiImmersiveWorkspace"

export default function NewCanvasPage() {
  return (
    <main className="new-canvas-page" data-testid="new-canvas-page" data-entry-point="ai-tianyi-only">
      <TianyiImmersiveWorkspace />
    </main>
  )
}

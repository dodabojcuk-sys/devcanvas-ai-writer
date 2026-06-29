import type { ReactNode } from "react"

import { OrbitalEventRing, type OrbitNode } from "@/ui/cosmos/OrbitalEventRing"
import { TianyiCosmicCore } from "@/ui/cosmos/TianyiCosmicCore"

type NarrativeOrbitSystemProps = {
  children: ReactNode
  chapterLabel: string
  eventNodes: OrbitNode[]
  statusLabel: string
}

export function NarrativeOrbitSystem({
  children,
  chapterLabel,
  eventNodes,
  statusLabel,
}: NarrativeOrbitSystemProps) {
  return (
    <section className="narrative-orbit-system" data-testid="narrative-orbit-system" aria-label="AI 天意宇宙运行层">
      <TianyiCosmicCore chapterLabel={chapterLabel} statusLabel={statusLabel} />
      <OrbitalEventRing nodes={eventNodes} />
      <div className="cosmic-writing-slot">{children}</div>
    </section>
  )
}

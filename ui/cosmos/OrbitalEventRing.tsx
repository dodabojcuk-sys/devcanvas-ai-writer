import type { CSSProperties } from "react"

export type OrbitNode = {
  id: string
  label: string
  kind: "character" | "event" | "prediction"
  orbit: "inner" | "middle" | "outer"
  angle: number
}

type OrbitalEventRingProps = {
  nodes: OrbitNode[]
}

export function OrbitalEventRing({ nodes }: OrbitalEventRingProps) {
  return (
    <div className="orbital-event-ring" data-testid="orbital-event-ring" aria-hidden="true">
      <div className="orbital-event-ring__track orbital-event-ring__track--outer" />
      <div className="orbital-event-ring__track orbital-event-ring__track--middle" />
      <div className="orbital-event-ring__track orbital-event-ring__track--inner" />
      {nodes.map((node) => (
        <div
          key={node.id}
          className={`orbital-event-ring__node orbital-event-ring__node--${node.orbit}`}
          data-orbit-kind={node.kind}
          style={{ "--orbit-angle": `${node.angle}deg` } as CSSProperties}
        >
          <span>{node.label}</span>
        </div>
      ))}
    </div>
  )
}

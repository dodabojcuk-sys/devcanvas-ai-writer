type TianyiCosmicCoreProps = {
  chapterLabel: string
  statusLabel: string
}

export function TianyiCosmicCore({ chapterLabel, statusLabel }: TianyiCosmicCoreProps) {
  return (
    <div className="tianyi-cosmic-core" data-testid="tianyi-cosmic-core" aria-hidden="true">
      <div className="tianyi-cosmic-core__orb" />
      <div className="tianyi-cosmic-core__label">
        <span>AI 天意</span>
        <p>{chapterLabel} / {statusLabel}</p>
      </div>
    </div>
  )
}

/** Neutral gray placeholders — swap for illustrations later. */

export function DiscoveryHeroPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div className={`discovery-hero-placeholder ${className}`.trim()} aria-hidden>
      <div className="discovery-hero-placeholder-card discovery-hero-placeholder-card--back" />
      <div className="discovery-hero-placeholder-card discovery-hero-placeholder-card--front" />
    </div>
  )
}

export function AboutHeroPlaceholder({ className = '' }: { className?: string }) {
  return <div className={`about-hero-placeholder ${className}`.trim()} aria-hidden />
}

export function ValuePillarPlaceholder() {
  return <span className="value-pillar-placeholder" aria-hidden />
}

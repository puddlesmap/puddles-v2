import { Link } from 'react-router-dom'
import type { SeasonalCollection } from '../../data/seasonalDiscovery'

interface SeasonalDiscoveryModuleHeaderProps {
  collection: SeasonalCollection
  headingId: string
  /** PlanetBox-style “View all” in the section header row. */
  headerCta?: { href: string; label: string }
  /**
   * Home band — SEPTEMBER + See all on one full-width row; title beside art, subtitle below.
   */
  homeBand?: boolean
  /** Home band eyebrow line — default matches collection subtitle (Hello, Fall). */
  homeBandEyebrow?: 'subtitle' | 'timing'
}

/** Break after the em dash so the second clause starts on its own line. */
export function SeasonalEmDashTagline({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const [lead, rest] = text.split(/\s+[—–-]\s+/)
  if (!rest) {
    return <p className={className}>{text}</p>
  }

  return (
    <p className={className}>
      {lead} —
      <br />
      {rest}
    </p>
  )
}

export function SeasonalDiscoveryModuleHeader({
  collection,
  headingId,
  headerCta,
  homeBand = false,
  homeBandEyebrow = 'subtitle',
}: SeasonalDiscoveryModuleHeaderProps) {
  if (homeBand) {
    const eyebrowText =
      homeBandEyebrow === 'timing' ? collection.timingLabel : collection.subtitle

    return (
      <header className="seasonal-discovery-module__header seasonal-discovery-module__header--home-band">
        <div className="seasonal-discovery-module__eyebrow-row">
          <p className="seasonal-discovery-module__eyebrow">{eyebrowText}</p>
          {headerCta ? (
            <Link to={headerCta.href} className="seasonal-discovery-module__header-cta">
              {headerCta.label}
              <span aria-hidden> →</span>
            </Link>
          ) : null}
        </div>

        <div className="seasonal-discovery-module__title-with-art">
          <h2 id={headingId} className="seasonal-discovery-module__title">
            {collection.title}
          </h2>
          <img
            src={collection.illustrationSrc}
            alt=""
            className="seasonal-discovery-module__illustration--header-copy"
            width={52}
            height={52}
            decoding="async"
          />
        </div>
        <SeasonalEmDashTagline
          text={collection.moduleTagline}
          className="seasonal-discovery-module__description"
        />
      </header>
    )
  }

  return (
    <header className="seasonal-discovery-module__header">
      <div className="seasonal-discovery-module__intro">
        <p className="seasonal-discovery-module__eyebrow">{collection.subtitle}</p>
        <h2 id={headingId} className="seasonal-discovery-module__title">
          {collection.title}
        </h2>
        <p className="seasonal-discovery-module__description">{collection.moduleTagline}</p>
      </div>
      <img
        src={collection.illustrationSrc}
        alt=""
        className="seasonal-discovery-module__illustration"
        width={88}
        height={88}
        decoding="async"
      />
    </header>
  )
}

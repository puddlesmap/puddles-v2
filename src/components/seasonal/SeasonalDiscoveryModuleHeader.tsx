import { Link } from 'react-router-dom'
import type { SeasonalCollection } from '../../data/seasonalDiscovery'

interface SeasonalDiscoveryModuleHeaderProps {
  collection: SeasonalCollection
  headingId: string
  /** PlanetBox-style “View all” in the section header row. */
  headerCta?: { href: string; label: string }
  /** Home band — eyebrow, title+CTA row, subtitle + illustration. */
  homeBand?: boolean
  /** Home band eyebrow line — default matches collection subtitle (Hello, Fall). */
  homeBandEyebrow?: 'subtitle' | 'timing'
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
        <p className="seasonal-discovery-module__eyebrow">{eyebrowText}</p>

        <div className="seasonal-discovery-module__title-row">
          <h2 id={headingId} className="seasonal-discovery-module__title">
            {collection.title}
          </h2>
          {headerCta ? (
            <Link to={headerCta.href} className="seasonal-discovery-module__header-cta">
              {headerCta.label}
              <span aria-hidden> →</span>
            </Link>
          ) : null}
        </div>

        <div className="seasonal-discovery-module__subtitle-row">
          <p className="seasonal-discovery-module__description">{collection.moduleTagline}</p>
          <img
            src={collection.illustrationSrc}
            alt=""
            className="seasonal-discovery-module__illustration--header-copy"
            width={72}
            height={72}
            decoding="async"
          />
        </div>
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

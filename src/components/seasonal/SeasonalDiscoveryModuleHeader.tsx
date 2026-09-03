import { Link } from 'react-router-dom'
import type { SeasonalCollection } from '../../data/seasonalDiscovery'

interface SeasonalDiscoveryModuleHeaderProps {
  collection: SeasonalCollection
  headingId: string
  /** PlanetBox-style “View all” in the section header row. */
  headerCta?: { href: string; label: string }
  /**
   * Home band — mobile: title + See all row; desktop: See all with SEPTEMBER,
   * larger centered illustration beside copy.
   */
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

    const cta = headerCta ? (
      <Link to={headerCta.href} className="seasonal-discovery-module__header-cta">
        {headerCta.label}
        <span aria-hidden> →</span>
      </Link>
    ) : null

    return (
      <header className="seasonal-discovery-module__header seasonal-discovery-module__header--home-band">
        <div className="seasonal-discovery-module__header-content">
          <div className="seasonal-discovery-module__header-copy-group">
            <div className="seasonal-discovery-module__header-text">
              <p className="seasonal-discovery-module__eyebrow">{eyebrowText}</p>

              <div className="seasonal-discovery-module__title-row">
                <h2 id={headingId} className="seasonal-discovery-module__title">
                  {collection.title}
                </h2>
                <span className="seasonal-discovery-module__header-cta-slot seasonal-discovery-module__header-cta-slot--mobile">
                  {cta}
                </span>
              </div>

              <p className="seasonal-discovery-module__description">{collection.moduleTagline}</p>
            </div>

            <img
              src={collection.illustrationSrc}
              alt=""
              className="seasonal-discovery-module__illustration--header-copy"
              width={88}
              height={88}
              decoding="async"
            />
          </div>

          <span className="seasonal-discovery-module__header-cta-slot seasonal-discovery-module__header-cta-slot--desktop">
            {cta}
          </span>
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

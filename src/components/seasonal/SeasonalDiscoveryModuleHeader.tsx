import { Link } from 'react-router-dom'
import type { SeasonalCollection } from '../../data/seasonalDiscovery'

interface SeasonalDiscoveryModuleHeaderProps {
  collection: SeasonalCollection
  headingId: string
  /** PlanetBox-style “View all” in the section header row. */
  headerCta?: { href: string; label: string }
  /** Home band — one copy group + illustration; CTA aligned with eyebrow. */
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
        <div className="seasonal-discovery-module__header-content">
          <div className="seasonal-discovery-module__header-copy-group">
            <div className="seasonal-discovery-module__header-text">
              <p className="seasonal-discovery-module__eyebrow">{eyebrowText}</p>
              {headerCta ? (
                <Link
                  to={headerCta.href}
                  className="seasonal-discovery-module__header-cta seasonal-discovery-module__header-cta--mobile"
                >
                  {headerCta.label}
                  <span aria-hidden> →</span>
                </Link>
              ) : null}
              <h2 id={headingId} className="seasonal-discovery-module__title">
                {collection.title}
              </h2>
              <img
                src={collection.illustrationSrc}
                alt=""
                className="seasonal-discovery-module__illustration--header-copy seasonal-discovery-module__illustration--mobile"
                width={72}
                height={72}
                decoding="async"
              />
              <p className="seasonal-discovery-module__description">{collection.moduleTagline}</p>
            </div>
            <img
              src={collection.illustrationSrc}
              alt=""
              className="seasonal-discovery-module__illustration--header-copy seasonal-discovery-module__illustration--desktop"
              width={72}
              height={72}
              decoding="async"
            />
          </div>
          {headerCta ? (
            <Link
              to={headerCta.href}
              className="seasonal-discovery-module__header-cta seasonal-discovery-module__header-cta--desktop"
            >
              {headerCta.label}
              <span aria-hidden> →</span>
            </Link>
          ) : null}
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

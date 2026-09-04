import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { Event } from '../../types/event'
import { BrowseEventCard } from '../BrowseEventCard'
import type { SeasonalCollection } from '../../data/seasonalDiscovery'
import { seasonalCollectionPath } from '../../data/seasonalDiscovery'
import { SeasonalDiscoveryModuleHeader } from './SeasonalDiscoveryModuleHeader'

interface SeasonalDiscoveryModuleProps {
  collection: SeasonalCollection
  events: Event[]
  onEventClick: (event: Event) => void
  className?: string
  /** Full-bleed home band — attached below nav announcement. */
  bandLayout?: 'default' | 'home'
  homeBandEyebrow?: 'subtitle' | 'timing'
  homeBandCopyTone?: 'seasonal' | 'neutral'
}

export function SeasonalDiscoveryModule({
  collection,
  events,
  onEventClick,
  className,
  bandLayout = 'default',
  homeBandEyebrow = 'subtitle',
  homeBandCopyTone = 'seasonal',
}: SeasonalDiscoveryModuleProps) {
  const isHomeBand = bandLayout === 'home'
  const isEmpty = events.length === 0
  const showCollectionLink = isEmpty || events.length >= 3
  const collectionHref = seasonalCollectionPath(collection.slug)
  const headerCta =
    isHomeBand && showCollectionLink
      ? { href: collectionHref, label: collection.ctaLabel }
      : undefined

  const shell = (
    <div className="seasonal-discovery-module__shell">
      <SeasonalDiscoveryModuleHeader
        collection={collection}
        headingId="seasonal-discovery-heading"
        headerCta={headerCta}
        homeBand={isHomeBand}
        homeBandEyebrow={homeBandEyebrow}
      />

      {isEmpty ? (
        <p className="seasonal-discovery-module__empty">
          Featured picks for this week are updating — see the full collection.
        </p>
      ) : (
        <div
          className={[
            'seasonal-discovery-module__carousel-wrap',
            isHomeBand ? 'browse-content seasonal-discovery-module__carousel-wrap--home' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="seasonal-discovery-module__carousel" role="list">
            {events.map((event) => (
              <div key={event.id} className="seasonal-discovery-module__card" role="listitem">
                <BrowseEventCard
                  event={event}
                  seasonalEditorial={false}
                  onClick={() => onEventClick(event)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {!isHomeBand && showCollectionLink ? (
        <div className="seasonal-discovery-module__footer">
          <Link to={collectionHref} className="seasonal-discovery-module__cta">
            {collection.ctaLabel}
            <span aria-hidden> →</span>
          </Link>
        </div>
      ) : null}
    </div>
  )

  const section = (
    <section
      className={[
        'seasonal-discovery-module',
        isHomeBand ? 'seasonal-discovery-module--home-band' : '',
        isHomeBand && homeBandCopyTone === 'neutral'
          ? 'seasonal-discovery-module--neutral-home-copy'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby="seasonal-discovery-heading"
      style={
        {
          '--seasonal-accent-eyebrow': collection.accent.eyebrow,
          '--seasonal-accent-bg': collection.accent.background,
          '--seasonal-accent-border': collection.accent.border,
          '--seasonal-accent-glow': collection.accent.glow,
          ...(collection.accent.title
            ? { '--seasonal-accent-title': collection.accent.title }
            : {}),
          ...(collection.accent.description
            ? { '--seasonal-accent-description': collection.accent.description }
            : {}),
          ...(collection.accent.cta ? { '--seasonal-accent-cta': collection.accent.cta } : {}),
        } as CSSProperties
      }
    >
      {isHomeBand ? (
        <div className="layout-container seasonal-discovery-module__band-inner">{shell}</div>
      ) : (
        shell
      )}
    </section>
  )

  if (isHomeBand) {
    return <div className="home-seasonal-band">{section}</div>
  }

  return section
}

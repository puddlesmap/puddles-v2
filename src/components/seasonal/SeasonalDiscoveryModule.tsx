import { useEffect, useRef, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { Event } from '../../types/event'
import { BrowseEventCard } from '../BrowseEventCard'
import type { SeasonalCollection } from '../../data/seasonalDiscovery'
import { seasonalCollectionPath } from '../../data/seasonalDiscovery'
import { SeasonalDiscoveryModuleHeader } from './SeasonalDiscoveryModuleHeader'
import {
  trackSeasonalBannerClicked,
  trackSeasonalBannerImpression,
  trackSeasonalCollectionEventOpened,
} from '../../utils/analytics'

interface SeasonalDiscoveryModuleProps {
  collection: SeasonalCollection
  events: Event[]
  onEventClick: (event: Event) => void
  className?: string
  /** Full-bleed home band — attached below nav announcement. */
  bandLayout?: 'default' | 'home'
  homeBandEyebrow?: 'subtitle' | 'timing'
  homeBandCopyTone?: 'seasonal' | 'neutral'
  /**
   * `map-sheet` — compact horizontal cards (mobile dock / map preview style).
   * Default is the full vertical Discovery card.
   */
  cardDensity?: 'default' | 'map-sheet'
  /** Override “today” for seasonal When (mockups / tests). */
  asOf?: Date
  /** Analytics placement — defaults from band layout. */
  analyticsPlacement?: string
  analyticsPage?: string
}

export function SeasonalDiscoveryModule({
  collection,
  events,
  onEventClick,
  className,
  bandLayout = 'default',
  homeBandEyebrow = 'subtitle',
  homeBandCopyTone = 'seasonal',
  cardDensity = 'default',
  asOf,
  analyticsPlacement,
  analyticsPage = 'home',
}: SeasonalDiscoveryModuleProps) {
  const isHomeBand = bandLayout === 'home'
  const isMapSheet = cardDensity === 'map-sheet'
  const isEmpty = events.length === 0
  const showCollectionLink = isEmpty || events.length >= 3
  const collectionHref = seasonalCollectionPath(collection.slug)
  const placement = analyticsPlacement ?? (isHomeBand ? 'home' : 'module')
  const rootRef = useRef<HTMLDivElement>(null)
  const impressedRef = useRef(false)

  useEffect(() => {
    if (!isHomeBand || impressedRef.current) return
    const node = rootRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        if (impressedRef.current) return
        const visible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.35)
        if (!visible) return
        impressedRef.current = true
        trackSeasonalBannerImpression({
          themeSlug: collection.slug,
          placement,
          page: analyticsPage,
        })
        observer.disconnect()
      },
      { threshold: [0, 0.35, 0.5] },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [analyticsPage, collection.slug, isHomeBand, placement])

  const trackBannerCta = () => {
    trackSeasonalBannerClicked({
      themeSlug: collection.slug,
      clickTarget: 'see_all',
      placement,
      page: analyticsPage,
    })
  }

  const handleEventClick = (event: Event) => {
    trackSeasonalCollectionEventOpened({
      event,
      themeSlug: collection.slug,
      placement,
      page: analyticsPage,
    })
    onEventClick(event)
  }

  const headerCta =
    isHomeBand && showCollectionLink
      ? { href: collectionHref, label: collection.ctaLabel, onClick: trackBannerCta }
      : undefined

  const headingId = `seasonal-discovery-heading-${collection.slug}${isMapSheet ? '-compact' : ''}`

  const shell = (
    <div className="seasonal-discovery-module__shell">
      <SeasonalDiscoveryModuleHeader
        collection={collection}
        headingId={headingId}
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
            isMapSheet ? 'seasonal-discovery-module__carousel-wrap--map-sheet' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div
            className={[
              'seasonal-discovery-module__carousel',
              isMapSheet ? 'seasonal-discovery-module__carousel--map-sheet' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            role="list"
          >
            {events.map((event) => (
              <div
                key={event.id}
                className={[
                  'seasonal-discovery-module__card',
                  isMapSheet ? 'seasonal-discovery-module__card--map-sheet' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                role="listitem"
              >
                <BrowseEventCard
                  event={event}
                  seasonalEditorial={false}
                  density={cardDensity}
                  asOf={asOf}
                  onClick={() => handleEventClick(event)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {!isHomeBand && showCollectionLink ? (
        <div className="seasonal-discovery-module__footer">
          <Link to={collectionHref} className="seasonal-discovery-module__cta" onClick={trackBannerCta}>
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
        isMapSheet ? 'seasonal-discovery-module--map-sheet' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={headingId}
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
    return (
      <div ref={rootRef} className="home-seasonal-band">
        {section}
      </div>
    )
  }

  return section
}

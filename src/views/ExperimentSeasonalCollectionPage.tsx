import type { CSSProperties } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { PageContainer } from '../components/layout/PageContainer'
import { BrowseEventCard } from '../components/BrowseEventCard'
import type { Event } from '../types/event'
import {
  getSeasonalCollection,
  isSeasonalCollectionSlug,
  resolveSeasonalEvents,
  type SeasonalCollection,
} from '../data/seasonalDiscovery'
import {
  PUDDLES_WORDMARK_LOGO_SRC,
  PUDDLES_WORDMARK_LOGO_SRC_2X,
} from './experimentShared'
import { useLaunchStagingCatalog } from '../context/LaunchStagingContext'
import { useEventNavigation } from '../hooks/useEventNavigation'

/** Soft night-sky sparkles for the Halloween collection page. */
const HALLOWEEN_SPARKLES = [
  { top: '8%', left: '6%', size: 2, delay: '0s', duration: '2.8s' },
  { top: '12%', left: '22%', size: 3, delay: '0.4s', duration: '3.4s' },
  { top: '5%', left: '41%', size: 2, delay: '1.1s', duration: '2.6s' },
  { top: '18%', left: '58%', size: 4, delay: '0.2s', duration: '3.8s' },
  { top: '9%', left: '74%', size: 2, delay: '1.6s', duration: '2.9s' },
  { top: '14%', left: '88%', size: 3, delay: '0.8s', duration: '3.2s' },
  { top: '28%', left: '12%', size: 2, delay: '1.3s', duration: '3.1s' },
  { top: '34%', left: '33%', size: 3, delay: '0.6s', duration: '2.7s' },
  { top: '26%', left: '49%', size: 2, delay: '2s', duration: '3.5s' },
  { top: '38%', left: '67%', size: 4, delay: '0.9s', duration: '4s' },
  { top: '31%', left: '84%', size: 2, delay: '1.8s', duration: '2.5s' },
  { top: '48%', left: '8%', size: 3, delay: '0.3s', duration: '3.3s' },
  { top: '52%', left: '27%', size: 2, delay: '1.4s', duration: '2.8s' },
  { top: '56%', left: '46%', size: 3, delay: '0.7s', duration: '3.6s' },
  { top: '44%', left: '71%', size: 2, delay: '1.9s', duration: '3s' },
  { top: '60%', left: '91%', size: 4, delay: '0.5s', duration: '3.9s' },
  { top: '72%', left: '15%', size: 2, delay: '1.2s', duration: '2.9s' },
  { top: '78%', left: '38%', size: 3, delay: '0.1s', duration: '3.4s' },
  { top: '68%', left: '55%', size: 2, delay: '1.7s', duration: '2.6s' },
  { top: '82%', left: '76%', size: 3, delay: '0.95s', duration: '3.7s' },
  { top: '88%', left: '4%', size: 2, delay: '1.5s', duration: '3.1s' },
  { top: '91%', left: '63%', size: 4, delay: '0.35s', duration: '4.1s' },
  { top: '86%', left: '94%', size: 2, delay: '2.1s', duration: '2.7s' },
  { top: '42%', left: '18%', size: 2, delay: '2.3s', duration: '3.2s' },
] as const

function SeasonalEventGrid({
  events,
  onEventClick,
  label,
}: {
  events: Event[]
  onEventClick: (event: Event) => void
  label: string
}) {
  if (events.length === 0) return null

  return (
    <div className="browse-content seasonal-collection-results" aria-label={label}>
      <div className="seasonal-collection-grid browse-event-grid">
        {events.map((event) => (
          <BrowseEventCard
            key={event.id}
            event={event}
            seasonalEditorial={false}
            onClick={() => onEventClick(event)}
          />
        ))}
      </div>
    </div>
  )
}

function HalloweenCollectionSections({
  collection,
  closeToHomeEvents,
  driveEvents,
  onEventClick,
}: {
  collection: SeasonalCollection
  closeToHomeEvents: Event[]
  driveEvents: Event[]
  onEventClick: (event: Event) => void
}) {
  const closeToHome = collection.closeToHome!
  const worthADrive = collection.worthADrive!

  return (
    <div className="seasonal-collection-sections">
      <section className="seasonal-collection-band" aria-labelledby="seasonal-close-to-home-heading">
        <header className="seasonal-collection-band__header">
          <h2 id="seasonal-close-to-home-heading" className="seasonal-collection-band__title">
            {closeToHome.title}
          </h2>
          <p className="seasonal-collection-band__subtitle">{closeToHome.subtitle}</p>
        </header>
        <SeasonalEventGrid
          events={closeToHomeEvents}
          onEventClick={onEventClick}
          label={`${closeToHome.title} activities`}
        />
      </section>

      {driveEvents.length > 0 ? (
        <section
          className="seasonal-collection-band seasonal-collection-band--secondary"
          aria-labelledby="seasonal-worth-a-drive-heading"
        >
          <header className="seasonal-collection-band__header">
            <h2 id="seasonal-worth-a-drive-heading" className="seasonal-collection-band__title">
              {worthADrive.title}
            </h2>
            <p className="seasonal-collection-band__subtitle">{worthADrive.subtitle}</p>
          </header>
          <SeasonalEventGrid
            events={driveEvents}
            onEventClick={onEventClick}
            label={`${worthADrive.title} activities`}
          />
        </section>
      ) : null}
    </div>
  )
}

export function ExperimentSeasonalCollectionPage() {
  const { slug } = useParams()
  const openEvent = useEventNavigation()
  const { getCatalog } = useLaunchStagingCatalog()
  const validSlug = isSeasonalCollectionSlug(slug) ? slug : null
  const collection = validSlug ? getSeasonalCollection(validSlug) : undefined

  const closeToHomeEvents = useMemo(() => {
    if (!collection) return []
    const driveIds = new Set(collection.driveEventIds ?? [])
    const closeIds = collection.collectionEventIds.filter((id) => !driveIds.has(id))
    return resolveSeasonalEvents(closeIds, getCatalog())
  }, [collection, getCatalog])

  const driveEvents = useMemo(
    () =>
      collection?.driveEventIds?.length
        ? resolveSeasonalEvents(collection.driveEventIds, getCatalog())
        : [],
    [collection, getCatalog],
  )

  if (!validSlug || !collection) {
    return <Navigate to="/experiment/seasonal-discovery" replace />
  }

  const isHalloween = collection.slug === 'halloween-with-little-ones'
  const isHelloFall = collection.slug === 'hello-fall'
  const hasGeographicSections = Boolean(collection.closeToHome && collection.worthADrive)
  const supportingLine = collection.slug === 'hello-fall' ? undefined : collection.title
  const showDescription = Boolean(collection.description)

  return (
    <div
      className={[
        'home-experiment-shell',
        'home-experiment-shell--refined',
        isHelloFall ? 'home-experiment-shell--hello-fall-collection home-experiment-shell--seasonal-puddles-aligned' : '',
        isHalloween ? 'home-experiment-shell--halloween-night' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        isHelloFall
          ? ({
              '--seasonal-accent-bg': collection.accent.background,
              '--seasonal-accent-eyebrow': collection.accent.eyebrow,
              '--seasonal-accent-border': collection.accent.border,
              '--seasonal-accent-glow': collection.accent.glow,
              '--seasonal-accent-title': collection.accent.title,
              '--seasonal-accent-description': collection.accent.description,
              '--seasonal-accent-cta': collection.accent.cta,
            } as CSSProperties)
          : undefined
      }
    >
      {isHalloween ? (
        <div className="halloween-sparkles" aria-hidden>
          {HALLOWEEN_SPARKLES.map((sparkle, index) => (
            <span
              key={index}
              className="halloween-sparkles__star"
              style={
                {
                  top: sparkle.top,
                  left: sparkle.left,
                  width: sparkle.size,
                  height: sparkle.size,
                  '--sparkle-delay': sparkle.delay,
                  '--sparkle-duration': sparkle.duration,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ) : null}

      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />

      <PageContainer
        className={[
          'seasonal-collection-page',
          'home-experiment-page--refined',
          'layout-container',
          isHelloFall ? 'seasonal-collection-page--hello-fall' : '',
          isHalloween ? 'seasonal-collection-page--halloween' : '',
          hasGeographicSections ? 'seasonal-collection-page--split' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div
          className="seasonal-collection-page__inner"
          style={
            {
              '--seasonal-accent-eyebrow': isHalloween
                ? '#f0b27a'
                : collection.accent.eyebrow,
              '--seasonal-accent-bg': collection.accent.background,
              '--seasonal-accent-border': collection.accent.border,
              '--seasonal-accent-glow': collection.accent.glow,
            } as CSSProperties
          }
        >
          <Link to="/experiment/seasonal-discovery" className="seasonal-collection-back">
            ← Back to seasonal discovery
          </Link>

          <header className="seasonal-collection-hero">
            <div className="seasonal-collection-hero__split">
              <div className="seasonal-collection-hero__copy">
                <p className="seasonal-collection-hero__eyebrow">{collection.timingLabel}</p>
                <h1 className="seasonal-collection-hero__title">{collection.subtitle}</h1>
                {supportingLine ? (
                  <p className="seasonal-collection-hero__subtitle">{supportingLine}</p>
                ) : null}
                {showDescription ? (
                  <p className="seasonal-collection-hero__description">{collection.description}</p>
                ) : null}
              </div>
              <img
                src={collection.illustrationSrc}
                alt=""
                className="seasonal-collection-hero__illustration"
                width={112}
                height={112}
                decoding="async"
              />
            </div>
          </header>

          {hasGeographicSections ? (
            <HalloweenCollectionSections
              collection={collection}
              closeToHomeEvents={closeToHomeEvents}
              driveEvents={driveEvents}
              onEventClick={(event) => openEvent(event, 'home', { viewMode: 'list' })}
            />
          ) : (
            <section
              className="browse-content seasonal-collection-results"
              aria-label={`${collection.subtitle} activities`}
            >
              <p className="seasonal-collection-results__count">
                {closeToHomeEvents.length === 1
                  ? '1 activity'
                  : `${closeToHomeEvents.length} activities`}
              </p>
              <div className="seasonal-collection-grid browse-event-grid">
                {closeToHomeEvents.map((event) => (
                  <BrowseEventCard
                    key={event.id}
                    event={event}
                    seasonalEditorial={false}
                    onClick={() => openEvent(event, 'home', { viewMode: 'list' })}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </PageContainer>

      <Footer fullBleed className="mt-0" />
    </div>
  )
}

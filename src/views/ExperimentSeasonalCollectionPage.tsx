import type { CSSProperties } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { partitionSeasonalTiming } from '../utils/seasonalWeekendBuckets'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { PageContainer } from '../components/layout/PageContainer'
import { BrowseEventCard } from '../components/BrowseEventCard'
import { SeasonalEmDashTagline } from '../components/seasonal/SeasonalDiscoveryModuleHeader'
import type { Event } from '../types/event'
import {
  getSeasonalCollection,
  isSeasonalCollectionSlug,
  resolveSeasonalEvents,
  type SeasonalCollection,
} from '../data/seasonalDiscovery'
import { sortSeasonalDiscoveryEvents } from '../utils/formatSeasonalSchedule'
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
            venueResponsive
            onClick={() => onEventClick(event)}
          />
        ))}
      </div>
    </div>
  )
}

type GeoTab = 'close' | 'drive'

function TimingGroups({
  events,
  onEventClick,
  geoLabel,
}: {
  events: Event[]
  onEventClick: (event: Event) => void
  geoLabel: string
}) {
  const { thisWeekend, later } = useMemo(() => partitionSeasonalTiming(events), [events])

  if (events.length === 0) {
    return <p className="seasonal-density-empty">No activities in this section right now.</p>
  }

  return (
    <>
      {thisWeekend.length > 0 ? (
        <section className="seasonal-density-group" aria-label={`${geoLabel} · This weekend`}>
          <h3 className="seasonal-density-group__title">This weekend</h3>
          <SeasonalEventGrid
            events={thisWeekend}
            onEventClick={onEventClick}
            label={`${geoLabel} this weekend`}
          />
        </section>
      ) : null}
      {later.length > 0 ? (
        <section className="seasonal-density-group" aria-label={`${geoLabel} · Later`}>
          <h3 className="seasonal-density-group__title">Later</h3>
          <SeasonalEventGrid
            events={later}
            onEventClick={onEventClick}
            label={`${geoLabel} later`}
          />
        </section>
      ) : null}
    </>
  )
}

function CollectionGeoTabs({
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
  const showDriveTab = driveEvents.length > 0
  const [tab, setTab] = useState<GeoTab>('close')
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)
  const activeTab = tab === 'drive' && showDriveTab ? 'drive' : 'close'
  const events = activeTab === 'drive' ? driveEvents : closeToHomeEvents
  const geoLabel = activeTab === 'drive' ? worthADrive.title : closeToHome.title
  const subtitle = activeTab === 'drive' ? worthADrive.subtitle : closeToHome.subtitle

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const rootPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    const offset = Math.round(rootPx * 3.75)
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { rootMargin: `-${offset}px 0px 0px 0px`, threshold: 0 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [showDriveTab])

  return (
    <div className="seasonal-collection-sections">
      {showDriveTab ? (
        <>
          <div ref={sentinelRef} className="seasonal-density-tabs__sentinel" aria-hidden="true" />
          <div
            className={`seasonal-density-tabs seasonal-density-tabs--mobile seasonal-density-tabs--fall-frost${stuck ? ' is-stuck' : ''}`}
          >
            <div className="seasonal-density-tabs__list" role="tablist" aria-label="Seasonal areas">
              <button
                type="button"
                role="tab"
                id="seasonal-density-tab-close"
                aria-selected={activeTab === 'close'}
                aria-controls="seasonal-density-tab-panel"
                className="seasonal-density-tabs__tab"
                onClick={() => setTab('close')}
              >
                {closeToHome.title}
              </button>
              <button
                type="button"
                role="tab"
                id="seasonal-density-tab-drive"
                aria-selected={activeTab === 'drive'}
                aria-controls="seasonal-density-tab-panel"
                className="seasonal-density-tabs__tab"
                onClick={() => setTab('drive')}
              >
                {worthADrive.title}
              </button>
            </div>
          </div>
        </>
      ) : null}

      <div
        className="seasonal-density-mobile-panel"
        id="seasonal-density-tab-panel"
        role="tabpanel"
        aria-labelledby={
          activeTab === 'drive' ? 'seasonal-density-tab-drive' : 'seasonal-density-tab-close'
        }
      >
        <header className="seasonal-collection-band__header">
          <h2 className="seasonal-collection-band__title">{geoLabel}</h2>
          <p className="seasonal-collection-band__subtitle">{subtitle}</p>
        </header>
        <TimingGroups events={events} onEventClick={onEventClick} geoLabel={geoLabel} />
      </div>

      {showDriveTab ? (
        <div className="seasonal-density-desktop-stack">
          <section className="seasonal-collection-band" aria-labelledby="seasonal-close-to-home-heading">
            <header className="seasonal-collection-band__header">
              <h2 id="seasonal-close-to-home-heading" className="seasonal-collection-band__title">
                {closeToHome.title}
              </h2>
              <p className="seasonal-collection-band__subtitle">{closeToHome.subtitle}</p>
            </header>
            <TimingGroups
              events={closeToHomeEvents}
              onEventClick={onEventClick}
              geoLabel={closeToHome.title}
            />
          </section>
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
            <TimingGroups
              events={driveEvents}
              onEventClick={onEventClick}
              geoLabel={worthADrive.title}
            />
          </section>
        </div>
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
    return sortSeasonalDiscoveryEvents(resolveSeasonalEvents(closeIds, getCatalog()))
  }, [collection, getCatalog])

  const driveEvents = useMemo(
    () =>
      collection?.driveEventIds?.length
        ? sortSeasonalDiscoveryEvents(
            resolveSeasonalEvents(collection.driveEventIds, getCatalog()),
          )
        : [],
    [collection, getCatalog],
  )

  if (!validSlug || !collection) {
    return <Navigate to="/" replace />
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
          <Link to="/" className="seasonal-collection-back">
            ← Back home
          </Link>

          <header className="seasonal-collection-hero">
            <p className="seasonal-collection-hero__eyebrow">{collection.timingLabel}</p>
            <div className="seasonal-collection-hero__title-row">
              <h1 className="seasonal-collection-hero__title">{collection.subtitle}</h1>
              <img
                src={collection.illustrationSrc}
                alt=""
                className="seasonal-collection-hero__illustration"
                width={52}
                height={52}
                decoding="async"
              />
            </div>
            {supportingLine ? (
              <p className="seasonal-collection-hero__subtitle">{supportingLine}</p>
            ) : null}
            {showDescription ? (
              <SeasonalEmDashTagline
                text={collection.description}
                className="seasonal-collection-hero__description"
              />
            ) : null}
          </header>

          {hasGeographicSections ? (
            <CollectionGeoTabs
              collection={collection}
              closeToHomeEvents={closeToHomeEvents}
              driveEvents={driveEvents}
              onEventClick={(event) => openEvent(event, 'home', { viewMode: 'list' })}
            />
          ) : (
            <TimingGroups
              events={closeToHomeEvents}
              onEventClick={(event) => openEvent(event, 'home', { viewMode: 'list' })}
              geoLabel={collection.subtitle}
            />
          )}
        </div>
      </PageContainer>

      <Footer fullBleed className="mt-0" />
    </div>
  )
}

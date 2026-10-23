import type { CSSProperties } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
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
import { partitionSeasonalTiming } from '../utils/seasonalWeekendBuckets'
import {
  PUDDLES_WORDMARK_LOGO_SRC,
  PUDDLES_WORDMARK_LOGO_SRC_2X,
} from './experimentShared'
import { HalloweenNightSparkles } from '../components/seasonal/HalloweenNightSparkles'
import { LocalGuideCardVariant, parseGuideCard } from '../components/guides/LocalGuideCard'
import { useLaunchStagingCatalog } from '../context/LaunchStagingContext'
import { useEventNavigation } from '../hooks/useEventNavigation'
import './guide-page.css'

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

function TimingGroups({
  events,
  onEventClick,
  geoLabel,
}: {
  events: Event[]
  onEventClick: (event: Event) => void
  geoLabel: string
}) {
  const { thisWeek, later } = useMemo(() => partitionSeasonalTiming(events), [events])

  if (events.length === 0) return null

  return (
    <>
      {thisWeek.length > 0 ? (
        <section className="seasonal-density-group" aria-label={`${geoLabel} · This week`}>
          <h3 className="seasonal-density-group__title">This week</h3>
          <SeasonalEventGrid
            events={thisWeek}
            onEventClick={onEventClick}
            label={`${geoLabel} this week`}
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

type GeoTab = 'close' | 'drive'

function SeasonalGeoPill({
  closeTitle,
  driveTitle,
  activeTab,
  onChange,
}: {
  closeTitle: string
  driveTitle: string
  activeTab: GeoTab
  onChange: (tab: GeoTab) => void
}) {
  return (
    <div className="seasonal-density-tabs seasonal-density-tabs--mobile seasonal-density-tabs--in-header seasonal-density-tabs--fall-frost">
      <div className="seasonal-density-tabs__list" role="tablist" aria-label="Seasonal areas">
        <button
          type="button"
          role="tab"
          id="seasonal-density-tab-close"
          aria-selected={activeTab === 'close'}
          aria-controls="seasonal-density-tab-panel"
          className="seasonal-density-tabs__tab"
          onClick={() => onChange('close')}
        >
          {closeTitle}
        </button>
        <button
          type="button"
          role="tab"
          id="seasonal-density-tab-drive"
          aria-selected={activeTab === 'drive'}
          aria-controls="seasonal-density-tab-panel"
          className="seasonal-density-tabs__tab"
          onClick={() => onChange('drive')}
        >
          {driveTitle}
        </button>
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
        <TimingGroups
          events={closeToHomeEvents}
          onEventClick={onEventClick}
          geoLabel={closeToHome.title}
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
          <TimingGroups
            events={driveEvents}
            onEventClick={onEventClick}
            geoLabel={worthADrive.title}
          />
        </section>
      ) : null}
    </div>
  )
}

export function ExperimentSeasonalCollectionPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const guideCard = parseGuideCard(searchParams.get('card'))
  const [geoTab, setGeoTab] = useState<GeoTab>('close')
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
  const supportingLine =
    collection.slug === 'hello-fall' || collection.slug === 'halloween-with-little-ones'
      ? undefined
      : collection.title
  const showDescription = Boolean(collection.description)
  const showGeoToggle = isHalloween && driveEvents.length > 0
  const activeGeoTab: GeoTab = geoTab === 'drive' && showGeoToggle ? 'drive' : 'close'
  const activeGeo = activeGeoTab === 'drive' ? collection.worthADrive : collection.closeToHome
  const activeGeoEvents = activeGeoTab === 'drive' ? driveEvents : closeToHomeEvents

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
      {isHalloween ? <HalloweenNightSparkles /> : null}

      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
        below={
          showGeoToggle && activeGeo ? (
            <SeasonalGeoPill
              closeTitle={collection.closeToHome!.title}
              driveTitle={collection.worthADrive!.title}
              activeTab={activeGeoTab}
              onChange={setGeoTab}
            />
          ) : null
        }
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

          {isHalloween ? <LocalGuideCardVariant variant={guideCard ?? 4} /> : null}

          {hasGeographicSections ? (
            <>
              {showGeoToggle && activeGeo ? (
                <div
                  className="seasonal-density-mobile-panel"
                  id="seasonal-density-tab-panel"
                  role="tabpanel"
                  aria-labelledby={
                    activeGeoTab === 'drive'
                      ? 'seasonal-density-tab-drive'
                      : 'seasonal-density-tab-close'
                  }
                >
                  <header className="seasonal-collection-band__header">
                    <h2 className="seasonal-collection-band__title">{activeGeo.title}</h2>
                    <p className="seasonal-collection-band__subtitle">{activeGeo.subtitle}</p>
                  </header>
                  <TimingGroups
                    events={activeGeoEvents}
                    onEventClick={(event) => openEvent(event, 'home', { viewMode: 'list' })}
                    geoLabel={activeGeo.title}
                  />
                </div>
              ) : null}
              <div className={showGeoToggle ? 'seasonal-density-desktop-stack' : undefined}>
                <HalloweenCollectionSections
                  collection={collection}
                  closeToHomeEvents={closeToHomeEvents}
                  driveEvents={driveEvents}
                  onEventClick={(event) => openEvent(event, 'home', { viewMode: 'list' })}
                />
              </div>
            </>
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

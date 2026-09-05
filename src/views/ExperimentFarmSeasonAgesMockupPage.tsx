import { useMemo, useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrowseEventCard } from '../components/BrowseEventCard'
import { SharedEventUrlPage } from '../components/event-detail/SharedEventUrlPage'
import { Footer } from '../components/layout/Footer'
import { AppHeader } from '../components/layout/AppHeader'
import { PageContainer } from '../components/layout/PageContainer'
import { HomeLaunchAnnouncement } from '../components/home/HomeLaunchAnnouncement'
import { SeasonalDiscoveryModule } from '../components/seasonal/SeasonalDiscoveryModule'
import { SeasonalEmDashTagline } from '../components/seasonal/SeasonalDiscoveryModuleHeader'
import {
  getSeasonalCollection,
  resolveFeaturedSeasonalEvents,
  resolveSeasonalEvents,
} from '../data/seasonalDiscovery'
import { HELLO_FALL_DRIVE_EVENTS } from '../data/seasonalHelloFallDriveEvents'
import { getPublicEventsFromCatalog } from '../data/events'
import { filterEvents } from '../utils/filters'
import { sortSeasonalDiscoveryEvents } from '../utils/formatSeasonalSchedule'
import { HOME_PAGE_HEADLINE } from './homeExperimentAccentShared'
import type { Event } from '../types/event'
import {
  PUDDLES_WORDMARK_LOGO_SRC,
  PUDDLES_WORDMARK_LOGO_SRC_2X,
} from './experimentShared'
import './shared-event-design-layouts.css'

type Screen = 'home' | 'collection' | 'event'

type GuideScenario = {
  id: string
  label: string
  asOfYmd: string
  eventKey: 'lemos-farm' | 'spina-farms' | 'farmer-johns'
  note: string
}

const GUIDE_SCENARIOS: GuideScenario[] = [
  {
    id: 'lemos-before',
    label: 'Lemos · before',
    asOfYmd: '2026-09-04',
    eventKey: 'lemos-farm',
    note: 'Opens TOMORROW · Weekends · Through Nov 15',
  },
  {
    id: 'lemos-open',
    label: 'Lemos · open',
    asOfYmd: '2026-10-10',
    eventKey: 'lemos-farm',
    note: 'Open TODAY · Through Nov 15',
  },
  {
    id: 'spina-before',
    label: 'Spina · before',
    asOfYmd: '2026-09-04',
    eventKey: 'spina-farms',
    note: 'Opens Sep 17 · Daily · Through Nov 2',
  },
  {
    id: 'fj-active',
    label: "FJ · no close",
    asOfYmd: '2026-09-04',
    eventKey: 'farmer-johns',
    note: 'Open TODAY · Daily 9–6 · no Through',
  },
]

function asOf(ymd: string): Date {
  return new Date(`${ymd}T12:00:00-07:00`)
}

function findDrive(idPart: string): Event {
  const event = HELLO_FALL_DRIVE_EVENTS.find((row) => row.id.includes(idPart))
  if (!event) throw new Error(`Missing drive event: ${idPart}`)
  return event
}

const SCREEN_LABELS: Record<Screen, string> = {
  home: 'Home',
  collection: 'Hello Fall',
  event: 'Event page',
}

/**
 * Realistic website preview using production Puddles chrome
 * (header, Hello Fall band, collection page, event detail).
 */
export function ExperimentFarmSeasonAgesMockupPage() {
  const navigate = useNavigate()
  const [screen, setScreen] = useState<Screen>('event')
  const [scenarioId, setScenarioId] = useState(GUIDE_SCENARIOS[0].id)
  const scenario = GUIDE_SCENARIOS.find((row) => row.id === scenarioId) ?? GUIDE_SCENARIOS[0]
  const [detailEventId, setDetailEventId] = useState(() => findDrive(scenario.eventKey).id)
  const today = useMemo(() => asOf(scenario.asOfYmd), [scenario.asOfYmd])

  function applyScenario(next: GuideScenario) {
    setScenarioId(next.id)
    setDetailEventId(findDrive(next.eventKey).id)
    setScreen('event')
  }

  const collection = getSeasonalCollection('hello-fall')
  const featuredEvents = useMemo(
    () => (collection ? resolveFeaturedSeasonalEvents(collection, undefined, today) : []),
    [collection, today],
  )

  const closeToHomeEvents = useMemo(() => {
    if (!collection) return []
    const driveIds = new Set(collection.driveEventIds ?? [])
    const closeIds = collection.collectionEventIds.filter((id) => !driveIds.has(id))
    return sortSeasonalDiscoveryEvents(resolveSeasonalEvents(closeIds), today)
  }, [collection, today])

  const driveEvents = useMemo(() => {
    if (!collection?.driveEventIds?.length) return []
    return sortSeasonalDiscoveryEvents(
      resolveSeasonalEvents(collection.driveEventIds),
      today,
    )
  }, [collection, today])

  const todayEvents = useMemo(() => {
    return filterEvents(getPublicEventsFromCatalog(), {
      temporalTab: 'today',
    }).slice(0, 4)
  }, [])

  const lemos = findDrive('lemos-farm')
  const farmerJohn = findDrive('farmer-johns')
  const spina = findDrive('spina-farms')
  const detailEvent =
    [lemos, farmerJohn, spina].find((row) => row.id === detailEventId) ?? lemos

  function openEvent(event: Event) {
    setDetailEventId(event.id)
    setScreen('event')
  }

  const switcher = (
    <div className="sedl-switcher" role="navigation" aria-label="Mockup screens">
      <p className="sedl-switcher__label">
        Website preview · as of {scenario.asOfYmd.slice(5).replace('-', '/')} · {scenario.note}
      </p>
      <div className="sedl-switcher__tabs" role="tablist" aria-label="Guide scenarios">
        {GUIDE_SCENARIOS.map((row) => (
          <button
            key={row.id}
            type="button"
            role="tab"
            aria-selected={scenarioId === row.id}
            className={
              scenarioId === row.id
                ? 'sedl-switcher__tab sedl-switcher__tab--active'
                : 'sedl-switcher__tab'
            }
            onClick={() => applyScenario(row)}
          >
            {row.label}
          </button>
        ))}
      </div>
      <div className="sedl-switcher__tabs" role="tablist">
        {(Object.keys(SCREEN_LABELS) as Screen[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={screen === key}
            className={
              screen === key ? 'sedl-switcher__tab sedl-switcher__tab--active' : 'sedl-switcher__tab'
            }
            onClick={() => setScreen(key)}
          >
            {SCREEN_LABELS[key]}
          </button>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: '0.75rem', color: '#717171' }}>
        Real Puddles layout ·{' '}
        <Link to="/experiment/seasonal-discovery/hello-fall">live collection</Link>
        {' · '}
        <Link to={`/event/${lemos.id}`}>live Lemos</Link>
      </p>
    </div>
  )

  if (screen === 'home' && collection) {
    return (
      <>
        {switcher}
        <div className="home-experiment-shell home-experiment-shell--refined home-experiment-shell--seasonal-puddles-aligned">
          <AppHeader
            logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
            logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
            showBrandName={false}
          />
          <HomeLaunchAnnouncement />
          <SeasonalDiscoveryModule
            collection={collection}
            events={featuredEvents}
            onEventClick={openEvent}
            bandLayout="home"
            homeBandEyebrow="timing"
            homeBandCopyTone="neutral"
            asOf={today}
          />
          <PageContainer className="home-experiment-page home-experiment-page--refined home-experiment-page--seasonal-discovery layout-container">
            <header className="home-experiment-hero home-experiment-hero--refined">
              <h1 className="home-experiment-headline home-experiment-headline--refined">
                {HOME_PAGE_HEADLINE}
              </h1>
              <p className="home-experiment-supporting home-experiment-supporting--refined">
                Scroll the Hello Fall band above — card When shows the next open day + hours only.
                Tap a farm card to open the event page.
              </p>
            </header>

            <section className="browse-content" aria-label="Today’s activities">
              <p className="home-experiment-results-label">Today</p>
              <div className="browse-event-grid">
                {todayEvents.map((event) => (
                  <BrowseEventCard
                    key={event.id}
                    event={event}
                    asOf={today}
                    onClick={() => openEvent(event)}
                  />
                ))}
              </div>
            </section>
          </PageContainer>
          <Footer fullBleed className="mt-0" />
        </div>
      </>
    )
  }

  if (screen === 'collection' && collection) {
    return (
      <>
        {switcher}
        <div
          className="home-experiment-shell home-experiment-shell--refined home-experiment-shell--hello-fall-collection home-experiment-shell--seasonal-puddles-aligned"
          style={
            {
              '--seasonal-accent-bg': collection.accent.background,
              '--seasonal-accent-eyebrow': collection.accent.eyebrow,
              '--seasonal-accent-border': collection.accent.border,
              '--seasonal-accent-glow': collection.accent.glow,
              '--seasonal-accent-title': collection.accent.title,
              '--seasonal-accent-description': collection.accent.description,
              '--seasonal-accent-cta': collection.accent.cta,
            } as CSSProperties
          }
        >
          <AppHeader
            logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
            logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
            showBrandName={false}
          />
          <PageContainer className="seasonal-collection-page home-experiment-page--refined layout-container seasonal-collection-page--hello-fall seasonal-collection-page--split">
            <div
              className="seasonal-collection-page__inner"
              style={
                {
                  '--seasonal-accent-eyebrow': collection.accent.eyebrow,
                  '--seasonal-accent-bg': collection.accent.background,
                  '--seasonal-accent-border': collection.accent.border,
                  '--seasonal-accent-glow': collection.accent.glow,
                } as CSSProperties
              }
            >
              <button
                type="button"
                className="seasonal-collection-back"
                onClick={() => setScreen('home')}
              >
                ← Back home
              </button>

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
                {collection.description ? (
                  <SeasonalEmDashTagline
                    text={collection.description}
                    className="seasonal-collection-hero__description"
                  />
                ) : null}
              </header>

              <div className="seasonal-collection-sections">
                <section
                  className="seasonal-collection-band"
                  aria-labelledby="mock-close-to-home-heading"
                >
                  <header className="seasonal-collection-band__header">
                    <h2
                      id="mock-close-to-home-heading"
                      className="seasonal-collection-band__title"
                    >
                      {collection.closeToHome?.title ?? 'Close to home'}
                    </h2>
                    <p className="seasonal-collection-band__subtitle">
                      {collection.closeToHome?.subtitle}
                    </p>
                  </header>
                  <div
                    className="browse-content seasonal-collection-results"
                    aria-label="Close to home activities"
                  >
                    <div className="seasonal-collection-grid browse-event-grid">
                      {closeToHomeEvents.map((event) => (
                        <BrowseEventCard
                          key={event.id}
                          event={event}
                          seasonalEditorial={false}
                          asOf={today}
                          onClick={() => openEvent(event)}
                        />
                      ))}
                    </div>
                  </div>
                </section>

                <section
                  className="seasonal-collection-band seasonal-collection-band--secondary"
                  aria-labelledby="mock-worth-a-drive-heading"
                >
                  <header className="seasonal-collection-band__header">
                    <h2
                      id="mock-worth-a-drive-heading"
                      className="seasonal-collection-band__title"
                    >
                      {collection.worthADrive?.title ?? 'Worth a little drive'}
                    </h2>
                    <p className="seasonal-collection-band__subtitle">
                      {collection.worthADrive?.subtitle}
                    </p>
                  </header>
                  <div
                    className="browse-content seasonal-collection-results"
                    aria-label="Worth a drive activities"
                  >
                    <div className="seasonal-collection-grid browse-event-grid">
                      {driveEvents.map((event) => (
                        <BrowseEventCard
                          key={event.id}
                          event={event}
                          seasonalEditorial={false}
                          asOf={today}
                          onClick={() => openEvent(event)}
                        />
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </PageContainer>
          <Footer fullBleed className="mt-0" />
        </div>
      </>
    )
  }

  return (
    <>
      {switcher}
      <div className="sedl-switcher" style={{ top: '7.1rem' }}>
        <p className="sedl-switcher__label">Farm event</p>
        <div className="sedl-switcher__tabs" role="tablist" aria-label="Farm event">
          {[lemos, farmerJohn, spina].map((event) => (
            <button
              key={event.id}
              type="button"
              role="tab"
              aria-selected={detailEvent.id === event.id}
              className={
                detailEvent.id === event.id
                  ? 'sedl-switcher__tab sedl-switcher__tab--active'
                  : 'sedl-switcher__tab'
              }
              onClick={() => {
                setDetailEventId(event.id)
                const match = GUIDE_SCENARIOS.find(
                  (row) =>
                    findDrive(row.eventKey).id === event.id && row.asOfYmd === scenario.asOfYmd,
                )
                if (match) setScenarioId(match.id)
              }}
            >
              {event.title.replace(/ Fall Pumpkin Patch| Pumpkin Farm| Pumpkin Patch/g, '')}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="sedl-switcher__tab"
          onClick={() => navigate(`/event/${detailEvent.id}`)}
        >
          Open live URL →
        </button>
      </div>
      <SharedEventUrlPage
        event={detailEvent}
        lifecycleNow={today}
        hasInAppReturn
        onClose={() => setScreen('collection')}
        analyticsSource="discovery"
      />
    </>
  )
}

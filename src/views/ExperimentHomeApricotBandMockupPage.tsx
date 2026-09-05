import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { HomeExperimentPage } from './HomeExperimentPage'
import { SeasonalDiscoveryModule } from '../components/seasonal/SeasonalDiscoveryModule'
import { HomeLaunchAnnouncement } from '../components/home/HomeLaunchAnnouncement'
import { BrowseEventCard } from '../components/BrowseEventCard'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import {
  explainFeaturedHomeSelection,
  getActiveSeasonalCollection,
  resolveFeaturedSeasonalEvents,
  resolveSeasonalEvents,
} from '../data/seasonalDiscovery'
import { HELLO_FALL_DRIVE_EVENTS } from '../data/seasonalHelloFallDriveEvents'
import { useEventNavigation } from '../hooks/useEventNavigation'
import { eventToBrowseCard } from '../utils/browseEventCard'
import { formatDiscoveryWhen } from '../utils/formatSeasonalSchedule'
import type { Event } from '../types/event'
import { DiscoveryV3Card } from '../components/experiment/DiscoveryV3Card'
import './experiment-home-apricot-band.css'

const FALL_WASH = '#ffd8a8'

const FARMER_JOHN =
  HELLO_FALL_DRIVE_EVENTS.find((event) => event.id.includes('farmer-johns')) ??
  HELLO_FALL_DRIVE_EVENTS[0]

const LONG_RUNNING_SPECIMENS: { asOf: string; label: string }[] = [
  { asOf: '2026-09-02', label: 'As of Sep 2' },
  { asOf: '2026-09-03', label: 'As of Sep 3' },
  { asOf: '2026-09-04', label: 'As of Sep 4' },
  { asOf: '2026-09-05', label: 'As of Sep 5' },
]

const ONE_TIME_SAMPLE: Event = {
  id: 'mockup-one-time-harvest-story',
  title: 'Mid-Autumn story celebration',
  description: 'One-time community event — keeps the normal date format.',
  venue: 'Linden Tree Books',
  address: 'Local',
  city: 'Los Altos',
  date: '2026-09-12',
  startTime: '10:30',
  endTime: '11:30',
  ageRange: '0–5',
  ageMin: 0,
  ageMax: 5,
  types: ['Stories'],
  categoryTags: [],
  cost: 'Free',
  imageUrl: '/event-fallbacks/stories.png',
  eventUrl: '#',
  verifiedDate: '2026-09-01',
  lat: 37.385,
  lng: -122.114,
  status: 'Published',
  isPast: false,
  isLive: true,
}

const META_SCROLL_SAMPLE: Event = {
  ...ONE_TIME_SAMPLE,
  id: 'mockup-meta-scroll-sample',
  title: 'Community festival with a very long title for layout',
  city: 'Mountain View',
  types: ['Festivals & Community'],
  imageUrl: '/event-fallbacks/festivals.png',
}

function asOfDate(ymd: string): Date {
  return new Date(`${ymd}T12:00:00`)
}

/**
 * Combined review mockup: #ffd8a8 wash, max-4 band, mix rules,
 * scrollable meta pills, and Opens TOMORROW / Open TODAY specimens.
 */
export function ExperimentHomeApricotBandMockupPage() {
  const openEvent = useEventNavigation()
  const collection = getActiveSeasonalCollection()
  const featuredEvents = useMemo(
    () => (collection ? resolveFeaturedSeasonalEvents(collection) : []),
    [collection],
  )
  const explanation = useMemo(
    () => (collection ? explainFeaturedHomeSelection(collection) : null),
    [collection],
  )
  const eventsById = useMemo(() => {
    if (!collection || !explanation) return new Map<string, Event>()
    const ids = explanation.active.map((row) => row.eventId)
    const events = resolveSeasonalEvents(ids)
    return new Map(events.map((event) => [event.id, event]))
  }, [collection, explanation])

  const driveIdSet = useMemo(
    () => new Set(collection?.driveEventIds ?? []),
    [collection],
  )
  const closeIdSet = useMemo(
    () => new Set(collection?.collectionEventIds ?? []),
    [collection],
  )

  const leading = (
    <div className="home-apricot-mockup-rules" aria-labelledby="featured-rules-heading">
      <div className="home-apricot-mockup-rules__intro">
        <p className="home-apricot-mockup-rules__eyebrow">Mockup · full Hello Fall review</p>
        <h1 id="featured-rules-heading" className="home-apricot-mockup-rules__title">
          Home band + long-running dates + meta scroll
        </h1>
        <p className="home-apricot-mockup-rules__lede">
          Wash <code>{FALL_WASH}</code> · all active featured windows · Pacific today{' '}
          <code>{explanation?.today ?? '—'}</code>. Compare{' '}
          <Link to="/">production home</Link>
          {' · '}
          <Link to="/experiment/seasonal-discovery/hello-fall">Hello Fall discovery</Link>.
        </p>
      </div>

      <ol className="home-apricot-mockup-rules__steps">
        <li>
          <strong>Featured mix</strong> — coming-up close to home first, at most one worth-a-drive
          (no hard card-count cap).
        </li>
        <li>
          <strong>Long-running</strong> — farms use <code>Opens TOMORROW</code> /{' '}
          <code>Open TODAY</code> / <code>Open daily</code> (never invent a close date).
        </li>
        <li>
          <strong>Meta pills</strong> — place / age / price / type scroll horizontally when clipped.
        </li>
      </ol>

      {explanation ? (
        <div className="home-apricot-mockup-rules__live">
          <div className="home-apricot-mockup-rules__col">
            <h2 className="home-apricot-mockup-rules__col-title">
              Showing on Home ({explanation.selected.length})
            </h2>
            <ol className="home-apricot-mockup-rules__list">
              {explanation.selected.map((row) => {
                const event = eventsById.get(row.eventId)
                const bucket = driveIdSet.has(row.eventId)
                  ? 'drive'
                  : closeIdSet.has(row.eventId)
                    ? 'close'
                    : 'other'
                return (
                  <li key={row.eventId}>
                    <span className="home-apricot-mockup-rules__event">
                      {event?.title || row.eventId}
                    </span>
                    <span className={`home-apricot-mockup-rules__tag home-apricot-mockup-rules__tag--${bucket}`}>
                      {bucket}
                    </span>
                    {row.anchor ? (
                      <span className="home-apricot-mockup-rules__tag">anchor</span>
                    ) : null}
                    <span className="home-apricot-mockup-rules__meta">
                      {row.featuredFrom} → {row.featuredUntil}
                      {row.note ? ` · ${row.note}` : ''}
                    </span>
                  </li>
                )
              })}
            </ol>
          </div>
          <div className="home-apricot-mockup-rules__col">
            <h2 className="home-apricot-mockup-rules__col-title">Truncated by cap</h2>
            <p className="home-apricot-mockup-rules__empty">None — Home featured has no card-count cap.</p>
          </div>
        </div>
      ) : (
        <p className="home-apricot-mockup-rules__empty">No active seasonal collection right now.</p>
      )}

      <section
        className="home-apricot-mockup-specimens"
        aria-labelledby="long-running-specimens-heading"
      >
        <h2 id="long-running-specimens-heading" className="home-apricot-mockup-rules__col-title">
          Long-running date labels — Farmer John’s (card = detail copy)
        </h2>
        <p className="home-apricot-mockup-rules__meta">
          Official open Fri Sep 4 · no published close · hours 9 AM–5 PM
        </p>
        <div className="home-apricot-mockup-specimens__grid">
          {LONG_RUNNING_SPECIMENS.map((specimen) => {
            const when = formatDiscoveryWhen(FARMER_JOHN, asOfDate(specimen.asOf))
            const card = {
              ...eventToBrowseCard(FARMER_JOHN, null, asOfDate(specimen.asOf)),
              when: when.line,
            }
            return (
              <div key={specimen.asOf} className="home-apricot-mockup-specimens__item">
                <p className="home-apricot-mockup-specimens__label">{specimen.label}</p>
                <p className="home-apricot-mockup-specimens__when">
                  <strong>{when.primary}</strong>
                  {when.secondary ? <span> · {when.secondary}</span> : null}
                </p>
                <div className="home-apricot-mockup-specimens__card">
                  <DiscoveryV3Card {...card} compactPillars bodyLayout="city-soft" />
                </div>
                <p className="home-apricot-mockup-specimens__detail">
                  Detail date line: <code>{when.line}</code>
                </p>
              </div>
            )
          })}
          <div className="home-apricot-mockup-specimens__item">
            <p className="home-apricot-mockup-specimens__label">One-time contrast</p>
            <p className="home-apricot-mockup-specimens__when">
              <strong>{formatDiscoveryWhen(ONE_TIME_SAMPLE).primary}</strong>
            </p>
            <div className="home-apricot-mockup-specimens__card">
              <BrowseEventCard event={ONE_TIME_SAMPLE} seasonalEditorial={false} />
            </div>
          </div>
        </div>
      </section>

      <section
        className="home-apricot-mockup-specimens home-apricot-mockup-specimens--meta"
        aria-labelledby="meta-scroll-heading"
      >
        <h2 id="meta-scroll-heading" className="home-apricot-mockup-rules__col-title">
          Meta pills — scroll when place / age / price / type are clipped
        </h2>
        <p className="home-apricot-mockup-rules__meta">
          Narrow the card or use a long type label — fade means more to the right; drag or
          shift-scroll horizontally.
        </p>
        <div className="home-apricot-mockup-specimens__meta-card">
          <BrowseEventCard event={META_SCROLL_SAMPLE} seasonalEditorial={false} />
        </div>
      </section>
    </div>
  )

  const persimmonCollection = collection
    ? {
        ...collection,
        accent: {
          ...collection.accent,
          background: FALL_WASH,
          border: '#f0c080',
          glow: 'rgba(255, 216, 168, 0.32)',
        },
      }
    : null

  return (
    <HomeExperimentPage
      pageClassName="home-experiment-page--refined home-experiment-page--seasonal-discovery home-experiment-page--planetbox-band home-experiment-page--apricot-band-mockup"
      shellClassName="home-experiment-shell--refined home-experiment-shell--seasonal-puddles-aligned home-experiment-shell--apricot-band-mockup"
      heroVariant="refined"
      layout="refined"
      logoOnly={false}
      logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
      logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
      showBrandName={false}
      headerBelow={<HomeLaunchAnnouncement />}
      leading={leading}
      topBand={
        persimmonCollection ? (
          <SeasonalDiscoveryModule
            collection={persimmonCollection}
            events={featuredEvents}
            onEventClick={(event) => openEvent(event, 'home', { viewMode: 'list' })}
            bandLayout="home"
            homeBandEyebrow="timing"
            homeBandCopyTone="neutral"
          />
        ) : null
      }
    />
  )
}

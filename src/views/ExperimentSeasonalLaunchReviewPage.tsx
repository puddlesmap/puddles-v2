import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { PageContainer } from '../components/layout/PageContainer'
import { Footer } from '../components/layout/Footer'
import { EventDetailLink } from '../components/EventDetailLink'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import type { Event } from '../types/event'
import { isOfficialEventUrl } from '../utils/eventPages'
import {
  formatSeasonalDateRange,
  getAllFeaturedCandidateIds,
  getSeasonalCollection,
  getSeasonalFeaturedWindowStatus,
  HELLO_FALL_DISCOVERY_PIPELINE,
  resolveFeaturedSeasonalEvents,
  resolveSeasonalEvents,
} from '../data/seasonalDiscovery'
import { useLaunchStagingCatalog } from '../context/LaunchStagingContext'
import { getLaunchStagingEvents } from '../utils/launchStagingCatalog'
import { getUnaddedDiscoveryReviewEvents } from '../utils/launchReviewDiscovery'

const collection = getSeasonalCollection('hello-fall')!

const PHASE_C_LINKS = [
  { href: '/experiment/home-launch-preview', label: 'Home launch preview' },
  { href: '/experiment/seasonal-discovery/hello-fall', label: 'Hello Fall collection' },
  { href: '/sunnyvale', label: 'Sunnyvale city landing' },
  { href: '/browse?city=Sunnyvale', label: 'Browse · Sunnyvale' },
  { href: '/browse?types=Parent+%26+Me', label: 'Browse · Parent & Me' },
  { href: '/browse?types=Festivals+%26+Community', label: 'Browse · Festivals & Community' },
  { href: '/experiment/launch-expand-mockup', label: 'Launch expand mockup' },
] as const

const APPROVAL_CHECKLIST = [
  'Sunnyvale shows ≥1 event in Hello Fall close-to-home grid',
  'Diwali + Sunnyvale Mid-Autumn appear on Hello Fall (through Oct 5)',
  'Worth a drive includes CDM Mid-Autumn, Chuseok, SF Chinatown Moon Festival',
  'Parent & Me filter returns staged FIT4MOM / Marti / Mini Yoga rows',
  'No low-priority Gamble Garden Parent & Me in staging or Hello Fall IDs',
  'Official event URLs open the host schedule or registration page',
  'Launch Drafts stay Draft until Admin Save & publish',
  'Ready for Admin Go live (high/medium pipeline only)',
] as const

function formatTypes(types: string[]) {
  return types.join(', ')
}

function officialUrlLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'official page'
  }
}

function OfficialEventReviewLink({
  event,
  className,
  children,
}: {
  event: Event
  className?: string
  children?: ReactNode
}) {
  const href = event.eventUrl?.trim()
  if (!href || href === '#' || !isOfficialEventUrl(href)) {
    return <span className="seasonal-launch-review__official-missing">No official URL</span>
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children ?? `Open ${officialUrlLabel(href)} ↗`}
    </a>
  )
}

function EventReviewCard({ event }: { event: Event }) {
  return (
    <div className="seasonal-launch-review__event-link">
      {event.imageUrl ? (
        <img
          src={event.imageUrl}
          alt=""
          className="seasonal-launch-review__event-thumb"
          loading="lazy"
        />
      ) : (
        <div className="seasonal-launch-review__event-thumb seasonal-launch-review__event-thumb--empty" />
      )}
      <div className="seasonal-launch-review__event-link-body">
        <span className="seasonal-launch-review__event-link-title">{event.title}</span>
        <span className="seasonal-launch-review__event-link-meta">
          {event.city} · {event.date}
          {event.categoryTags?.some((tag) => tag.startsWith('Discovery ·')) ? (
            <> · <span className="seasonal-launch-review__event-link-queue">Discovery queue</span></>
          ) : null}
        </span>
        <OfficialEventReviewLink event={event} className="seasonal-launch-review__official-link" />
        <EventDetailLink eventId={event.id} className="seasonal-launch-review__puddles-preview-link">
          Preview on Puddles
        </EventDetailLink>
      </div>
    </div>
  )
}

function discoverySourceLabel(event: Event): string {
  const tag = event.categoryTags?.find((value) => value.startsWith('Discovery · '))
  return tag?.replace('Discovery · ', '') ?? '—'
}

function sortEventsByDate<T extends { date: string; startTime?: string; title: string }>(events: T[]) {
  return [...events].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      String(a.startTime ?? '').localeCompare(String(b.startTime ?? '')) ||
      a.title.localeCompare(b.title),
  )
}

export function ExperimentSeasonalLaunchReviewPage() {
  const { stagingActive, toggleEnabled, setToggleEnabled, getCatalog, summary } =
    useLaunchStagingCatalog()
  const catalog = useMemo(() => getCatalog(), [getCatalog, stagingActive, toggleEnabled])
  const stagedEvents = useMemo(() => getLaunchStagingEvents(), [])
  const todayLabel = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const featuredEvents = useMemo(
    () => resolveFeaturedSeasonalEvents(collection, catalog),
    [catalog],
  )
  const allFeaturedCandidates = useMemo(() => getAllFeaturedCandidateIds(collection), [])
  const allFeaturedEvents = useMemo(
    () => resolveSeasonalEvents(allFeaturedCandidates, catalog),
    [catalog, allFeaturedCandidates],
  )
  const collectionEvents = useMemo(
    () => resolveSeasonalEvents(collection.collectionEventIds, catalog),
    [catalog],
  )
  const driveEvents = useMemo(
    () =>
      collection.driveEventIds?.length
        ? resolveSeasonalEvents(collection.driveEventIds, catalog)
        : [],
    [catalog],
  )

  const unaddedDiscoveryEvents = useMemo(() => getUnaddedDiscoveryReviewEvents(), [])

  const reviewEvents = useMemo(() => {
    const byId = new Map<string, Event>()
    for (const event of [
      ...stagedEvents,
      ...allFeaturedEvents,
      ...collectionEvents,
      ...driveEvents,
      ...unaddedDiscoveryEvents,
    ]) {
      byId.set(event.id, event)
    }
    return sortEventsByDate([...byId.values()])
  }, [stagedEvents, allFeaturedEvents, collectionEvents, driveEvents, unaddedDiscoveryEvents])

  const pipelineInScope = HELLO_FALL_DISCOVERY_PIPELINE.filter((row) => row.priority !== 'low')

  return (
    <div className="home-experiment-shell home-experiment-shell--refined">
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />

      <PageContainer className="layout-container seasonal-launch-review">
        <header className="seasonal-launch-review__intro">
          <p className="seasonal-launch-review__eyebrow">Launch review</p>
          <h1 className="seasonal-launch-review__title">Phase A–C staging approval</h1>
          <p className="seasonal-launch-review__lede">
            Localhost-only catalog merge — staging events are not in production{' '}
            <code>sheet-events.json</code> until you go live. Experiment routes always use staging;
            toggle below to preview on home, browse, and city pages.
          </p>

          <div className="seasonal-launch-review__stats" aria-label="Staging counts">
            <div className="seasonal-launch-review__stat">
              <span className="seasonal-launch-review__stat-value">{summary.totalStaged}</span>
              <span className="seasonal-launch-review__stat-label">Staged rows</span>
            </div>
            <div className="seasonal-launch-review__stat">
              <span className="seasonal-launch-review__stat-value">{summary.sunnyvale}</span>
              <span className="seasonal-launch-review__stat-label">Sunnyvale</span>
            </div>
            <div className="seasonal-launch-review__stat">
              <span className="seasonal-launch-review__stat-value">{summary.parentAndMe}</span>
              <span className="seasonal-launch-review__stat-label">Parent & Me</span>
            </div>
            <div className="seasonal-launch-review__stat">
              <span className="seasonal-launch-review__stat-value">{unaddedDiscoveryEvents.length}</span>
              <span className="seasonal-launch-review__stat-label">Discovery queue</span>
            </div>
            <div className="seasonal-launch-review__stat">
              <span className="seasonal-launch-review__stat-value">{summary.festivals}</span>
              <span className="seasonal-launch-review__stat-label">Festivals</span>
            </div>
          </div>

          <p className="seasonal-launch-review__queue-note">
            Official sources below include staged launch rows, Hello Fall curation, worth-a-drive picks,
            and <strong>{unaddedDiscoveryEvents.length}</strong> pending discovery candidates not yet on{' '}
            <code>sheet-events.json</code> (tagged <em>Discovery queue</em>).
          </p>

          <label className="seasonal-launch-review__toggle">
            <input
              type="checkbox"
              checked={toggleEnabled}
              onChange={(event) => setToggleEnabled(event.target.checked)}
            />
            <span>
              Also show staging catalog on <strong>Home / Browse / Sunnyvale</strong>
              {stagingActive && !toggleEnabled ? ' (on for this page)' : ''}
            </span>
          </label>

          <section
            className="seasonal-launch-review__event-links"
            aria-labelledby="event-links-heading"
          >
            <h2 id="event-links-heading" className="seasonal-launch-review__event-links-title">
              Official sources ({reviewEvents.length})
            </h2>
            <p className="seasonal-launch-review__event-links-lede">
              Open each host&apos;s official page to verify schedule, ages, and registration before
              go-live. Use <strong>Preview on Puddles</strong> to spot-check the card and detail page.
            </p>
            <ul className="seasonal-launch-review__event-link-list">
              {reviewEvents.map((event) => (
                <li key={event.id}>
                  <EventReviewCard event={event} />
                </li>
              ))}
            </ul>
          </section>

          <div className="seasonal-launch-review__links">
            {PHASE_C_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="seasonal-launch-review__link seasonal-launch-review__link--primary"
              >
                {link.label} →
              </Link>
            ))}
          </div>
        </header>

        <section className="seasonal-launch-review__panel" aria-labelledby="phase-a-heading">
          <h2 id="phase-a-heading" className="seasonal-launch-review__panel-title">
            Phase A — Staged catalog batch
          </h2>
          <p className="seasonal-launch-review__panel-lede">
            High/medium pipeline picks, FIT4MOM Las Palmas series, and Sunnyvale library seeds.
            Low priority excluded (Gamble Garden Parent & Me).
          </p>
          <div className="seasonal-launch-review__table-wrap">
            <table className="seasonal-launch-review__data-table">
              <thead>
                <tr>
                  <th>City</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Event</th>
                  <th>Image</th>
                  <th>Staging ID</th>
                  <th>Official link</th>
                </tr>
              </thead>
              <tbody>
                {stagedEvents.map((event) => (
                  <tr key={event.id}>
                    <td>{event.city}</td>
                    <td>{formatTypes(event.types)}</td>
                    <td>{event.date}</td>
                    <td>{event.title}</td>
                    <td>
                      {event.imageUrl ? (
                        <img
                          src={event.imageUrl}
                          alt=""
                          className="seasonal-launch-review__event-thumb seasonal-launch-review__event-thumb--table"
                          loading="lazy"
                        />
                      ) : (
                        <span className="seasonal-launch-review__official-missing">—</span>
                      )}
                    </td>
                    <td>
                      <code>{event.id}</code>
                    </td>
                    <td>
                      <OfficialEventReviewLink
                        event={event}
                        className="seasonal-launch-review__official-link"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="seasonal-launch-review__subheading">Pipeline in scope</h3>
          <ul className="seasonal-launch-review__pipeline">
            {pipelineInScope.map((row) => (
              <li key={row.discoveryId}>
                <strong>{row.priority}</strong> · {row.title} ({row.city})
              </li>
            ))}
          </ul>
        </section>

        {unaddedDiscoveryEvents.length > 0 ? (
          <section className="seasonal-launch-review__panel" aria-labelledby="discovery-queue-heading">
            <h2 id="discovery-queue-heading" className="seasonal-launch-review__panel-title">
              Discovery queue — not on Puddles ({unaddedDiscoveryEvents.length})
            </h2>
            <p className="seasonal-launch-review__panel-lede">
              Pending Admin Discovery rows with no live catalog match. Approve in{' '}
              <Link to="/admin/discovery">Admin → Discovery</Link> after review; preview cards
              work on localhost via Hidden status.
            </p>
            <div className="seasonal-launch-review__table-wrap">
              <table className="seasonal-launch-review__data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>City</th>
                    <th>Type</th>
                    <th>Event</th>
                    <th>Source</th>
                    <th>Official link</th>
                  </tr>
                </thead>
                <tbody>
                  {sortEventsByDate(unaddedDiscoveryEvents).map((event) => (
                    <tr key={event.id}>
                      <td>{event.date}</td>
                      <td>{event.city}</td>
                      <td>{formatTypes(event.types)}</td>
                      <td>{event.title}</td>
                      <td className="seasonal-launch-review__cell-source">
                        {discoverySourceLabel(event)}
                      </td>
                      <td>
                        <OfficialEventReviewLink
                          event={event}
                          className="seasonal-launch-review__official-link"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <section className="seasonal-launch-review__panel" aria-labelledby="phase-b-heading">
          <h2 id="phase-b-heading" className="seasonal-launch-review__panel-title">
            Phase B — Hello Fall curation
          </h2>
          <p className="seasonal-launch-review__panel-lede">
            Featured carousel today ({featuredEvents.length} active ·{' '}
            {allFeaturedEvents.length}/{allFeaturedCandidates.length} candidates resolved) · Close to
            home ({collectionEvents.length}/{collection.collectionEventIds.length} resolved)
          </p>

          <div className="seasonal-launch-review__slot-grid">
            <div>
              <h3 className="seasonal-launch-review__subheading">Featured rotation calendar</h3>
              <div className="seasonal-launch-review__table-wrap">
                <table className="seasonal-launch-review__data-table">
                  <thead>
                    <tr>
                      <th>Window</th>
                      <th>Event</th>
                      <th>Status</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collection.featuredWindows.map((window) => {
                      const event = allFeaturedEvents.find((row) => row.id === window.eventId)
                      const status = getSeasonalFeaturedWindowStatus(window, todayLabel)
                      return (
                        <tr
                          key={`${window.eventId}-${window.featuredFrom}`}
                          className={status === 'active' ? 'seasonal-launch-review__row--active' : ''}
                        >
                          <td>
                            {formatSeasonalDateRange(window.featuredFrom, window.featuredUntil)}
                            {window.anchor ? ' · anchor' : ''}
                          </td>
                          <td className={event ? '' : 'seasonal-launch-review__slot-missing'}>
                            {event ? (
                              <>
                                {event.title}
                                {' · '}
                                <OfficialEventReviewLink
                                  event={event}
                                  className="seasonal-launch-review__official-link"
                                />
                              </>
                            ) : (
                              <code>{window.eventId}</code>
                            )}
                          </td>
                          <td>{status}</td>
                          <td>{window.note ?? '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h3 className="seasonal-launch-review__subheading">Close to home grid</h3>
              <ol className="seasonal-launch-review__slot-list">
                {collection.collectionEventIds.map((id) => {
                  const event = collectionEvents.find((row) => row.id === id)
                  return (
                    <li key={id} className={event ? '' : 'seasonal-launch-review__slot-missing'}>
                      {event ? (
                        <>
                          <span>
                            {event.title}{' '}
                            <span className="seasonal-launch-review__slot-city">({event.city})</span>
                          </span>
                          {' · '}
                          <OfficialEventReviewLink
                            event={event}
                            className="seasonal-launch-review__official-link"
                          />
                        </>
                      ) : (
                        <span>Missing: <code>{id}</code></span>
                      )}
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>

          {driveEvents.length > 0 ? (
            <div>
              <h3 className="seasonal-launch-review__subheading">Worth a drive</h3>
              <ol className="seasonal-launch-review__slot-list">
                {collection.driveEventIds?.map((id) => {
                  const event = driveEvents.find((row) => row.id === id)
                  return (
                    <li key={id} className={event ? '' : 'seasonal-launch-review__slot-missing'}>
                      {event ? (
                        <>
                          <span>
                            {event.title}{' '}
                            <span className="seasonal-launch-review__slot-city">({event.city})</span>
                          </span>
                          {' · '}
                          <OfficialEventReviewLink
                            event={event}
                            className="seasonal-launch-review__official-link"
                          />
                        </>
                      ) : (
                        <span>
                          Missing: <code>{id}</code>
                        </span>
                      )}
                    </li>
                  )
                })}
              </ol>
            </div>
          ) : null}
        </section>

        <section className="seasonal-launch-review__panel" aria-labelledby="phase-c-heading">
          <h2 id="phase-c-heading" className="seasonal-launch-review__panel-title">
            Phase C — Launch story surfaces
          </h2>
          <p className="seasonal-launch-review__panel-lede">
            Verify Sunnyvale chip, new activity-type filters, Hello Fall band, and collection mix
            against the staging catalog.
          </p>
          <ul className="seasonal-launch-review__checklist">
            {APPROVAL_CHECKLIST.map((item) => (
              <li key={item}>
                <label>
                  <input type="checkbox" />
                  {item}
                </label>
              </li>
            ))}
          </ul>
          <p className="seasonal-launch-review__note">
            Go live (after approval): Admin Discovery → Ready → Go live per event, or merge{' '}
            <code>launch-staging-events.json</code> into <code>sheet-events.json</code> via PR.
            Requires <code>GITHUB_DEPLOY_TOKEN</code> for API publish on <code>next dev</code>.
          </p>
        </section>

        <section className="seasonal-launch-review__changes" aria-labelledby="typography-heading">
          <h2 id="typography-heading">Typography alignment (prior pass)</h2>
          <ul>
            <li>
              <strong>Shared subtitle scale</strong> — home band tagline 1rem / weight 600 matches
              Hello Fall hero description.
            </li>
            <li>
              <strong>Section subtitles</strong> — 0.875rem / weight 600 on collection bands.
            </li>
          </ul>
        </section>
      </PageContainer>

      <Footer />
    </div>
  )
}

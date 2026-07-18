import { Link } from 'react-router-dom'
import type { Event } from '../../types/event'
import { EventImage } from '../EventImage'
import { EventDetailIcon } from '../EventDetailIcon'
import { EventRouteCard } from '../EventRouteCard'
import { EventLifecycleBanner } from './EventLifecycleBanner'
import { EventLifecycleActions } from './EventLifecycleActions'
import { SharedEventNearbySection } from './SharedEventNearbySection'
import { SharedEventVisitorIntro } from './SharedEventVisitorIntro'
import { RelativeDateLabel } from './RelativeDateLabel'
import { addEventToCalendar, canAddEventToCalendar, isLikelyInAppBrowser } from '../../utils/calendar'
import {
  formatEventDate,
  formatEventTimeRange,
  formatModalDate,
  formatModalTimeRange,
} from '../../utils/dates'
import {
  formatLifecycleCancelledPhrase,
  formatLifecycleEndedPhrase,
  getAllCatalogEventsForLifecycle,
  type EventLifecycleStatus,
} from '../../utils/eventLifecycle'
import {
  resolveLifecycleBrowseAllHref,
  resolveLifecycleNearbyHref,
  resolveLifecycleNextEventHref,
  type LifecycleLinkTarget,
} from '../../utils/eventLifecycleBrowse'
import { eventDetailUrl, isOfficialEventUrl } from '../../utils/eventPages'
import { getEventCategoryTags } from '../../utils/eventImages'
import { getEventModalAgeLabel } from '../../utils/ageRange'
import { parseEventTips } from '../../utils/eventTips'
import {
  getEventAddressLine,
  getEventDirectionsLabel,
  getEventDirectionsUrl,
  getEventRoomLine,
  isCityShownInAddress,
} from '../../utils/maps'
import { ANALYTICS_EVENTS, trackActivityEngagement } from '../../utils/analytics'
import {
  sharedEventCityLabel,
  capitalizeCitiesInText,
  keepCityNameOnOneLine,
} from '../../utils/sharedEventNearby'
import { useMediaQuery } from '../../hooks/useMediaQuery'

export const SHARED_EVENT_LAYOUTS = ['airbnb', 'airbnb-v2', 'airbnb-v3', 'luma', 'eventbrite'] as const
export type SharedEventLayoutId = (typeof SHARED_EVENT_LAYOUTS)[number]

export const SHARED_EVENT_LAYOUT_LABELS: Record<SharedEventLayoutId, string> = {
  airbnb: 'Airbnb v1',
  'airbnb-v2': 'Airbnb v2 · modal mix',
  'airbnb-v3': 'Airbnb v3 · responsive mix',
  luma: 'Luma',
  eventbrite: 'Eventbrite',
}

interface SharedEventDesignLayoutProps {
  event: Event
  nearbyEvents: Event[]
  layout: SharedEventLayoutId
  /** Nearby card links — defaults to production /event/:id */
  buildNearbyEventHref?: (eventId: string) => string
  /** Optional lifecycle overlay (ended / cancelled / archived experiment). */
  lifecycleStatus?: EventLifecycleStatus
  lifecycleNow?: Date
  /** Where ended-state CTAs point (defaults to production /event + /browse). */
  lifecycleLinkTarget?: LifecycleLinkTarget
}

function isEndedLifecycleStatus(status?: EventLifecycleStatus): boolean {
  return status === 'ended' || status === 'archived' || status === 'cancelled'
}

function formatVerified(verifiedDate: string): string {
  return new Date(`${verifiedDate}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Airbnb v3 time: same as modal (AM/PM all caps). */
function formatV3TimeRange(startTime: string, endTime?: string): string {
  return formatModalTimeRange(startTime, endTime)
}

function getEventPresentation(event: Event) {
  const dateLabel = formatEventDate(event.date)
  const timeLabel = formatEventTimeRange(event.startTime, event.endTime)
  const addressLine = keepCityNameOnOneLine(
    capitalizeCitiesInText(getEventAddressLine(event), event.city),
    event.city,
  )
  const directionsUrl = getEventDirectionsUrl(event)
  const canCalendar = canAddEventToCalendar(event)
  const hasOfficial = isOfficialEventUrl(event.eventUrl)
  const tags = getEventCategoryTags(event)
  const verified = formatVerified(event.verifiedDate)
  const city = sharedEventCityLabel(event.city || '')
  const shareUrl = eventDetailUrl(event)
  const roomLine = getEventRoomLine(event)
  const inAppBrowser = isLikelyInAppBrowser()

  function handleCalendar() {
    const result = addEventToCalendar(event)
    if (result) trackActivityEngagement(ANALYTICS_EVENTS.ADD_TO_CALENDAR_CLICKED, event)
  }

  async function handleShare() {
    trackActivityEngagement(ANALYTICS_EVENTS.ACTIVITY_SHARED, event)
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: event.title, url: shareUrl })
        return
      } catch {
        // fall through
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      // no-op
    }
  }

  return {
    dateLabel,
    timeLabel,
    addressLine,
    directionsUrl,
    canCalendar,
    hasOfficial,
    tags,
    verified,
    city,
    roomLine,
    inAppBrowser,
    handleCalendar,
    handleShare,
  }
}

function TrustLine({ verified }: { verified: string }) {
  return (
    <p className="sedl-trust">
      <span className="sedl-trust__mark" aria-hidden>
        ✓
      </span>
      <span className="sedl-trust__label">Verified by Puddles</span>
      <span className="sedl-trust__meta">· Last checked {verified}</span>
    </p>
  )
}

function ModalTrustCard({ verified }: { verified: string }) {
  return (
    <div className="event-modal-trust-card sedl-v2-trust">
      <div className="event-modal-trust-header">
        <span className="event-modal-trust-header-label">Verified by Puddles</span>
        <span className="event-modal-trust-timestamp">· Last checked {verified}</span>
      </div>
      <p className="event-modal-trust-note">Before you head out, please check the official page.</p>
    </div>
  )
}

function AirbnbV1CtaRail({
  event,
  presentation,
}: {
  event: Event
  presentation: ReturnType<typeof getEventPresentation>
}) {
  const p = presentation
  return (
    <aside className="sedl-airbnb-rail" aria-label="Save this activity">
      <p className="sedl-airbnb-rail__cost">{event.cost}</p>
      <p className="sedl-airbnb-rail__when">
        <RelativeDateLabel label={p.dateLabel} />
        {p.timeLabel ? (
          <>
            <br />
            {p.timeLabel}
          </>
        ) : null}
      </p>
      <p className="sedl-airbnb-rail__where">{event.venue || p.city}</p>
      <button
        type="button"
        className="btn-primary sedl-cta"
        disabled={!p.canCalendar}
        onClick={p.handleCalendar}
      >
        Add to calendar
      </button>
      {p.hasOfficial ? (
        <a
          href={event.eventUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary sedl-cta"
          onClick={() => trackActivityEngagement(ANALYTICS_EVENTS.VISIT_OFFICIAL_PAGE_CLICKED, event)}
        >
          Visit official page
        </a>
      ) : null}
    </aside>
  )
}

/** Desktop sticky rail for ended / cancelled / archived shared-event pages. */
function AirbnbV3LifecycleRail({
  event,
  status,
  now,
  linkTarget = 'production',
}: {
  event: Event
  status: EventLifecycleStatus
  now: Date
  linkTarget?: LifecycleLinkTarget
}) {
  const isCancelled = status === 'cancelled'
  const nearbyHref = resolveLifecycleNearbyHref(event, linkTarget)
  const browseAllHref = resolveLifecycleBrowseAllHref(event)
  const nextPath = resolveLifecycleNextEventHref(
    event,
    getAllCatalogEventsForLifecycle(),
    now,
    linkTarget,
  )
  const hasOfficialPage = isOfficialEventUrl(event.eventUrl)
  const schedule = isCancelled
    ? formatLifecycleCancelledPhrase(event)
    : formatLifecycleEndedPhrase(event)

  return (
    <aside className="sedl-airbnb-rail sedl-airbnb-rail--lifecycle" aria-label="Activity status">
      <p className="sedl-airbnb-rail__lifecycle-status">
        {isCancelled ? 'Cancelled' : 'Ended'}
      </p>
      <p className="sedl-airbnb-rail__when">{schedule}</p>
      <p className="sedl-airbnb-rail__where">{event.venue || event.city}</p>
      {nextPath ? (
        <Link to={nextPath} className="btn-primary sedl-cta">
          View the next date
        </Link>
      ) : (
        <Link to={nearbyHref} className="btn-primary sedl-cta">
          See what&apos;s coming up nearby
        </Link>
      )}
      <Link to={browseAllHref} className="btn-secondary sedl-cta">
        Browse all activities
      </Link>
      {hasOfficialPage ? (
        <div className="sedl-airbnb-rail__lifecycle-note">
          <a
            href={event.eventUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sedl-airbnb-rail__lifecycle-link"
          >
            View original activity page
          </a>
          <span className="sedl-airbnb-rail__lifecycle-note-text">
            This page may no longer be available.
          </span>
        </div>
      ) : null}
    </aside>
  )
}

function ShareFloatingButton({ onShare }: { onShare: () => void }) {
  return (
    <button
      type="button"
      className="event-modal-share-btn event-modal-share-btn--floating"
      onClick={onShare}
      aria-label="Share event"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

function AirbnbLayout({
  event,
  nearbyEvents,
  buildNearbyEventHref,
}: Omit<SharedEventDesignLayoutProps, 'layout'>) {
  const p = getEventPresentation(event)

  return (
    <div className="sedl sedl--airbnb">
      <div className="sedl-airbnb-hero">
        <EventImage event={event} className="sedl-airbnb-hero__img" loading="eager" />
        <button
          type="button"
          className="sedl-airbnb-share"
          onClick={() => void p.handleShare()}
          aria-label="Share event"
        >
          Share
        </button>
      </div>

      <div className="sedl-airbnb-shell">
        <div className="sedl-airbnb-main">
          <p className="sedl-kicker">{p.city} · Ages {event.ageRange}</p>
          <h1 className="sedl-airbnb-title">{event.title}</h1>
          <SharedEventVisitorIntro event={event} />

          <div className="sedl-airbnb-facts">
            <div>
              <p className="sedl-fact-label">When</p>
              <p className="sedl-fact-value">
                {p.dateLabel}
                {p.timeLabel ? ` · ${p.timeLabel}` : ''}
              </p>
            </div>
            <div>
              <p className="sedl-fact-label">Where</p>
              <p className="sedl-fact-value">
                {event.venue}
                {p.addressLine ? ` · ${p.addressLine}` : ''}
              </p>
              {p.directionsUrl ? (
                <a
                  href={p.directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="sedl-text-link"
                  onClick={() => trackActivityEngagement(ANALYTICS_EVENTS.OPEN_ROUTE_CLICKED, event)}
                >
                  Get directions
                </a>
              ) : null}
            </div>
          </div>

          {event.description ? (
            <section className="sedl-section">
              <h2 className="sedl-section-title">What you’ll do</h2>
              <p className="sedl-body">{event.description}</p>
            </section>
          ) : null}

          {event.tips ? (
            <section className="sedl-section">
              <h2 className="sedl-section-title">Good to know</h2>
              <p className="sedl-body">{event.tips}</p>
            </section>
          ) : null}

          <section className="sedl-section">
            <TrustLine verified={p.verified} />
            <p className="sedl-trust-note">Before you head out, please check the official page.</p>
          </section>
        </div>

        <aside className="sedl-airbnb-rail" aria-label="Save this activity">
          <p className="sedl-airbnb-rail__cost">{event.cost}</p>
          <p className="sedl-airbnb-rail__when">
            {p.dateLabel}
            {p.timeLabel ? (
              <>
                <br />
                {p.timeLabel}
              </>
            ) : null}
          </p>
          <p className="sedl-airbnb-rail__where">{event.venue}</p>
          <button
            type="button"
            className="btn-primary sedl-cta"
            disabled={!p.canCalendar}
            onClick={p.handleCalendar}
          >
            Add to calendar
          </button>
          {p.hasOfficial ? (
            <a
              href={event.eventUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary sedl-cta"
              onClick={() => trackActivityEngagement(ANALYTICS_EVENTS.VISIT_OFFICIAL_PAGE_CLICKED, event)}
            >
              Visit official page
            </a>
          ) : null}
        </aside>
      </div>

      <div className="sedl-nearby-wrap">
        <SharedEventNearbySection
          event={event}
          nearbyEvents={nearbyEvents}
          buildEventHref={buildNearbyEventHref}
        />
      </div>
    </div>
  )
}

function LumaLayout({
  event,
  nearbyEvents,
  buildNearbyEventHref,
}: Omit<SharedEventDesignLayoutProps, 'layout'>) {
  const p = getEventPresentation(event)
  const day = new Date(`${event.date}T12:00:00`).toLocaleDateString('en-US', { day: 'numeric' })
  const month = new Date(`${event.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short' })

  return (
    <div className="sedl sedl--luma">
      <div className="sedl-luma-stage">
        <article className="sedl-luma-card">
          <div className="sedl-luma-card__media">
            <EventImage event={event} className="sedl-luma-card__img" loading="eager" />
            <div className="sedl-luma-datebadge" aria-hidden>
              <span className="sedl-luma-datebadge__month">{month}</span>
              <span className="sedl-luma-datebadge__day">{day}</span>
            </div>
          </div>

          <div className="sedl-luma-card__body">
            <p className="sedl-luma-hosted">Presented on Puddles · {p.city}</p>
            <h1 className="sedl-luma-title">{event.title}</h1>
            <p className="sedl-luma-meta">
              {p.dateLabel}
              {p.timeLabel ? ` · ${p.timeLabel}` : ''}
            </p>
            <p className="sedl-luma-meta">
              {event.venue}
              {p.addressLine ? ` · ${p.addressLine}` : ''}
            </p>

            <SharedEventVisitorIntro event={event} />

            <div className="sedl-luma-actions">
              <button
                type="button"
                className="btn-primary sedl-cta"
                disabled={!p.canCalendar}
                onClick={p.handleCalendar}
              >
                Register interest · Calendar
              </button>
              <button type="button" className="sedl-luma-share" onClick={() => void p.handleShare()}>
                Share
              </button>
            </div>

            {event.description ? <p className="sedl-body sedl-luma-desc">{event.description}</p> : null}

            <TrustLine verified={p.verified} />

            {p.hasOfficial ? (
              <a
                href={event.eventUrl}
                target="_blank"
                rel="noreferrer"
                className="sedl-text-link"
                onClick={() => trackActivityEngagement(ANALYTICS_EVENTS.VISIT_OFFICIAL_PAGE_CLICKED, event)}
              >
                Official event page →
              </a>
            ) : null}
          </div>
        </article>
      </div>

      <div className="sedl-nearby-wrap sedl-nearby-wrap--narrow">
        <SharedEventNearbySection
          event={event}
          nearbyEvents={nearbyEvents}
          buildEventHref={buildNearbyEventHref}
        />
      </div>
    </div>
  )
}

function EventbriteLayout({
  event,
  nearbyEvents,
  buildNearbyEventHref,
}: Omit<SharedEventDesignLayoutProps, 'layout'>) {
  const p = getEventPresentation(event)

  return (
    <div className="sedl sedl--eventbrite">
      <div className="sedl-eb-hero-band">
        <div className="sedl-eb-hero-band__inner">
          <EventImage event={event} className="sedl-eb-hero-img" loading="eager" />
          <div className="sedl-eb-hero-copy">
            <p className="sedl-kicker">
              {p.tags[0] || event.types[0] || 'Activity'} · {event.cost}
            </p>
            <h1 className="sedl-eb-title">{event.title}</h1>
            <p className="sedl-eb-subtitle">
              {p.dateLabel}
              {p.timeLabel ? ` · ${p.timeLabel}` : ''} · {p.city}
            </p>
            <SharedEventVisitorIntro event={event} />
          </div>
        </div>
      </div>

      <div className="sedl-eb-shell">
        <div className="sedl-eb-main">
          <section className="sedl-eb-block">
            <h2 className="sedl-section-title">Date and time</h2>
            <p className="sedl-body">
              {p.dateLabel}
              {p.timeLabel ? (
                <>
                  <br />
                  {p.timeLabel}
                </>
              ) : null}
            </p>
          </section>

          <section className="sedl-eb-block">
            <h2 className="sedl-section-title">Location</h2>
            <p className="sedl-body">
              <strong>{event.venue}</strong>
              {p.addressLine ? (
                <>
                  <br />
                  {p.addressLine}
                </>
              ) : null}
            </p>
            {p.directionsUrl ? (
              <a
                href={p.directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="sedl-text-link"
                onClick={() => trackActivityEngagement(ANALYTICS_EVENTS.OPEN_ROUTE_CLICKED, event)}
              >
                View map
              </a>
            ) : null}
          </section>

          {event.description ? (
            <section className="sedl-eb-block">
              <h2 className="sedl-section-title">About this event</h2>
              <p className="sedl-body">{event.description}</p>
            </section>
          ) : null}

          {event.tips ? (
            <section className="sedl-eb-block">
              <h2 className="sedl-section-title">Tips for families</h2>
              <p className="sedl-body">{event.tips}</p>
            </section>
          ) : null}

          <section className="sedl-eb-block">
            <h2 className="sedl-section-title">Organizer</h2>
            <TrustLine verified={p.verified} />
            <p className="sedl-trust-note">Before you head out, please check the official page.</p>
          </section>
        </div>

        <aside className="sedl-eb-tickets" aria-label="Tickets">
          <p className="sedl-eb-tickets__label">Admission</p>
          <p className="sedl-eb-tickets__price">{event.cost}</p>
          <p className="sedl-eb-tickets__ages">Ages {event.ageRange}</p>
          <button
            type="button"
            className="btn-primary sedl-cta"
            disabled={!p.canCalendar}
            onClick={p.handleCalendar}
          >
            Get tickets · Add to calendar
          </button>
          {p.hasOfficial ? (
            <a
              href={event.eventUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary sedl-cta"
              onClick={() => trackActivityEngagement(ANALYTICS_EVENTS.VISIT_OFFICIAL_PAGE_CLICKED, event)}
            >
              Visit official page
            </a>
          ) : null}
          <button type="button" className="sedl-text-link sedl-eb-share" onClick={() => void p.handleShare()}>
            Share this event
          </button>
        </aside>
      </div>

      <div className="sedl-eb-sticky" aria-label="Quick actions">
        <div className="sedl-eb-sticky__inner">
          <div>
            <p className="sedl-eb-sticky__title">{event.title}</p>
            <p className="sedl-eb-sticky__meta">{p.dateLabel}</p>
          </div>
          <button
            type="button"
            className="btn-primary"
            disabled={!p.canCalendar}
            onClick={p.handleCalendar}
          >
            Get tickets
          </button>
        </div>
      </div>

      <div className="sedl-nearby-wrap">
        <SharedEventNearbySection
          event={event}
          nearbyEvents={nearbyEvents}
          buildEventHref={buildNearbyEventHref}
        />
      </div>
    </div>
  )
}

/** Airbnb structure + current event-modal design language */
function AirbnbV2Layout({
  event,
  nearbyEvents,
  buildNearbyEventHref,
}: Omit<SharedEventDesignLayoutProps, 'layout'>) {
  const p = getEventPresentation(event)
  const tipItems = parseEventTips(event.tips)

  return (
    <div className="sedl sedl--airbnb-v2">
      <div className="sedl-v2-hero-wrap">
        <EventImage event={event} className="sedl-v2-hero event-modal-hero" loading="eager" />
        <div className="sedl-v2-floating-actions event-modal-floating-actions event-modal-floating-actions--persistent">
          <button
            type="button"
            className="event-modal-share-btn event-modal-share-btn--floating"
            onClick={() => void p.handleShare()}
            aria-label="Share event"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="sedl-v2-shell">
        <div className="sedl-v2-main">
          <div className="sedl-v2-content">
            <h1 className="event-detail-title sedl-v2-title">{event.title}</h1>
            <SharedEventVisitorIntro event={event} />

            <div className="sedl-v2-meta event-detail-fields">
              <div className="event-detail-row">
                <EventDetailIcon kind="time" />
                <div className="event-detail-row-content">
                  <p className="event-detail-meta">{formatModalDate(event.date)}</p>
                  <p className="event-detail-meta text-muted">
                    {formatModalTimeRange(event.startTime, event.endTime)}
                  </p>
                </div>
              </div>

              <div className="event-detail-row event-detail-location">
                <EventDetailIcon kind="location" />
                <div className="event-detail-row-content">
                  {event.venue ? <p className="event-detail-venue">{event.venue}</p> : null}
                  {p.roomLine ? <p className="event-detail-room">{p.roomLine}</p> : null}
                  {p.directionsUrl && p.addressLine ? (
                    <a
                      href={p.directionsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="event-modal-address-link"
                      aria-label={getEventDirectionsLabel(event)}
                      onClick={() => trackActivityEngagement(ANALYTICS_EVENTS.OPEN_ROUTE_CLICKED, event)}
                    >
                      <span>{p.addressLine}</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    p.addressLine && <p className="event-modal-address-plain">{p.addressLine}</p>
                  )}
                  {event.city && !isCityShownInAddress(p.addressLine ?? '', event.city) ? (
                    <p className="event-detail-meta text-muted">{p.city}</p>
                  ) : null}
                </div>
              </div>

              <div className="event-detail-row event-detail-field">
                <EventDetailIcon kind="ages" />
                <div className="event-detail-row-content">
                  <div className="event-detail-field-label">Ages</div>
                  <p className="event-detail-field-value">{getEventModalAgeLabel(event.ageRange)}</p>
                </div>
              </div>

              {p.tags.length > 0 ? (
                <div className="event-detail-row event-detail-field">
                  <EventDetailIcon kind="type" />
                  <div className="event-detail-row-content">
                    <div className="event-detail-field-label">Type</div>
                    <div className="event-detail-tag-chips" aria-label="Category tags">
                      {p.tags.map((tag) => (
                        <span key={tag} className="event-detail-tag-chip">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="event-detail-row event-detail-field">
                <EventDetailIcon kind="cost" />
                <div className="event-detail-row-content">
                  <div className="event-detail-field-label">Cost</div>
                  <p className="event-detail-field-value">{event.cost}</p>
                </div>
              </div>
            </div>

            {event.description ? (
              <p className="event-detail-body sedl-v2-body">{event.description}</p>
            ) : null}

            {tipItems.length > 0 ? (
              <section className="event-detail-tips" aria-labelledby="sedl-v2-tips-heading">
                <h2 id="sedl-v2-tips-heading" className="event-detail-tips-label">
                  Before you go
                </h2>
                <ul className="event-detail-tips-list">
                  {tipItems.map((item, index) => (
                    <li key={`${index}-${item}`} className="event-detail-tips-item">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <div className="event-modal-trust-card sedl-v2-trust">
              <div className="event-modal-trust-header">
                <span className="event-modal-trust-header-label">Verified by Puddles</span>
                <span className="event-modal-trust-timestamp">· Last checked {p.verified}</span>
              </div>
              <p className="event-modal-trust-note">
                Before you head out, please check the official page.
              </p>
            </div>

            <div className="sedl-v2-route">
              <EventRouteCard event={event} />
            </div>
          </div>
        </div>

        <aside className="sedl-v2-rail" aria-label="Save this activity">
          <p className="sedl-v2-rail__when">{formatModalDate(event.date)}</p>
          <p className="sedl-v2-rail__time text-muted">
            {formatModalTimeRange(event.startTime, event.endTime)}
          </p>
          <p className="sedl-v2-rail__venue">{event.venue || p.city}</p>
          <p className="sedl-v2-rail__cost">{event.cost}</p>

          <div className="sedl-v2-rail__actions event-modal-actions__ctas">
            <button
              type="button"
              className="btn-primary"
              disabled={!p.canCalendar}
              onClick={p.handleCalendar}
            >
              Add to calendar
            </button>
            {!p.canCalendar ? (
              <p className="event-modal-actions-note text-center">Calendar details unavailable</p>
            ) : p.inAppBrowser ? (
              <p className="event-modal-actions-note text-center">Opens Google Calendar</p>
            ) : null}
            {p.hasOfficial ? (
              <a
                href={event.eventUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                onClick={() => trackActivityEngagement(ANALYTICS_EVENTS.VISIT_OFFICIAL_PAGE_CLICKED, event)}
              >
                Visit official page
              </a>
            ) : null}
          </div>
        </aside>
      </div>

      <div className="sedl-nearby-wrap sedl-v2-nearby">
        <SharedEventNearbySection
          event={event}
          nearbyEvents={nearbyEvents}
          buildEventHref={buildNearbyEventHref}
        />
      </div>
    </div>
  )
}

/**
 * Airbnb v3 desktop body — shared by page URL and modal experiment.
 * `chrome: 'modal'` omits nearby and uses dialog-friendly sticky rail.
 */
export function AirbnbV3DesktopContent({
  event,
  nearbyEvents = [],
  buildNearbyEventHref,
  chrome = 'page',
  hideHeroShare = false,
  lifecycleStatus,
  lifecycleNow = new Date(),
  lifecycleLinkTarget = 'production',
}: {
  event: Event
  nearbyEvents?: Event[]
  buildNearbyEventHref?: (eventId: string) => string
  chrome?: 'page' | 'modal'
  hideHeroShare?: boolean
  lifecycleStatus?: EventLifecycleStatus
  lifecycleNow?: Date
  lifecycleLinkTarget?: LifecycleLinkTarget
}) {
  const p = getEventPresentation(event)
  const v3 = {
    ...p,
    dateLabel: formatModalDate(event.date),
    timeLabel: formatV3TimeRange(event.startTime, event.endTime),
  }
  const isModal = chrome === 'modal'
  const isEnded = isEndedLifecycleStatus(lifecycleStatus)

  return (
    <div
      className={[
        'sedl sedl--airbnb sedl--airbnb-v3 sedl--airbnb-v3-desktop',
        isModal ? 'sedl--airbnb-v3-modal' : '',
        isEnded ? 'sedl--lifecycle-ended' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="sedl-airbnb-hero">
        <EventImage event={event} className="sedl-airbnb-hero__img" loading="eager" />
        {!hideHeroShare && !isEnded ? (
          <button
            type="button"
            className="sedl-airbnb-share"
            onClick={() => void p.handleShare()}
            aria-label="Share event"
          >
            Share
          </button>
        ) : null}
      </div>

      <div className="sedl-airbnb-shell">
        <div className="sedl-airbnb-main">
          <p className="sedl-kicker">{p.city}</p>
          <h1 className="sedl-airbnb-title">{event.title}</h1>

          {lifecycleStatus ? (
            <EventLifecycleBanner
              event={event}
              status={lifecycleStatus}
              linkTarget={lifecycleLinkTarget}
            />
          ) : null}

          <div className="sedl-airbnb-facts">
            <div>
              <p className="sedl-fact-label">When</p>
              <p className="sedl-fact-value">
                <RelativeDateLabel label={v3.dateLabel} />
                {v3.timeLabel ? ` · ${v3.timeLabel}` : ''}
              </p>
            </div>
            <div>
              <p className="sedl-fact-label">Where</p>
              <p className="sedl-fact-value">
                {event.venue}
                {p.addressLine ? ` · ${p.addressLine}` : ''}
              </p>
              {p.directionsUrl ? (
                <a
                  href={p.directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="sedl-text-link"
                  onClick={() => trackActivityEngagement(ANALYTICS_EVENTS.OPEN_ROUTE_CLICKED, event)}
                >
                  Get directions
                </a>
              ) : null}
            </div>
            <div>
              <p className="sedl-fact-label">Ages</p>
              <p className="sedl-fact-value">{getEventModalAgeLabel(event.ageRange)}</p>
            </div>
            {p.tags.length > 0 ? (
              <div>
                <p className="sedl-fact-label">Type</p>
                <p className="sedl-fact-value">{p.tags.join(' · ')}</p>
              </div>
            ) : null}
          </div>

          {event.description ? (
            <p className="sedl-body sedl-v3-desktop-desc">{event.description}</p>
          ) : null}

          {event.tips ? (
            <section className="sedl-section">
              <h2 className="sedl-section-title">Good to know</h2>
              <p className="sedl-body">{event.tips}</p>
            </section>
          ) : null}

          <section className="sedl-section">
            <ModalTrustCard verified={p.verified} />
          </section>

          <div className="sedl-v2-route">
            <EventRouteCard event={event} />
          </div>
        </div>

        {isEnded && lifecycleStatus ? (
          <AirbnbV3LifecycleRail
            event={event}
            status={lifecycleStatus}
            now={lifecycleNow}
            linkTarget={lifecycleLinkTarget}
          />
        ) : (
          <AirbnbV1CtaRail event={event} presentation={v3} />
        )}
      </div>

      {!isModal ? (
        <div className="sedl-nearby-wrap">
          <SharedEventNearbySection
            event={event}
            nearbyEvents={nearbyEvents}
            variant="v3"
            buildEventHref={buildNearbyEventHref}
          />
        </div>
      ) : null}
    </div>
  )
}

/**
 * Airbnb v3: v1 layout on desktop, v2 layout on mobile.
 * CTA always uses Airbnb v1 rail; Verified card always uses modal design.
 */
function AirbnbV3Layout({
  event,
  nearbyEvents,
  buildNearbyEventHref,
  lifecycleStatus,
  lifecycleNow = new Date(),
  lifecycleLinkTarget = 'production',
}: Omit<SharedEventDesignLayoutProps, 'layout'>) {
  const p = getEventPresentation(event)
  const tipItems = parseEventTips(event.tips)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const isEnded = isEndedLifecycleStatus(lifecycleStatus)
  const v3 = {
    ...p,
    dateLabel: formatModalDate(event.date),
    timeLabel: formatV3TimeRange(event.startTime, event.endTime),
  }

  if (isDesktop) {
    return (
      <AirbnbV3DesktopContent
        event={event}
        nearbyEvents={nearbyEvents}
        buildNearbyEventHref={buildNearbyEventHref}
        chrome="page"
        lifecycleStatus={lifecycleStatus}
        lifecycleNow={lifecycleNow}
        lifecycleLinkTarget={lifecycleLinkTarget}
      />
    )
  }

  return (
    <div
      className={[
        'sedl sedl--airbnb-v2 sedl--airbnb-v3 sedl--airbnb-v3-mobile',
        isEnded ? 'sedl--lifecycle-ended' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="sedl-v2-hero-wrap">
        <EventImage event={event} className="sedl-v2-hero event-modal-hero" loading="eager" />
        {!isEnded ? (
          <div className="sedl-v2-floating-actions event-modal-floating-actions event-modal-floating-actions--persistent">
            <ShareFloatingButton onShare={() => void p.handleShare()} />
          </div>
        ) : null}
      </div>

      <div className="sedl-v2-shell sedl-v3-mobile-shell">
        <div className="sedl-v2-main">
          <div className="sedl-v2-content">
            <h1 className="event-detail-title sedl-v2-title">{event.title}</h1>

            {lifecycleStatus ? (
              <EventLifecycleBanner
                event={event}
                status={lifecycleStatus}
                linkTarget={lifecycleLinkTarget}
              />
            ) : null}

            <div className="sedl-v2-meta event-detail-fields">
              <div className="event-detail-row">
                <EventDetailIcon kind="time" />
                <div className="event-detail-row-content">
                  <p className="event-detail-meta">
                    <RelativeDateLabel label={v3.dateLabel} />
                  </p>
                  <p className="event-detail-meta text-muted">{v3.timeLabel}</p>
                </div>
              </div>

              <div className="event-detail-row event-detail-location">
                <EventDetailIcon kind="location" />
                <div className="event-detail-row-content">
                  {event.venue ? <p className="event-detail-venue">{event.venue}</p> : null}
                  {p.roomLine ? <p className="event-detail-room">{p.roomLine}</p> : null}
                  {p.directionsUrl && p.addressLine ? (
                    <a
                      href={p.directionsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="event-modal-address-link"
                      aria-label={getEventDirectionsLabel(event)}
                      onClick={() => trackActivityEngagement(ANALYTICS_EVENTS.OPEN_ROUTE_CLICKED, event)}
                    >
                      <span>{p.addressLine}</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    p.addressLine && <p className="event-modal-address-plain">{p.addressLine}</p>
                  )}
                  {event.city && !isCityShownInAddress(p.addressLine ?? '', event.city) ? (
                    <p className="event-detail-meta text-muted">{p.city}</p>
                  ) : null}
                </div>
              </div>

              <div className="event-detail-row event-detail-field">
                <EventDetailIcon kind="ages" />
                <div className="event-detail-row-content">
                  <div className="event-detail-field-label">Ages</div>
                  <p className="event-detail-field-value">{getEventModalAgeLabel(event.ageRange)}</p>
                </div>
              </div>

              {p.tags.length > 0 ? (
                <div className="event-detail-row event-detail-field">
                  <EventDetailIcon kind="type" />
                  <div className="event-detail-row-content">
                    <div className="event-detail-field-label">Type</div>
                    <div className="event-detail-tag-chips" aria-label="Category tags">
                      {p.tags.map((tag) => (
                        <span key={tag} className="event-detail-tag-chip">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="event-detail-row event-detail-field">
                <EventDetailIcon kind="cost" />
                <div className="event-detail-row-content">
                  <div className="event-detail-field-label">Cost</div>
                  <p className="event-detail-field-value">{event.cost}</p>
                </div>
              </div>
            </div>

            {event.description ? (
              <p className="event-detail-body sedl-v2-body">{event.description}</p>
            ) : null}

            {tipItems.length > 0 ? (
              <section className="event-detail-tips" aria-labelledby="sedl-v3-tips-heading">
                <h2 id="sedl-v3-tips-heading" className="event-detail-tips-label">
                  Before you go
                </h2>
                <ul className="event-detail-tips-list">
                  {tipItems.map((item, index) => (
                    <li key={`${index}-${item}`} className="event-detail-tips-item">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <ModalTrustCard verified={p.verified} />

            <div className="sedl-v2-route">
              <EventRouteCard event={event} />
            </div>
          </div>
        </div>

        <div className="sedl-v3-mobile-cta">
          {isEnded && lifecycleStatus ? (
            <EventLifecycleActions
              event={event}
              status={lifecycleStatus}
              now={lifecycleNow}
              linkTarget={lifecycleLinkTarget}
            />
          ) : (
            <AirbnbV1CtaRail event={event} presentation={v3} />
          )}
        </div>
      </div>

      <div className="sedl-nearby-wrap sedl-v2-nearby">
        <SharedEventNearbySection
          event={event}
          nearbyEvents={nearbyEvents}
          variant="v3"
          buildEventHref={buildNearbyEventHref}
        />
      </div>
    </div>
  )
}

export function SharedEventDesignLayout({
  event,
  nearbyEvents,
  layout,
  buildNearbyEventHref,
  lifecycleStatus,
  lifecycleNow,
  lifecycleLinkTarget,
}: SharedEventDesignLayoutProps) {
  const props = {
    event,
    nearbyEvents,
    buildNearbyEventHref,
    lifecycleStatus,
    lifecycleNow,
    lifecycleLinkTarget,
  }
  if (layout === 'luma') return <LumaLayout {...props} />
  if (layout === 'eventbrite') return <EventbriteLayout {...props} />
  if (layout === 'airbnb-v2') return <AirbnbV2Layout {...props} />
  if (layout === 'airbnb-v3') return <AirbnbV3Layout {...props} />
  return <AirbnbLayout {...props} />
}

export function SharedEventLayoutSwitcher({
  eventId,
  active,
}: {
  eventId: string
  active: SharedEventLayoutId
}) {
  return (
    <div className="sedl-switcher" role="navigation" aria-label="Layout variants">
      <p className="sedl-switcher__label">Layout refs</p>
      <div className="sedl-switcher__tabs">
        {SHARED_EVENT_LAYOUTS.map((id) => (
          <Link
            key={id}
            to={`/experiment-shared-event/event/${eventId}?layout=${id}`}
            className={['sedl-switcher__tab', active === id ? 'sedl-switcher__tab--active' : '']
              .filter(Boolean)
              .join(' ')}
          >
            {SHARED_EVENT_LAYOUT_LABELS[id]}
          </Link>
        ))}
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Event } from '../types/event'
import type { EventOpenSource } from '../types/analytics'
import { formatModalDate, formatModalTimeRange } from '../utils/dates'
import { canAddEventToCalendar, downloadEventIcs } from '../utils/calendar'
import {
  getEventAddressLine,
  getEventDirectionsLabel,
  getEventDirectionsUrl,
  getEventRoomLine,
} from '../utils/maps'
import { ANALYTICS_EVENTS, trackActivityEngagement, trackActivityOpened } from '../utils/analytics'
import { eventDetailUrl, isOfficialEventUrl } from '../utils/eventPages'
import { getEventCategoryTags } from '../utils/eventImages'
import { getEventModalAgeLabel } from '../utils/ageRange'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { ReportOutdatedForm } from './ReportOutdatedForm'
import { EventRouteCard } from './EventRouteCard'
import { EventDetailIcon } from './EventDetailIcon'
import { EventImage } from './EventImage'

export type EventDetailOverlayLayout = 'default' | 'wide'

interface EventDetailViewProps {
  event: Event
  analyticsSource?: EventOpenSource | null
  hasInAppReturn?: boolean
  onClose: () => void
  presentation?: 'page' | 'overlay'
  overlayLayout?: EventDetailOverlayLayout
}

const headerIconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

function ShareStrokeIcon() {
  return (
    <svg {...headerIconProps}>
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </svg>
  )
}

function TrustVerifyIcon() {
  return (
    <svg
      className="event-modal-trust-check-icon"
      width="17"
      height="17"
      viewBox="0 0 17 17"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8.5" cy="8.5" r="7.5" fill="#F0F9FE" stroke="#D9EFFB" strokeWidth="1" />
      <path
        d="M5.25 8.5 7.5 10.75 11.75 6.5"
        stroke="#66C5F9"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

interface EventDetailContentProps {
  event: Event
  verified: string
  directionsUrl: string | null
  addressLine: string | null
  roomLine: string | null
  categoryTags: string[]
  showReportForm: boolean
  reportSubmitted: boolean
  onReportOpen: () => void
  onReportCancel: () => void
  onReportSuccess: () => void
}

function EventDetailMetadata({
  event,
  directionsUrl,
  addressLine,
  roomLine,
  categoryTags,
}: Pick<
  EventDetailContentProps,
  'event' | 'directionsUrl' | 'addressLine' | 'roomLine' | 'categoryTags'
>) {
  return (
    <>
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
          {roomLine ? <p className="event-detail-room">{roomLine}</p> : null}
          {directionsUrl && addressLine ? (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="event-modal-address-link"
              aria-label={getEventDirectionsLabel(event)}
            >
              <span>{addressLine}</span>
              <span aria-hidden="true">↗</span>
            </a>
          ) : (
            addressLine && <p className="event-modal-address-plain">{addressLine}</p>
          )}
          {event.city ? <p className="event-detail-meta text-muted">{event.city}</p> : null}
        </div>
      </div>

      <div className="event-detail-fields">
        <div className="event-detail-row event-detail-field">
          <EventDetailIcon kind="ages" />
          <div className="event-detail-row-content">
            <div className="event-detail-field-label">Ages</div>
            <p className="event-detail-field-value">{getEventModalAgeLabel(event.ageRange)}</p>
          </div>
        </div>
        {categoryTags.length > 0 ? (
          <div className="event-detail-row event-detail-field">
            <EventDetailIcon kind="type" />
            <div className="event-detail-row-content">
              <div className="event-detail-field-label">Type</div>
              <div className="event-detail-tag-chips" aria-label="Category tags">
                {categoryTags.map((tag) => (
                  <span key={tag} className="event-detail-tag-chip">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}
        <div className="event-detail-row event-detail-field">
          <EventDetailIcon kind="type" />
          <div className="event-detail-row-content">
            <div className="event-detail-field-label">Cost</div>
            <p className="event-detail-field-value">{event.cost}</p>
          </div>
        </div>
      </div>
    </>
  )
}

function EventDetailTips({ tips }: { tips?: string }) {
  const items = parseEventTips(tips)
  if (items.length === 0) return null

  return (
    <section className="event-detail-tips" aria-labelledby="event-detail-tips-heading">
      <h2 id="event-detail-tips-heading" className="event-detail-tips-label">
        Before you go
      </h2>
      <ul className="event-detail-tips-list">
        {items.map((item, index) => (
          <li key={`${index}-${item}`} className="event-detail-tips-item">
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

function EventDetailTrustCard({
  verified,
  showReportForm,
  reportSubmitted,
  event,
  onReportOpen,
  onReportCancel,
  onReportSuccess,
}: Pick<
  EventDetailContentProps,
  | 'verified'
  | 'showReportForm'
  | 'reportSubmitted'
  | 'event'
  | 'onReportOpen'
  | 'onReportCancel'
  | 'onReportSuccess'
>) {
  return (
    <div className="event-modal-trust-card">
      <div className="event-modal-trust-header">
        <span className="event-modal-trust-check" aria-hidden="true">
          <TrustVerifyIcon />
        </span>
        <span className="event-modal-trust-header-label">Verified by Puddles</span>
        <span className="event-modal-trust-timestamp">· Last checked {verified}</span>
      </div>
      <p className="event-modal-trust-note">
        Details can change. Please check the official page before you go.
      </p>

      {reportSubmitted ? (
        <p className="event-modal-trust-action report-outdated-success" role="status">
          Thanks — we&apos;ll review this event soon.
        </p>
      ) : showReportForm ? (
        <div className="event-modal-trust-action">
          <ReportOutdatedForm
            event={event}
            onCancel={onReportCancel}
            onSuccess={onReportSuccess}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={onReportOpen}
          className="event-modal-trust-action event-modal-trust-report-link"
        >
          Report outdated info
        </button>
      )}
    </div>
  )
}

function EventDetailActions({
  event,
  canAddToCalendar,
  hasOfficialPage,
  className = 'event-modal-actions shrink-0 border-t border-border bg-white px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]',
}: {
  event: Event
  canAddToCalendar: boolean
  hasOfficialPage: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => {
          const ok = downloadEventIcs(event)
          if (ok) trackActivityEngagement(ANALYTICS_EVENTS.ADD_TO_CALENDAR_CLICKED, event)
        }}
        disabled={!canAddToCalendar}
        className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        Add to calendar
      </button>
      {!canAddToCalendar ? (
        <p className="event-modal-actions-note text-center">Calendar details unavailable</p>
      ) : null}
      {hasOfficialPage ? (
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
  )
}

export function EventDetailView({
  event,
  analyticsSource = 'discovery',
  hasInAppReturn = false,
  onClose,
  presentation = 'page',
  overlayLayout = 'default',
}: EventDetailViewProps) {
  const isOverlay = presentation === 'overlay'
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const isWideDesktop = isOverlay && overlayLayout === 'wide' && isDesktop
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportSubmitted, setReportSubmitted] = useState(false)
  const [headerCollapsed, setHeaderCollapsed] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLImageElement>(null)

  const verified = new Date(event.verifiedDate + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const directionsUrl = getEventDirectionsUrl(event)
  const addressLine = getEventAddressLine(event)
  const roomLine = getEventRoomLine(event)
  const canAddToCalendar = canAddEventToCalendar(event)
  const hasOfficialPage = isOfficialEventUrl(event.eventUrl)
  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator
  const shareUrl = eventDetailUrl(event)
  const categoryTags = getEventCategoryTags(event)

  useEffect(() => {
    trackActivityOpened(event, analyticsSource ?? 'discovery')
  }, [event, analyticsSource])

  function handleScroll() {
    if (isWideDesktop) return
    const scrollEl = scrollRef.current
    const heroEl = heroRef.current
    if (!scrollEl || !heroEl) return

    const collapseAt = Math.max(heroEl.offsetHeight - 56, 80)
    setHeaderCollapsed(scrollEl.scrollTop > collapseAt)
  }

  async function handleShare() {
    trackActivityEngagement(ANALYTICS_EVENTS.ACTIVITY_SHARED, event)

    if (canNativeShare) {
      try {
        await navigator.share({
          title: event.title,
          text: `${formatModalDate(event.date)} · ${event.venue}`,
          url: shareUrl,
        })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(
        [event.title, `${formatModalDate(event.date)} · ${event.venue}`, shareUrl]
          .filter(Boolean)
          .join('\n'),
      )
    } catch {
      // Clipboard unavailable — no-op.
    }
  }

  const contentProps: EventDetailContentProps = {
    event,
    verified,
    directionsUrl,
    addressLine,
    roomLine,
    categoryTags,
    showReportForm,
    reportSubmitted,
    onReportOpen: () => {
      setShowReportForm(true)
    },
    onReportCancel: () => setShowReportForm(false),
    onReportSuccess: () => {
      setShowReportForm(false)
      setReportSubmitted(true)
    },
  }

  function renderCloseButton(className: string) {
    return (
      <button type="button" onClick={onClose} className={className} aria-label="Close event">
        <CloseIcon />
      </button>
    )
  }

  if (isWideDesktop) {
    return (
      <article className="event-detail-page-panel event-modal-panel event-modal-panel--overlay event-modal-panel--wide">
        <div className="event-modal-floating-actions">
          <button
            type="button"
            onClick={() => void handleShare()}
            className="event-modal-header-icon-btn"
            aria-label="Share event"
          >
            <ShareStrokeIcon />
          </button>
          {renderCloseButton('event-modal-close-btn event-modal-close-btn--floating')}
        </div>

        <div ref={scrollRef} className="event-modal-scroll">
          <div className="event-modal-wide-layout">
            <div className="event-modal-wide-layout__main">
              <EventImage
                event={event}
                className="event-modal-hero event-modal-hero--wide w-full object-cover"
                loading="eager"
              />
              <h1 className="event-detail-title">{event.title}</h1>
              {event.description ? (
                <p className="event-detail-body">{event.description}</p>
              ) : null}
              <EventDetailTips tips={event.tips} />
            </div>

            <aside className="event-modal-wide-layout__side">
              <EventDetailMetadata {...contentProps} />
              <EventDetailTrustCard {...contentProps} />
              <EventRouteCard event={event} />
              <EventDetailActions
                event={event}
                canAddToCalendar={canAddToCalendar}
                hasOfficialPage={hasOfficialPage}
                className="event-modal-actions event-modal-actions--inline"
              />
            </aside>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article
      className={[
        'event-detail-page-panel event-modal-panel',
        isOverlay ? 'event-modal-panel--overlay' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {(!headerCollapsed || isOverlay) ? (
        renderCloseButton(
          [
            'event-modal-close-btn event-modal-close-btn--floating',
            isOverlay ? 'event-modal-close-btn--persistent' : '',
          ]
            .filter(Boolean)
            .join(' '),
        )
      ) : null}

      <div
        className={[
          'event-modal-sticky-header',
          headerCollapsed
            ? 'event-modal-sticky-header--collapsed'
            : 'event-modal-sticky-header--overlay',
        ].join(' ')}
      >
        {headerCollapsed ? (
          <h1 className="event-modal-sticky-title">{event.title}</h1>
        ) : (
          <span className="event-modal-sticky-spacer" aria-hidden />
        )}
        <div className="event-modal-header-actions">
          <button
            type="button"
            onClick={() => void handleShare()}
            className="event-modal-header-icon-btn"
            aria-label="Share event"
          >
            <ShareStrokeIcon />
          </button>
          {headerCollapsed && !isOverlay ? renderCloseButton('event-modal-close-btn') : null}
        </div>
      </div>

      <div ref={scrollRef} className="event-modal-scroll" onScroll={handleScroll}>
        <EventImage
          ref={heroRef}
          event={event}
          className="event-modal-hero w-full object-cover"
          loading="eager"
          onLoad={handleScroll}
        />

        <div className="event-modal-content px-6 pb-6 pt-6">
          <h1 className="event-detail-title">{event.title}</h1>

          {!hasInAppReturn ? (
            <p className="event-detail-direct-fallback">
              <Link to="/browse">Browse more events</Link>
            </p>
          ) : null}

          <div className="mt-2">
            <EventDetailMetadata {...contentProps} />
          </div>

          {event.description ? <p className="event-detail-body">{event.description}</p> : null}

          <EventDetailTips tips={event.tips} />

          <EventDetailTrustCard {...contentProps} />

          <EventRouteCard event={event} />
        </div>
      </div>

      <EventDetailActions
        event={event}
        canAddToCalendar={canAddToCalendar}
        hasOfficialPage={hasOfficialPage}
      />
    </article>
  )
}

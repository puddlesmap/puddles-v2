import { useEffect, useRef, useState } from 'react'
import type { Event } from '../types/event'
import type { EventOpenSource } from '../types/analytics'
import { formatModalDate, formatModalTimeRange } from '../utils/dates'
import {
  canAddEventToCalendar,
  downloadEventIcs,
} from '../utils/calendar'
import {
  getEventAddressLine,
  getEventDirectionsLabel,
  getEventDirectionsUrl,
  getEventRoomLine,
} from '../utils/maps'
import { eventAnalyticsProps, track } from '../utils/analytics'
import { ReportOutdatedForm } from './ReportOutdatedForm'
import { EventRouteCard } from './EventRouteCard'
import { EventDetailIcon } from './EventDetailIcon'
import { EventImage } from './EventImage'

interface EventModalProps {
  event: Event
  eventOpenSource: EventOpenSource | null
  onClose: () => void
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

function CloseStrokeIcon() {
  return (
    <svg {...headerIconProps}>
      <path d="M7 7l10 10" />
      <path d="m17 7-10 10" />
    </svg>
  )
}

export function EventModal({ event, eventOpenSource, onClose }: EventModalProps) {
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
  const hasOfficialPage = Boolean(event.eventUrl?.trim())
  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator
  const shareUrl =
    event.eventUrl?.trim() && event.eventUrl !== '#'
      ? event.eventUrl
      : typeof window !== 'undefined'
        ? window.location.href
        : ''

  useEffect(() => {
    track(
      'event_open',
      eventAnalyticsProps(event, { source: eventOpenSource ?? 'discovery' }),
    )
  }, [event.id, event.city, eventOpenSource])

  function handleScroll() {
    const scrollEl = scrollRef.current
    const heroEl = heroRef.current
    if (!scrollEl || !heroEl) return

    const collapseAt = Math.max(heroEl.offsetHeight - 56, 80)
    setHeaderCollapsed(scrollEl.scrollTop > collapseAt)
  }

  const headerActions = (
    <div className="event-modal-header-actions">
      <button
        type="button"
        onClick={() => void handleShare()}
        className="event-modal-header-icon-btn"
        aria-label="Share event"
      >
        <ShareStrokeIcon />
      </button>
      <button
        type="button"
        onClick={onClose}
        className="event-modal-close-btn flex items-center justify-center"
        aria-label="Close"
      >
        <CloseStrokeIcon />
      </button>
    </div>
  )

  function handleAddToCalendar() {
    const ok = downloadEventIcs(event)
    if (ok) {
      track('add_to_calendar', eventAnalyticsProps(event))
    }
  }

  async function handleShare() {
    track('event_share', eventAnalyticsProps(event))

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

  function handleReportOutdatedOpen() {
    track('report_outdated_open', eventAnalyticsProps(event))
    setShowReportForm(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center md:p-6" onClick={onClose}>
      <div
        className="event-modal-panel animate-fade-in flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white md:rounded-2xl"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={[
            'event-modal-sticky-header',
            headerCollapsed ? 'event-modal-sticky-header--collapsed' : 'event-modal-sticky-header--overlay',
          ].join(' ')}
        >
          {headerCollapsed ? (
            <h2 className="event-modal-sticky-title">{event.title}</h2>
          ) : null}
          {headerActions}
        </div>

        <div
          ref={scrollRef}
          className="event-modal-scroll flex-1 overflow-y-auto overscroll-contain"
          onScroll={handleScroll}
        >
          <EventImage
            ref={heroRef}
            event={event}
            className="event-modal-hero w-full object-cover"
            loading="eager"
            onLoad={handleScroll}
          />

          <div className="event-modal-content px-6 pb-6 pt-6">
            <h2 className="event-detail-title">{event.title}</h2>

          <div className="event-detail-row mt-2">
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
                  onClick={() => track('address_link_click', eventAnalyticsProps(event))}
                >
                  <span>{addressLine}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              ) : (
                addressLine && <p className="event-modal-address-plain">{addressLine}</p>
              )}
            </div>
          </div>

          <div className="event-detail-fields">
            <div className="event-detail-row event-detail-field">
              <EventDetailIcon kind="ages" />
              <div className="event-detail-row-content">
                <div className="event-detail-field-label">Ages</div>
                <p className="event-detail-field-value">{event.ageRange}</p>
              </div>
            </div>
            {(event.categoryTags.length > 0 ? event.categoryTags : event.types).length > 0 ? (
              <div className="event-detail-row event-detail-field">
                <EventDetailIcon kind="type" />
                <div className="event-detail-row-content">
                  <div className="event-detail-field-label">Type</div>
                  <div className="event-detail-tag-chips" aria-label="Category tags">
                    {(event.categoryTags.length > 0 ? event.categoryTags : event.types).map((tag) => (
                      <span key={tag} className="event-detail-tag-chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="event-modal-trust-card">
            <div className="event-modal-trust-header">
              <span className="event-modal-trust-check" aria-hidden="true">
                ✓
              </span>
              <span className="event-modal-trust-header-label">Verified by Puddles</span>
              <span className="event-modal-trust-timestamp">· Last checked {verified}</span>
            </div>
            <p className="event-modal-trust-note">
              <span className="event-modal-trust-note-icon" aria-hidden="true">
                ⓘ
              </span>
              Things change. Check the official page before you go!
            </p>

            {reportSubmitted ? (
              <p className="event-modal-trust-action report-outdated-success" role="status">
                Thanks — we&apos;ll review this event soon.
              </p>
            ) : showReportForm ? (
              <div className="event-modal-trust-action">
                <ReportOutdatedForm
                  event={event}
                  onCancel={() => setShowReportForm(false)}
                  onSuccess={() => {
                    setShowReportForm(false)
                    setReportSubmitted(true)
                  }}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={handleReportOutdatedOpen}
                className="event-modal-trust-action event-modal-trust-report-link"
              >
                Report outdated
              </button>
            )}
          </div>

          <p className="event-detail-body">{event.description}</p>

          <EventRouteCard event={event} />
          </div>
        </div>

        <div className="event-modal-actions shrink-0 border-t border-border bg-white px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={handleAddToCalendar}
            disabled={!canAddToCalendar}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add to calendar
          </button>
          {!canAddToCalendar && (
            <p className="event-modal-actions-note text-center">Calendar details unavailable</p>
          )}
          {hasOfficialPage && (
            <a
              href={event.eventUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
              onClick={() => track('visit_official_page', eventAnalyticsProps(event))}
            >
              Visit official page
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState, type MouseEvent } from 'react'
import type { Event } from '../../types/event'
import { EventImage } from '../EventImage'
import { EventDetailIcon } from '../EventDetailIcon'
import { EventRouteCard } from '../EventRouteCard'
import { ReportOutdatedForm } from '../ReportOutdatedForm'
import { AddToCalendarButton } from '../calendar/AddToCalendarButton'
import { SaveHeartIcon } from '../saved/SaveHeartIcon'
import { useSavedOptional } from '../../context/SavedContext'
import { BeforeYouGoTipItems } from './BeforeYouGoIcon'
import { RelativeDateLabel } from './RelativeDateLabel'
import { SharedEventNearbySection } from './SharedEventNearbySection'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { ANALYTICS_EVENTS, trackActivityEngagement } from '../../utils/analytics'
import { formatModalDate, formatModalTimeRange } from '../../utils/dates'
import { eventDetailUrl, isOfficialEventUrl } from '../../utils/eventPages'
import {
  formatSeasonalDetailWhenCompact,
  getEventDetailAgeLabel,
} from '../../utils/eventDetailDisplay'
import { getEventCategoryTags } from '../../utils/eventImages'
import { eventUsesSeasonalWhen, type SeasonalWhenRow } from '../../utils/formatSeasonalSchedule'
import {
  getEventAddressLine,
  getEventDirectionsLabel,
  getEventDirectionsUrl,
  getEventRoomLine,
  isCityShownInAddress,
} from '../../utils/maps'
import { parseEventTips, stripLogisticsFromDescription } from '../../utils/eventTips'
import {
  capitalizeCitiesInText,
  keepCityNameOnOneLine,
  sharedEventCityLabel,
} from '../../utils/sharedEventNearby'
import '../../views/experiment-event-detail-fullpage.css'

function toWhenRows(lines: string[]): SeasonalWhenRow[] {
  return lines.filter(Boolean).map((text) => ({ text }))
}

function whenRowClass(base: string, row: SeasonalWhenRow, index: number): string {
  if (row.variant === 'note' || index > 0) {
    return `${base} edfp-when-secondary`
  }
  return base
}

/** One date + one time (or a single time line) — not a multi-session / Through series. */
function isSimpleWhenBlock(rows: SeasonalWhenRow[]): boolean {
  const content = rows.filter((row) => row.variant !== 'note')
  return content.length > 0 && content.length <= 2
}

function WhenRows({ rows }: { rows: SeasonalWhenRow[] }) {
  const simple = isSimpleWhenBlock(rows)
  return (
    <div className={simple ? 'edfp-when edfp-when--simple' : 'edfp-when'}>
      {rows.map((row, index) => (
        <p
          key={`${row.text}-${index}`}
          className={whenRowClass(
            row.variant === 'note' ? 'sedl-when-note event-detail-field-value' : 'event-detail-field-value',
            row,
            index,
          )}
          style={index > 0 ? { marginTop: '0.15rem' } : undefined}
        >
          {index === 0 ? <RelativeDateLabel label={row.text} /> : row.text}
        </p>
      ))}
    </div>
  )
}

function FactWhenRows({ rows }: { rows: SeasonalWhenRow[] }) {
  return (
    <>
      {rows.map((row, index) => (
        <p
          key={`${row.text}-${index}`}
          className={whenRowClass(
            row.variant === 'note' ? 'sedl-when-note sedl-fact-value' : 'sedl-fact-value',
            row,
            index,
          )}
          style={index > 0 ? { marginTop: '0.15rem' } : undefined}
        >
          {index === 0 ? <RelativeDateLabel label={row.text} /> : row.text}
        </p>
      ))}
    </>
  )
}

function useDetailPresentation(event: Event, now: Date = new Date()) {
  const seasonalRows = eventUsesSeasonalWhen(event)
    ? formatSeasonalDetailWhenCompact(event, now)
    : null
  const whenRows =
    seasonalRows ??
    toWhenRows(
      [formatModalDate(event.date), formatModalTimeRange(event.startTime, event.endTime)].filter(
        (line): line is string => Boolean(line),
      ),
    )
  const addressLine = keepCityNameOnOneLine(
    capitalizeCitiesInText(getEventAddressLine(event), event.city),
    event.city,
  )
  const directionsUrl = getEventDirectionsUrl(event)
  const hasOfficial = isOfficialEventUrl(event.eventUrl)
  const tags = getEventCategoryTags(event)
  const city = sharedEventCityLabel(event.city || '')
  const roomLine = getEventRoomLine(event)
  const ageLabel = getEventDetailAgeLabel(event)
  const shareUrl = eventDetailUrl(event)
  const tipItems = parseEventTips(event.tips)
  const displayDescription = event.description
    ? stripLogisticsFromDescription(event.description)
    : ''
  const verified = new Date(`${event.verifiedDate}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  async function handleShare() {
    trackActivityEngagement(ANALYTICS_EVENTS.ACTIVITY_SHARED, event)
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: event.title, url: shareUrl })
        return
      } catch {
        /* fall through */
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      /* no-op */
    }
  }

  return {
    whenRows,
    addressLine,
    directionsUrl,
    hasOfficial,
    tags,
    city,
    roomLine,
    ageLabel,
    tipItems,
    displayDescription,
    verified,
    handleShare,
  }
}

function SavePillButton({ eventId }: { eventId: string }) {
  const saved = useSavedOptional()
  if (!saved) return null
  const isSaved = saved.isSaved(eventId)

  function onClick(clickEvent: MouseEvent) {
    clickEvent.preventDefault()
    clickEvent.stopPropagation()
    saved!.toggleSave(eventId)
  }

  return (
    <button
      type="button"
      className={[
        'edfp-pill',
        'edfp-pill--save',
        isSaved ? 'edfp-pill--saved' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={isSaved ? 'Remove from saved' : 'Save activity'}
      aria-pressed={isSaved}
      onClick={onClick}
    >
      <SaveHeartIcon saved={isSaved} size={16} variant="chrome" />
      <span>Save</span>
    </button>
  )
}

function SharePillButton({ onShare }: { onShare: () => void }) {
  return (
    <button type="button" className="edfp-pill edfp-pill--share" onClick={onShare}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>Share</span>
    </button>
  )
}

/** Same circle chrome as Back/Share — avoids SaveHeartButton absolute/card styles. */
function ChromeSaveButton({ eventId }: { eventId: string }) {
  const saved = useSavedOptional()
  if (!saved) return null
  const isSaved = saved.isSaved(eventId)

  function onClick(clickEvent: MouseEvent) {
    clickEvent.preventDefault()
    clickEvent.stopPropagation()
    saved!.toggleSave(eventId)
  }

  return (
    <button
      type="button"
      className="edfp-chrome-btn edfp-chrome-save"
      aria-label={isSaved ? 'Remove from saved' : 'Save activity'}
      aria-pressed={isSaved}
      onClick={onClick}
    >
      <SaveHeartIcon saved={isSaved} size={18} variant="chrome" />
    </button>
  )
}

function LocationBlock({
  event,
  venue,
  roomLine,
  addressLine,
  directionsUrl,
  city,
}: {
  event: Event
  venue?: string
  roomLine?: string
  addressLine: string
  directionsUrl: string | null
  city: string
}) {
  return (
    <div className="event-detail-row-content">
      {venue ? <p className="event-detail-venue">{venue}</p> : null}
      {roomLine ? <p className="event-detail-room">{roomLine}</p> : null}
      {directionsUrl && addressLine ? (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="event-modal-address-link"
          aria-label={getEventDirectionsLabel(event)}
          onClick={() => trackActivityEngagement(ANALYTICS_EVENTS.OPEN_ROUTE_CLICKED, event)}
        >
          <span>{addressLine}</span>
          <span aria-hidden="true">↗</span>
        </a>
      ) : (
        addressLine && <p className="event-modal-address-plain">{addressLine}</p>
      )}
      {event.city && !isCityShownInAddress(addressLine ?? '', event.city) ? (
        <p className="event-detail-meta text-muted">{city}</p>
      ) : null}
    </div>
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

function TrustCard({
  event,
  verified,
  showReportForm,
  reportSubmitted,
  onReportOpen,
  onReportCancel,
  onReportSuccess,
}: {
  event: Event
  verified: string
  showReportForm: boolean
  reportSubmitted: boolean
  onReportOpen: () => void
  onReportCancel: () => void
  onReportSuccess: () => void
}) {
  return (
    <div className="event-modal-trust-card sedl-v2-trust">
      <div className="event-modal-trust-header">
        <span className="event-modal-trust-check" aria-hidden="true">
          <TrustVerifyIcon />
        </span>
        <span className="event-modal-trust-header-label">Verified by Puddles</span>
        <span className="event-modal-trust-timestamp">· Last checked {verified}</span>
      </div>
      <p className="event-modal-trust-note">Before you head out, please check the official page.</p>

      {reportSubmitted ? (
        <p className="event-modal-trust-action report-outdated-success" role="status">
          Thanks — we&apos;ll review this event soon.
        </p>
      ) : showReportForm ? (
        <div className="event-modal-trust-action">
          <ReportOutdatedForm event={event} onCancel={onReportCancel} onSuccess={onReportSuccess} />
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

function ShareChromeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BackChromeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CtaButtons({ event, hasOfficial }: { event: Event; hasOfficial: boolean }) {
  return (
    <>
      <AddToCalendarButton event={event} variant="primary" className="sedl-cta" />
      {hasOfficial ? (
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
    </>
  )
}

export function EventDetailFullpageMockLayout({
  event,
  nearbyEvents,
  onBack,
  buildNearbyEventHref,
}: {
  event: Event
  nearbyEvents: Event[]
  onBack: () => void
  buildNearbyEventHref?: (eventId: string) => string
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const p = useDetailPresentation(event)
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportSubmitted, setReportSubmitted] = useState(false)
  const [headerCollapsed, setHeaderCollapsed] = useState(false)
  const heroWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isDesktop) {
      setHeaderCollapsed(false)
      return
    }

    function updateCollapsed() {
      const heroEl = heroWrapRef.current
      if (!heroEl) return
      const collapseAt = Math.max(heroEl.offsetHeight - 56, 80)
      setHeaderCollapsed(window.scrollY > collapseAt)
    }

    updateCollapsed()
    window.addEventListener('scroll', updateCollapsed, { passive: true })
    window.addEventListener('resize', updateCollapsed)
    return () => {
      window.removeEventListener('scroll', updateCollapsed)
      window.removeEventListener('resize', updateCollapsed)
    }
  }, [isDesktop, event.id])

  const trustProps = {
    event,
    verified: p.verified,
    showReportForm,
    reportSubmitted,
    onReportOpen: () => setShowReportForm(true),
    onReportCancel: () => setShowReportForm(false),
    onReportSuccess: () => {
      setShowReportForm(false)
      setReportSubmitted(true)
    },
  }

  if (isDesktop) {
    return (
      <div className="edfp sedl sedl--airbnb sedl--airbnb-v3 sedl--airbnb-v3-desktop">
        <div className="sedl-airbnb-hero edfp-hero-media">
          <EventImage event={event} className="sedl-airbnb-hero__img" loading="eager" />
        </div>

        <div className="sedl-airbnb-shell">
          <div className="sedl-airbnb-main">
            <p className="sedl-kicker">{p.city}</p>
            <div className="edfp-title-row">
              <h1 className="sedl-airbnb-title edfp-title-row__title">{event.title}</h1>
              <div className="edfp-title-row__actions">
                <SavePillButton eventId={event.id} />
                <SharePillButton onShare={() => void p.handleShare()} />
              </div>
            </div>

            {p.displayDescription ? (
              <p className="sedl-body sedl-v3-desktop-desc">{p.displayDescription}</p>
            ) : null}

            <div className="sedl-airbnb-facts">
              <div>
                <p className="sedl-fact-label">When</p>
                <div className="sedl-fact-value">
                  <FactWhenRows rows={p.whenRows} />
                </div>
              </div>
              <div>
                <p className="sedl-fact-label">Where</p>
                <div className="sedl-fact-value">
                  {event.venue ? <p>{event.venue}</p> : null}
                  {p.roomLine ? <p className="text-muted">{p.roomLine}</p> : null}
                  {p.directionsUrl && p.addressLine ? (
                    <a
                      href={p.directionsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="event-modal-address-link"
                      aria-label={getEventDirectionsLabel(event)}
                    >
                      <span>{p.addressLine}</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    p.addressLine && <p>{p.addressLine}</p>
                  )}
                </div>
              </div>
              <div>
                <p className="sedl-fact-label">Cost</p>
                <p className="sedl-fact-value">{event.cost}</p>
              </div>
              <div>
                <p className="sedl-fact-label">Ages</p>
                <p className="sedl-fact-value">{p.ageLabel}</p>
              </div>
              {p.tags.length > 0 ? (
                <div>
                  <p className="sedl-fact-label">Type</p>
                  <p className="sedl-fact-value">{p.tags.join(' · ')}</p>
                </div>
              ) : null}
            </div>

            {p.tipItems.length > 0 ? (
              <section className="sedl-section">
                <h2 className="sedl-section-title">Good to know</h2>
                <ul className="event-detail-tips-list sedl-tips-list">
                  <BeforeYouGoTipItems items={p.tipItems} />
                </ul>
              </section>
            ) : null}

            <section className="sedl-section">
              <TrustCard {...trustProps} />
            </section>

            <div className="sedl-v2-route">
              <EventRouteCard event={event} />
            </div>
          </div>

          <aside className="sedl-airbnb-rail" aria-label="Plan this activity">
            <p className="sedl-airbnb-rail__cost">{event.cost}</p>
            <p className="sedl-airbnb-rail__age">{p.ageLabel}</p>
            <p className="sedl-airbnb-rail__when">
              {p.whenRows.map((row, index) => (
                <span key={`${row.text}-${index}`}>
                  {index > 0 ? <br /> : null}
                  {index === 0 ? <RelativeDateLabel label={row.text} /> : row.text}
                </span>
              ))}
            </p>
            <p className="sedl-airbnb-rail__where">
              {event.venue || p.city}
              {p.roomLine ? (
                <>
                  <br />
                  <span className="sedl-airbnb-rail__room">{p.roomLine}</span>
                </>
              ) : null}
            </p>
            <CtaButtons event={event} hasOfficial={p.hasOfficial} />
          </aside>
        </div>

        <div className="sedl-nearby-wrap">
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

  return (
    <div className="edfp edfp--mobile sedl sedl--airbnb-v2 sedl--airbnb-v3 sedl--airbnb-v3-mobile">
      <div
        className={[
          'edfp-sticky-header',
          headerCollapsed ? 'edfp-sticky-header--collapsed' : 'edfp-sticky-header--overlay',
        ].join(' ')}
      >
        {headerCollapsed ? (
          <>
            <button type="button" className="edfp-chrome-btn" aria-label="Back" onClick={onBack}>
              <BackChromeIcon />
            </button>
            <h1 className="edfp-sticky-title">{event.title}</h1>
            <div className="edfp-sticky-header__end">
              <ChromeSaveButton eventId={event.id} />
              <button
                type="button"
                className="edfp-chrome-btn"
                aria-label="Share event"
                onClick={() => void p.handleShare()}
              >
                <ShareChromeIcon />
              </button>
            </div>
          </>
        ) : (
          <span className="edfp-sticky-spacer" aria-hidden />
        )}
      </div>

      <div ref={heroWrapRef} className="sedl-v2-hero-wrap edfp-hero edfp-hero-media">
        <EventImage event={event} className="sedl-v2-hero event-modal-hero" loading="eager" />
        {!headerCollapsed ? (
          <div className="edfp-hero-chrome">
            <button type="button" className="edfp-chrome-btn" aria-label="Back" onClick={onBack}>
              <BackChromeIcon />
            </button>
            <div className="edfp-hero-chrome__end">
              <ChromeSaveButton eventId={event.id} />
              <button
                type="button"
                className="edfp-chrome-btn"
                aria-label="Share event"
                onClick={() => void p.handleShare()}
              >
                <ShareChromeIcon />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="sedl-v2-shell sedl-v3-mobile-shell edfp-mobile-shell">
        <div className="sedl-v2-main">
          <div className="sedl-v2-content">
            <h1 className="event-detail-title sedl-v2-title">{event.title}</h1>

            <div className="sedl-v2-meta event-detail-fields">
              <div className="event-detail-row">
                <EventDetailIcon kind="time" />
                <div className="event-detail-row-content">
                  <WhenRows rows={p.whenRows} />
                </div>
              </div>

              <div className="event-detail-row event-detail-location">
                <EventDetailIcon kind="location" />
                <LocationBlock
                  event={event}
                  venue={event.venue}
                  roomLine={p.roomLine}
                  addressLine={p.addressLine}
                  directionsUrl={p.directionsUrl}
                  city={p.city}
                />
              </div>

              <div className="event-detail-row event-detail-field">
                <EventDetailIcon kind="ages" />
                <div className="event-detail-row-content">
                  <div className="event-detail-field-label">Ages</div>
                  <p className="event-detail-field-value">{p.ageLabel}</p>
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

            {p.displayDescription ? (
              <p className="event-detail-body sedl-v2-body edfp-mobile-desc">{p.displayDescription}</p>
            ) : null}

            {p.tipItems.length > 0 ? (
              <section className="event-detail-tips" aria-labelledby="edfp-tips-heading">
                <h2 id="edfp-tips-heading" className="event-detail-tips-label">
                  Before you go
                </h2>
                <ul className="event-detail-tips-list">
                  <BeforeYouGoTipItems items={p.tipItems} />
                </ul>
              </section>
            ) : null}

            <TrustCard {...trustProps} />

            <div className="sedl-v2-route">
              <EventRouteCard event={event} />
            </div>
          </div>
        </div>
      </div>

      <div className="sedl-nearby-wrap sedl-v2-nearby edfp-nearby">
        <SharedEventNearbySection
          event={event}
          nearbyEvents={nearbyEvents}
          variant="v3"
          buildEventHref={buildNearbyEventHref}
        />
      </div>

      <div className="edfp-sticky-cta" role="region" aria-label="Plan this activity">
        <div className="edfp-sticky-cta__actions">
          <CtaButtons event={event} hasOfficial={p.hasOfficial} />
        </div>
      </div>
    </div>
  )
}

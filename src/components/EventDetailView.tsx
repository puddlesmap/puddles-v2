import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Event } from '../types/event'
import type { EventOpenSource } from '../types/analytics'
import { formatModalDate, formatModalTimeRange } from '../utils/dates'
import {
  buildClipboardShareText,
  buildNativeSharePayload,
} from '../utils/eventShare'
import { addEventToCalendar, canAddEventToCalendar, isLikelyInAppBrowser } from '../utils/calendar'
import type { EventLifecycleStatus } from '../utils/eventLifecycle'
import type { LifecycleLinkTarget } from '../utils/eventLifecycleBrowse'
import { EventLifecycleBanner } from './event-detail/EventLifecycleBanner'
import { EventLifecycleActions } from './event-detail/EventLifecycleActions'
import { SharedEventVisitorIntro } from './event-detail/SharedEventVisitorIntro'
import { RelativeDateLabel } from './event-detail/RelativeDateLabel'
import {
  getEventAddressLine,
  getEventDirectionsLabel,
  getEventDirectionsUrl,
  getEventRoomLine,
  isCityShownInAddress,
} from '../utils/maps'
import { capitalizeCitiesInText, sharedEventCityLabel } from '../utils/sharedEventNearby'
import { ANALYTICS_EVENTS, trackActivityEngagement, trackActivityOpened } from '../utils/analytics'
import { eventDetailUrl, isOfficialEventUrl } from '../utils/eventPages'
import { getEventCategoryTags } from '../utils/eventImages'
import { getEventModalAgeLabel } from '../utils/ageRange'
import { parseEventTips } from '../utils/eventTips'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { ReportOutdatedForm } from './ReportOutdatedForm'
import { EventRouteCard } from './EventRouteCard'
import { EventDetailIcon } from './EventDetailIcon'
import { EventImage } from './EventImage'
import { AirbnbV3DesktopContent } from './event-detail/SharedEventDesignLayouts'

export type EventDetailOverlayLayout = 'default' | 'wide' | 'v3'

interface EventDetailViewProps {
  event: Event
  analyticsSource?: EventOpenSource | null
  hasInAppReturn?: boolean
  onClose: () => void
  presentation?: 'page' | 'overlay'
  overlayLayout?: EventDetailOverlayLayout
  /** Share + close in top-right; no bottom Cancel/Share utility row */
  shareInHeader?: boolean
  lifecycleStatus?: EventLifecycleStatus
  lifecycleNow?: Date
  /** Where ended-state CTAs point (defaults to production /event + /browse). */
  lifecycleLinkTarget?: LifecycleLinkTarget
  /** Direct shared URL for first-time visitors — site header context, no close control */
  visitorContext?: 'shared-direct'
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

function ShareIcon() {
  return (
    <svg {...headerIconProps}>
      <path d="M12 3v10" />
      <path d="m8 7 4-4 4 4" />
      <path d="M7 13v7h10v-7" />
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
          <p className="event-detail-meta">
            <RelativeDateLabel label={formatModalDate(event.date)} />
          </p>
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
          {event.city && !isCityShownInAddress(addressLine ?? '', event.city) ? (
            <p className="event-detail-meta text-muted">{sharedEventCityLabel(event.city)}</p>
          ) : null}
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
          <EventDetailIcon kind="cost" />
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
        Before you head out, please check the official page.
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
  onShare,
  onClose,
  shareInHeader = false,
  hideCloseButton = false,
  className = 'event-modal-actions shrink-0 border-t border-border bg-white px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]',
}: {
  event: Event
  canAddToCalendar: boolean
  hasOfficialPage: boolean
  onShare?: () => void
  onClose?: () => void
  shareInHeader?: boolean
  hideCloseButton?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <div className="event-modal-actions__ctas">
        <button
          type="button"
          onClick={() => {
            const result = addEventToCalendar(event)
            if (result) trackActivityEngagement(ANALYTICS_EVENTS.ADD_TO_CALENDAR_CLICKED, event)
          }}
          disabled={!canAddToCalendar}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add to calendar
        </button>
        {!canAddToCalendar ? (
          <p className="event-modal-actions-note text-center">Calendar details unavailable</p>
        ) : isLikelyInAppBrowser() ? (
          <p className="event-modal-actions-note text-center">Opens Google Calendar</p>
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
      {!shareInHeader && onShare && (onClose || hideCloseButton) ? (
        <div className="event-modal-actions__utility">
          {onClose && !hideCloseButton ? (
            <button type="button" onClick={onClose} className="event-modal-cancel-btn">
              Cancel
            </button>
          ) : null}
          <button
            type="button"
            onClick={onShare}
            className="event-modal-share-btn"
            aria-label="Share event"
          >
            <ShareIcon />
          </button>
        </div>
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
  shareInHeader = false,
  lifecycleStatus,
  lifecycleNow = new Date(),
  lifecycleLinkTarget = 'production',
  visitorContext,
}: EventDetailViewProps) {
  const isOverlay = presentation === 'overlay'
  const hideCloseControl = visitorContext === 'shared-direct'
  const isEndedLifecycle =
    lifecycleStatus === 'ended' ||
    lifecycleStatus === 'archived' ||
    lifecycleStatus === 'cancelled'
  const effectiveShareInHeader = shareInHeader || isEndedLifecycle
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const isWideDesktop = isOverlay && overlayLayout === 'wide' && isDesktop
  const isV3Desktop = isOverlay && overlayLayout === 'v3' && isDesktop
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
  const addressLine = capitalizeCitiesInText(getEventAddressLine(event) ?? '', event.city) || null
  const roomLine = getEventRoomLine(event)
  const description = event.description
    ? capitalizeCitiesInText(event.description, event.city)
    : ''
  const canAddToCalendar = canAddEventToCalendar(event)
  const hasOfficialPage = isOfficialEventUrl(event.eventUrl)
  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator
  const shareUrl = eventDetailUrl(event)
  const categoryTags = getEventCategoryTags(event)

  useEffect(() => {
    trackActivityOpened(event, analyticsSource ?? 'discovery')
  }, [event, analyticsSource])

  function handleScroll() {
    if (isWideDesktop || isV3Desktop) return
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
        const payload = buildNativeSharePayload(event, shareUrl)
        await navigator.share(payload)
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(buildClipboardShareText(event, shareUrl))
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

  function renderCloseButton(className: string, ariaLabel = 'Close event') {
    return (
      <button type="button" onClick={onClose} className={className} aria-label={ariaLabel}>
        <CloseIcon />
      </button>
    )
  }

  function renderShareButton(className: string) {
    return (
      <button
        type="button"
        onClick={() => void handleShare()}
        className={className}
        aria-label="Share event"
      >
        <ShareIcon />
      </button>
    )
  }

  function renderFloatingHeaderActions(closeClassName: string) {
    const closeLabel = effectiveShareInHeader ? 'Close event details' : 'Close event'
    const showClose = !hideCloseControl

    return (
      <div
        className={[
          'event-modal-floating-actions',
          'event-modal-floating-actions--persistent',
          effectiveShareInHeader ? 'event-modal-floating-actions--header-utility' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {effectiveShareInHeader ? renderShareButton('event-modal-share-btn event-modal-share-btn--floating') : null}
        {showClose ? renderCloseButton(closeClassName, closeLabel) : null}
      </div>
    )
  }

  if (isV3Desktop) {
    return (
      <article className="event-detail-page-panel event-modal-panel event-modal-panel--overlay event-modal-panel--v3">
        {effectiveShareInHeader || !hideCloseControl ? (
          effectiveShareInHeader ? (
            renderFloatingHeaderActions('event-modal-close-btn event-modal-close-btn--floating')
          ) : (
            <div className="event-modal-floating-actions">
              {renderCloseButton('event-modal-close-btn event-modal-close-btn--floating')}
            </div>
          )
        ) : null}

        <div ref={scrollRef} className="event-modal-scroll event-modal-scroll--v3">
          <AirbnbV3DesktopContent
            event={event}
            chrome="modal"
            hideHeroShare={effectiveShareInHeader}
            lifecycleStatus={lifecycleStatus}
            lifecycleNow={lifecycleNow}
            lifecycleLinkTarget={lifecycleLinkTarget}
          />
        </div>
      </article>
    )
  }

  if (isWideDesktop) {
    return (
      <article className="event-detail-page-panel event-modal-panel event-modal-panel--overlay event-modal-panel--wide">
        {effectiveShareInHeader || !hideCloseControl ? (
          effectiveShareInHeader ? (
            renderFloatingHeaderActions('event-modal-close-btn event-modal-close-btn--floating')
          ) : (
            <div className="event-modal-floating-actions">
              {renderCloseButton('event-modal-close-btn event-modal-close-btn--floating')}
            </div>
          )
        ) : null}

        <div ref={scrollRef} className="event-modal-scroll">
          <div className="event-modal-wide-layout">
            <div className="event-modal-wide-layout__main">
              <EventImage
                event={event}
                className="event-modal-hero event-modal-hero--wide w-full object-cover"
                loading="eager"
              />
              <h1 className="event-detail-title">{event.title}</h1>
              {description ? <p className="event-detail-body">{description}</p> : null}
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
                shareInHeader={effectiveShareInHeader}
                hideCloseButton={hideCloseControl}
                onShare={effectiveShareInHeader ? undefined : () => void handleShare()}
                onClose={hideCloseControl || effectiveShareInHeader ? undefined : onClose}
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
      {(!headerCollapsed || isOverlay) && !hideCloseControl ? (
        effectiveShareInHeader && (isOverlay || isEndedLifecycle) ? (
          renderFloatingHeaderActions('event-modal-close-btn event-modal-close-btn--floating')
        ) : (
          renderCloseButton(
            [
              'event-modal-close-btn event-modal-close-btn--floating',
              isOverlay ? 'event-modal-close-btn--persistent' : '',
            ]
              .filter(Boolean)
              .join(' '),
          )
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
          {headerCollapsed && !isOverlay && !hideCloseControl ? renderCloseButton('event-modal-close-btn') : null}
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

          {visitorContext === 'shared-direct' ? <SharedEventVisitorIntro event={event} /> : null}

          {lifecycleStatus ? (
            <EventLifecycleBanner
              event={event}
              status={lifecycleStatus}
              linkTarget={lifecycleLinkTarget}
            />
          ) : null}

          {!hasInAppReturn && !effectiveShareInHeader && !isEndedLifecycle && visitorContext !== 'shared-direct' ? (
            <p className="event-detail-direct-fallback">
              <Link to="/browse">Browse more events</Link>
            </p>
          ) : null}

          <div className="mt-2">
            <EventDetailMetadata {...contentProps} />
          </div>

          {description ? <p className="event-detail-body">{description}</p> : null}

          <EventDetailTips tips={event.tips} />

          <EventDetailTrustCard {...contentProps} />

          <EventRouteCard event={event} />
        </div>
      </div>

      {isEndedLifecycle && lifecycleStatus ? (
        <EventLifecycleActions
          event={event}
          status={lifecycleStatus}
          now={lifecycleNow}
          linkTarget={lifecycleLinkTarget}
        />
      ) : (
        <EventDetailActions
          event={event}
          canAddToCalendar={canAddToCalendar}
          hasOfficialPage={hasOfficialPage}
          shareInHeader={effectiveShareInHeader}
          hideCloseButton={hideCloseControl}
          onShare={effectiveShareInHeader ? undefined : () => void handleShare()}
          onClose={hideCloseControl ? undefined : onClose}
        />
      )}
    </article>
  )
}

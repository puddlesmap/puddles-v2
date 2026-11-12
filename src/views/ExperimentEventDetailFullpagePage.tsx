'use client'

import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EventDetailFullpageMockLayout } from '../components/event-detail/EventDetailFullpageMockLayout'
import { EventUnavailableState } from '../components/empty-states/EventUnavailableState'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { getCatalogEventById, getPublicEventById, isEventIndexable } from '../utils/eventPages'
import { getSharedEventNearbyActivities } from '../utils/sharedEventNearby'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import './experiment-event-detail-fullpage.css'

/** Curated samples: timed, seasonal Through, multi-day, ages that used to duplicate. */
export const EVENT_DETAIL_FULLPAGE_SAMPLE_IDS = [
  'core-weekend-playhouse-little-red-riding-hood-2026-11-21',
  'regional-filoli-holidays-2026-11-14',
  'mountain-view-art-wine-festival-2026-09-12',
] as const

export const EVENT_DETAIL_FULLPAGE_INDEX = '/experiment/event-detail-fullpage'

export function experimentEventDetailFullpagePath(eventId: string): string {
  return `${EVENT_DETAIL_FULLPAGE_INDEX}/event/${eventId}`
}

function sampleReason(eventId: string): string {
  if (eventId.includes('filoli')) {
    return 'Holiday Pick pill · seasonal WHEN · Report + sticky Back/Save/Share'
  }
  if (eventId.includes('art-wine') || eventId.includes('multi')) return 'Multi-day festival WHEN'
  if (eventId.includes('playhouse') || eventId.includes('best')) return 'Timed · single Ages (best-for)'
  return 'Sample catalog event'
}

export function ExperimentEventDetailFullpageIndexPage() {
  const samples = useMemo(() => {
    return EVENT_DETAIL_FULLPAGE_SAMPLE_IDS.map((id) => {
      const event = getCatalogEventById(id) ?? getPublicEventById(id)
      return event ? { event, reason: sampleReason(id) } : null
    }).filter((row): row is { event: NonNullable<ReturnType<typeof getCatalogEventById>>; reason: string } =>
      Boolean(row),
    )
  }, [])

  return (
    <div className="edfp-index-shell">
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />
      <div className="edfp-index">
        <p className="edfp-note">
          Interactive experiment — review here before deploy. Share still targets live{' '}
          <code>/event/:id</code>. Check: Holiday Pick on Filoli, sticky Back/Save/Share after scroll
          (mobile), Report outdated info, stacked sticky CTAs.
        </p>
        <h1 className="edfp-index__title">Event detail full-page</h1>
        <p className="edfp-index__lede">
          Open a sample on desktop and phone widths. Save, Share, calendar, Visit official, and Report
          are interactive. Resize past 768px to switch chrome.
        </p>
        <ul className="edfp-index__list">
          {samples.map(({ event, reason }) => (
            <li key={event.id}>
              <Link to={experimentEventDetailFullpagePath(event.id)} className="edfp-index__link">
                <p className="edfp-index__link-title">{event.title}</p>
                <p className="edfp-index__link-meta">
                  {event.city}
                  {event.date ? ` · ${event.date}` : ''} · {reason}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <Footer fullBleed className="mt-0" />
    </div>
  )
}

export function ExperimentEventDetailFullpageDetailPage() {
  const { eventId = '' } = useParams()
  const navigate = useNavigate()
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const catalogEvent = eventId ? getCatalogEventById(eventId) : undefined
  const publicEvent = eventId ? getPublicEventById(eventId) : undefined
  const event = publicEvent && isEventIndexable(publicEvent) ? publicEvent : catalogEvent

  const nearbyEvents = useMemo(
    () => (event ? getSharedEventNearbyActivities(event, 6) : []),
    [event],
  )

  function handleBack() {
    navigate(EVENT_DETAIL_FULLPAGE_INDEX)
  }

  if (!event) {
    return (
      <div className="edfp-detail-shell">
        {isDesktop ? (
          <AppHeader
            logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
            logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
            showBrandName={false}
          />
        ) : null}
        <div className="edfp-index">
          <p className="edfp-note">
            Event not found.{' '}
            <Link to={EVENT_DETAIL_FULLPAGE_INDEX}>Back to mockup index</Link>
          </p>
        </div>
        <EventUnavailableState hasInAppReturn={false} onClose={() => navigate(EVENT_DETAIL_FULLPAGE_INDEX)} />
      </div>
    )
  }

  return (
    <div className={isDesktop ? 'edfp-detail-shell' : 'edfp-detail-shell edfp-detail-shell--mobile-chrome'}>
      {isDesktop ? (
        <>
          <AppHeader
            logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
            logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
            showBrandName={false}
          />
          <div className="layout-container" style={{ paddingTop: '0.75rem', paddingBottom: '0.25rem' }}>
            <p className="edfp-note">
              Full-page mock · desktop title Save → Share ·{' '}
              <Link to={EVENT_DETAIL_FULLPAGE_INDEX}>Back to index</Link>
            </p>
          </div>
        </>
      ) : null}

      <EventDetailFullpageMockLayout
        event={event}
        nearbyEvents={nearbyEvents}
        onBack={handleBack}
        buildNearbyEventHref={experimentEventDetailFullpagePath}
      />

      {isDesktop ? <Footer fullBleed className="mt-0" /> : null}
    </div>
  )
}

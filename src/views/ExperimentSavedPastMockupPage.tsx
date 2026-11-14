'use client'

import { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BrowseEventCard } from '../components/BrowseEventCard'
import { SavedCardActions } from '../components/saved/SavedCardActions'
import { SavedListRow } from '../components/saved/SavedListRow'
import { SavedLocationUpdatedSlot } from '../components/saved/SavedLocationUpdatedChip'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { PageContainer } from '../components/layout/PageContainer'
import { useEventNavigation } from '../hooks/useEventNavigation'
import { useMediaQuery } from '../hooks/useMediaQuery'
import type { Event } from '../types/event'
import { getCatalogEventById } from '../utils/eventPages'
import { formatDocumentTitle, setPageTitle } from '../utils/siteMeta'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import './experiment-saved.css'
import './experiment-saved-list.css'

const UPCOMING_IDS = [
  'barron-park-celebration-craft-fair-2026-11-15',
  'regional-filoli-holidays-2026-11-14',
  'core-weekend-gamble-second-saturday-2026-11-14',
] as const

const PAST_IDS = [
  'jeff-center-free-family-play-2026-08-24',
  'puddles-260b655d-d25',
  'puddles-5d6a36e9-4fd',
] as const

function resolveIds(ids: readonly string[]): Event[] {
  return ids
    .map((id) => getCatalogEventById(id))
    .filter((event): event is Event => Boolean(event))
}

function MockSavedGrid({
  events,
  isDesktop,
  openEvent,
}: {
  events: Event[]
  isDesktop: boolean
  openEvent: ReturnType<typeof useEventNavigation>
}) {
  if (isDesktop) {
    return (
      <div className="browse-content">
        <div className="browse-event-grid browse-event-grid--compact-two-column saved-page__grid">
          {events.map((event) => (
            <div key={event.id} className="saved-page__card-wrap">
              <BrowseEventCard
                event={event}
                showVenueBelowTitle
                showMediaDayPill
                seasonalEditorial={false}
                onClick={() => openEvent(event, 'saved', { viewMode: 'list' })}
              />
              <SavedLocationUpdatedSlot event={event} />
              <SavedCardActions event={event} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="saved-page__list">
      {events.map((event) => (
        <SavedListRow key={event.id} event={event} variant={4} />
      ))}
    </div>
  )
}

/** Review mockup — Saved with upcoming + open Past fold (fixture catalog rows). */
export function ExperimentSavedPastMockupPage() {
  const location = useLocation()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const openEvent = useEventNavigation()
  const upcoming = useMemo(() => resolveIds(UPCOMING_IDS), [])
  const past = useMemo(() => resolveIds(PAST_IDS), [])

  useEffect(() => {
    setPageTitle(formatDocumentTitle('Saved Past mockup'), location.pathname)
  }, [location.pathname])

  return (
    <div className="saved-page-shell">
      <p className="experiment-saved-note">
        Internal mockup — fixture upcoming + past saves so you can review the Past fold without
        waiting for real dates to end.{' '}
        <Link to="/saved" className="experiment-saved-note__link">
          Live Saved
        </Link>
        {' · '}
        <Link to="/experiment/saved-reminder-mockup" className="experiment-saved-note__link">
          Reminder mockup
        </Link>
      </p>

      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />
      <PageContainer layout="wide" className="saved-page">
        <header className="saved-page__header">
          <h1 className="saved-page__title">Saved</h1>
          <p className="saved-page__lede">Activities for your little ones, all in one place.</p>
        </header>

        <aside className="saved-page__persist">
          <p className="saved-page__persist-title">Mock review</p>
          <p className="saved-page__persist-body">
            Barron shows the Location changed chip. Past is open by default.
          </p>
        </aside>

        <section className="saved-page__section saved-page__browse">
          <h2 className="saved-page__section-title">Your saves</h2>
          <MockSavedGrid events={upcoming} isDesktop={isDesktop} openEvent={openEvent} />
        </section>

        <details className="saved-page__past" open>
          <summary className="saved-page__past-summary">Past ({past.length})</summary>
          <MockSavedGrid events={past} isDesktop={isDesktop} openEvent={openEvent} />
        </details>
      </PageContainer>
      <Footer fullBleed className="mt-0" />
    </div>
  )
}

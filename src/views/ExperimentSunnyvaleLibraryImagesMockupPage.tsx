import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrowseEventCard } from '../components/BrowseEventCard'
import { AppHeader } from '../components/layout/AppHeader'
import { PageContainer } from '../components/layout/PageContainer'
import { Footer } from '../components/layout/Footer'
import { ALL_EVENTS } from '../data/events'
import type { Event } from '../types/event'
import {
  getEventFallbackImageUrl,
  getEventImageUrl,
  getEventPrimaryType,
} from '../utils/eventImages'

/**
 * Review mockup: Sunnyvale Library cards today (same host building photo)
 * vs activity-type Puddles fallbacks.
 *
 * Route: /experiment/sunnyvale-library-images-mockup
 */
const FEATURED_IDS = [
  'watchlist-sunnyvale-library-decorate-playhouse-2026-09-05',
  'staging-sunnyvale-library-toddler-storytime-series',
  'watchlist-sunnyvale-library-mid-autumn-storytime-craft-2026-09-13',
  'watchlist-sunnyvale-library-asl-for-babies-2026-09-14',
  'watchlist-sunnyvale-library-early-learning-playtime-2026-09-25',
  'watchlist-sunnyvale-library-jamaroo-music-2026-09-28',
  'watchlist-sunnyvale-library-hispanic-heritage-celebration-2026-10-04',
  'watchlist-sunnyvale-halloween-costume-swap-2026-10-14',
  'watchlist-sunnyvale-library-family-movie-elio-2026-10-25',
] as const

type ImageMode = 'current' | 'fallbacks'

function withFallbackImage(event: Event): Event {
  return {
    ...event,
    // Force the clay activity fallback — skips host registry by setting an explicit URL.
    imageUrl: getEventFallbackImageUrl(event),
  }
}

function resolveFeaturedLibraryEvents(): Event[] {
  const byId = new Map(ALL_EVENTS.map((event) => [event.id, event]))
  return FEATURED_IDS.map((id) => byId.get(id)).filter((event): event is Event => Boolean(event))
}

export function ExperimentSunnyvaleLibraryImagesMockupPage() {
  const [mode, setMode] = useState<ImageMode>('fallbacks')
  const baseEvents = useMemo(() => resolveFeaturedLibraryEvents(), [])
  const events = useMemo(
    () => (mode === 'fallbacks' ? baseEvents.map(withFallbackImage) : baseEvents),
    [baseEvents, mode],
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream, #faf7f2)' }}>
      <AppHeader />
      <PageContainer>
        <header style={{ padding: '1.5rem 0 1rem', maxWidth: 720 }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.75rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#8a6a4a',
            }}
          >
            Review mockup · not live
          </p>
          <h1 style={{ margin: '0.35rem 0 0.5rem', fontSize: '1.65rem', lineHeight: 1.2 }}>
            Sunnyvale Library images
          </h1>
          <p style={{ margin: 0, color: '#5c4a3a', lineHeight: 1.45 }}>
            Today every Sunnyvale Public Library card uses the same Wikimedia building photo
            (event <code>imageUrl</code> + host registry). Toggle to see activity-type Puddles
            backups instead — Stories, Arts, Music, Parent &amp; Me, etc.
          </p>
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.9rem', color: '#6b5a4a' }}>
            Compare{' '}
            <Link to="/browse?city=sunnyvale" style={{ color: '#2f5d50' }}>
              Browse · Sunnyvale
            </Link>
            .
          </p>
        </header>

        <div
          role="tablist"
          aria-label="Image mode"
          style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            marginBottom: '1.25rem',
          }}
        >
          {(
            [
              ['current', 'A · Current (same building)'],
              ['fallbacks', 'B · Activity fallbacks'],
            ] as const
          ).map(([id, label]) => {
            const active = mode === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMode(id)}
                style={{
                  border: active ? '2px solid #2f5d50' : '1px solid #d4c4b0',
                  background: active ? '#e8f2ee' : '#fff',
                  color: '#2a241c',
                  borderRadius: 999,
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#6b5a4a' }}>
          {mode === 'current'
            ? 'What parents see now — one exterior for every program type.'
            : 'Proposed: clear the shared library photo and use /event-fallbacks/* by primary activity type. (Host registry would also need to stop supplying the building for this venue, or imageUrl must be set to the fallback.)'}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1rem',
            paddingBottom: '2.5rem',
          }}
        >
          {events.map((event) => {
            const primary = getEventPrimaryType(event)
            const resolved = getEventImageUrl(event)
            return (
              <div key={`${mode}-${event.id}`} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <BrowseEventCard event={event} seasonalEditorial={false} onClick={() => undefined} />
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b5a4a', lineHeight: 1.35 }}>
                  <strong>{primary}</strong>
                  <br />
                  <span style={{ wordBreak: 'break-all' }}>{resolved}</span>
                </p>
              </div>
            )
          })}
        </div>
      </PageContainer>
      <Footer />
    </div>
  )
}

'use client'

import { useClerk } from '@clerk/nextjs'
import { Link } from 'react-router-dom'
import { BrowseEventCard } from '../components/BrowseEventCard'
import { SavedCardActions } from '../components/saved/SavedCardActions'
import { SavedListRow } from '../components/saved/SavedListRow'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { PageContainer } from '../components/layout/PageContainer'
import { useEventNavigation } from '../hooks/useEventNavigation'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useSaved } from '../context/SavedContext'
import { getCatalogEventById } from '../utils/eventPages'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import './experiment-saved.css'
import './experiment-saved-list.css'

/** Only mount under ClerkProvider (Next). Vite Saved never shows signed-in. */
function SavedSignOutButton() {
  const { signOut } = useClerk()

  return (
    <p className="saved-page__persist-login">
      <button
        type="button"
        className="saved-page__persist-login-link"
        onClick={() => void signOut({ redirectUrl: '/saved' })}
      >
        Sign out
      </button>
    </p>
  )
}

export function SavedPage() {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const openEvent = useEventNavigation()
  const { saves, signedInEmail, openAuthSheet, isSaved } = useSaved()
  const active = saves
    .filter((row) => !row.removedAt && isSaved(row.eventId))
    .map((row) => getCatalogEventById(row.eventId))
    .filter((event): event is NonNullable<typeof event> => Boolean(event))

  return (
    <div className="saved-page-shell">
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

        {signedInEmail ? (
          <aside className="saved-page__persist saved-page__persist--signed-in">
            <p className="saved-page__persist-title">Signed in as {signedInEmail}</p>
            <p className="saved-page__persist-body">
              Saves sync across devices while you stay signed in.
            </p>
            <SavedSignOutButton />
          </aside>
        ) : (
          <aside className="saved-page__persist">
            <p className="saved-page__persist-title">Save now, plan later</p>
            <p className="saved-page__persist-body">
              Create an account to access your saved activities on any device.
            </p>
            <button
              type="button"
              className="saved-page__persist-cta"
              onClick={() => openAuthSheet('create')}
            >
              Create account
            </button>
            <p className="saved-page__persist-login">
              Already have an account?{' '}
              <button
                type="button"
                className="saved-page__persist-login-link"
                onClick={() => openAuthSheet('login')}
              >
                Log in
              </button>
            </p>
          </aside>
        )}

        {active.length === 0 ? (
          <section className="saved-page__empty">
            <p className="saved-page__empty-title">Nothing saved yet</p>
            <p className="saved-page__empty-body">
              Tap the heart on any activity to save it for later.
            </p>
            <p className="saved-page__empty-cta">
              <Link to="/browse" className="saved-page__empty-link">
                Browse activities
              </Link>
            </p>
          </section>
        ) : (
          <section className="saved-page__section saved-page__browse">
            <h2 className="saved-page__section-title">Your saves</h2>
            {isDesktop ? (
              <div className="browse-content">
                <div className="browse-event-grid browse-event-grid--compact-two-column saved-page__grid">
                  {active.map((event) => (
                    <div key={event.id} className="saved-page__card-wrap">
                      <BrowseEventCard
                        event={event}
                        showVenueBelowTitle
                        showMediaDayPill
                        seasonalEditorial={false}
                        onClick={() => openEvent(event, 'saved', { viewMode: 'list' })}
                      />
                      <SavedCardActions event={event} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="saved-page__list">
                {active.map((event) => (
                  <SavedListRow key={event.id} event={event} variant={4} />
                ))}
              </div>
            )}
          </section>
        )}
      </PageContainer>
      <Footer fullBleed className="mt-0" />
    </div>
  )
}

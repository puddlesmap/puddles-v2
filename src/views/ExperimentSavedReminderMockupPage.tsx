'use client'

import { useEffect, useMemo, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { PageContainer } from '../components/layout/PageContainer'
import { getPublicEventsFromCatalog } from '../data/events'
import { formatDocumentTitle, setPageTitle } from '../utils/siteMeta'
import { getCatalogEventById } from '../utils/eventPages'
import {
  MOCK_CUBBERLEY_ID,
  SavedReminderMockDetailRail,
  SavedReminderMockEmail,
  SavedReminderMockSavedPanel,
  SavedReminderMockSignInPrompt,
} from './SavedReminderMockupSlices'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import './experiment-saved.css'
import './experiment-saved-list.css'
import './experiment-saved-reminder-mockup.css'

function MockPhone({
  label,
  caption,
  children,
}: {
  label: string
  caption: string
  children: ReactNode
}) {
  return (
    <figure className="saved-flow-phone saved-reminder-mockup__phone">
      <figcaption className="saved-flow-phone__caption">
        <span className="saved-flow-phone__label">{label}</span>
        <span className="saved-flow-phone__meta">{caption}</span>
      </figcaption>
      <div className="saved-flow-phone__screen saved-reminder-mockup__screen">{children}</div>
    </figure>
  )
}

export function ExperimentSavedReminderMockupPage() {
  const location = useLocation()
  const event = useMemo(
    () => getCatalogEventById(MOCK_CUBBERLEY_ID) ?? getPublicEventsFromCatalog()[0],
    [],
  )

  useEffect(() => {
    setPageTitle(formatDocumentTitle('Saved reminder mockup'), location.pathname)
  }, [location.pathname])

  if (!event) {
    return (
      <div className="saved-page-shell">
        <PageContainer layout="wide" className="saved-page">
          <p className="saved-page__lede">
            Mock event not found in catalog. Check <code>MOCK_CUBBERLEY_ID</code> in{' '}
            SavedReminderMockupSlices.tsx.
          </p>
        </PageContainer>
      </div>
    )
  }

  return (
    <div className="saved-page-shell">
      <p className="experiment-saved-note">
        Internal mockup — run <code className="experiment-saved-note__code">npm run dev</code> and open{' '}
        <code className="experiment-saved-note__code">localhost:3000</code> (not Vite on 5173). Uses live
        components and tokens.{' '}
        <Link to={`/event/${event.id}`} className="experiment-saved-note__link">
          Open live event
        </Link>
        {' · '}
        <Link to="/saved" className="experiment-saved-note__link">
          Saved
        </Link>
        {' · '}
        <Link to="/browse" className="experiment-saved-note__link">
          Browse
        </Link>
      </p>
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />
      <PageContainer layout="wide" className="saved-page saved-list-page">
        <header className="saved-page__header">
          <h1 className="saved-page__title">Saved reminder</h1>
          <p className="saved-page__lede">
            Review day-before email UI in current Puddles layout — detail rail, Saved, sign-in prompt,
            and email copy.
          </p>
        </header>

        <aside className="saved-list-page__banner">
          <p>Static review only. Loops template: docs/loops-saved-reminder.md</p>
        </aside>

        <div className="saved-flow__frames saved-reminder-mockup__frames">
          <MockPhone label="1 · Event detail" caption="Sticky rail · production classes">
            <SavedReminderMockDetailRail event={event} />
          </MockPhone>

          <MockPhone label="2 · Saved" caption="Persist aside · manage · list row">
            <SavedReminderMockSavedPanel primaryEvent={event} />
          </MockPhone>

          <MockPhone label="3 · Email" caption="Transactional · text-first">
            <SavedReminderMockEmail event={event} />
          </MockPhone>

          <MockPhone label="4 · Sign-in prompt" caption="After account · optional">
            <SavedReminderMockSignInPrompt eventTitle={event.title} />
          </MockPhone>
        </div>
      </PageContainer>
      <Footer fullBleed className="mt-0" />
    </div>
  )
}

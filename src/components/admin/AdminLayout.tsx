import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { PageContainer } from '../layout/PageContainer'
import { SHEET_SOURCE } from '../../data/sheet-source'
import { useAdminAuth } from '../../context/AdminAuthContext'
import {
  dismissScheduledDiscoverReminder,
  SCHEDULED_DISCOVER_REMINDER,
  shouldShowScheduledDiscoverReminder,
} from '../../utils/adminReminders'
import { AdminMarkInternalAnalytics } from './AdminMarkInternalAnalytics'

const NAV_ITEMS = [
  { to: '/admin/events', label: 'Events' },
  { to: '/admin/discovery', label: 'Discovery' },
  { to: '/admin/submissions', label: 'Submissions' },
] as const

const HOWTO_OPEN_KEY = 'puddles-admin-howto-open'

function readHowToOpen(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(HOWTO_OPEN_KEY) === '1'
  } catch {
    return false
  }
}

export function AdminLayout() {
  const location = useLocation()
  const { authRequired, signOut } = useAdminAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [howToOpen, setHowToOpen] = useState(false)
  const [showReminder, setShowReminder] = useState(false)

  useEffect(() => {
    const robotsMeta = document.createElement('meta')
    robotsMeta.name = 'robots'
    robotsMeta.content = 'noindex, nofollow'
    document.head.appendChild(robotsMeta)

    return () => {
      robotsMeta.remove()
    }
  }, [])

  useEffect(() => {
    setHowToOpen(readHowToOpen())
    setShowReminder(shouldShowScheduledDiscoverReminder())
  }, [])

  function toggleHowTo() {
    setHowToOpen((current) => {
      const next = !current
      try {
        window.localStorage.setItem(HOWTO_OPEN_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  function handleDismissReminder() {
    dismissScheduledDiscoverReminder()
    setShowReminder(false)
  }

  async function handleLogout() {
    setIsSigningOut(true)
    try {
      await signOut()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="admin-shell">
      <header className="border-b border-border bg-white">
        {showReminder ? (
          <div className="admin-reminder-banner" role="status">
            <PageContainer layout="wide" className="admin-reminder-banner__inner">
              <div className="admin-reminder-banner__copy">
                <strong>{SCHEDULED_DISCOVER_REMINDER.title}</strong>
                <span>{SCHEDULED_DISCOVER_REMINDER.body}</span>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-reminder-banner__dismiss"
                onClick={handleDismissReminder}
              >
                Dismiss
              </button>
            </PageContainer>
          </div>
        ) : null}

        <PageContainer layout="wide" className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">Puddles Admin</div>
              <h1 className="mt-1 font-display text-xl text-charcoal">Operations dashboard</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                aria-expanded={howToOpen}
                aria-controls="admin-howto-panel"
                onClick={toggleHowTo}
              >
                {howToOpen ? 'Hide how to use' : 'How to use'}
              </button>
              <a
                href={SHEET_SOURCE.spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="admin-btn admin-btn-secondary admin-btn-legacy"
                title="Legacy archive — Admin is the editorial source of truth"
              >
                Sheet archive ↗
              </a>
              <AdminMarkInternalAnalytics />
              {authRequired ? (
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => void handleLogout()}
                  disabled={isSigningOut}
                >
                  {isSigningOut ? 'Signing out…' : 'Sign out'}
                </button>
              ) : null}
              <Link to="/" className="text-sm font-medium text-charcoal underline decoration-border underline-offset-4">
                View public site
              </Link>
            </div>
          </div>

          {howToOpen ? (
            <div id="admin-howto-panel" className="admin-howto-panel">
              <p className="admin-howto-panel__lead">
                Form → Submissions → Go live. Discovery → Approve → Go live. Events monitors the
                public catalog. Full guide: <code>docs/admin-howto.md</code>
              </p>
              <ol className="admin-howto-panel__list">
                <li>
                  <strong>Submissions</strong> — Refresh, review Share form items,{' '}
                  <strong>Go live</strong> for Event submissions.
                </li>
                <li>
                  <strong>Discovery</strong> — Approve library candidates, then{' '}
                  <strong>Go live</strong>.
                </li>
                <li>
                  <strong>Events</strong> — Monitor <strong>Live</strong>,{' '}
                  <strong>Needs attention</strong>, and <strong>Past</strong>.
                </li>
              </ol>
              <p className="admin-howto-panel__note">
                Google Sheet is optional. Go live updates the public site in ~2–4 minutes.
              </p>
            </div>
          ) : null}

          <nav className="admin-section-nav" aria-label="Admin sections">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname.startsWith(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`admin-btn ${isActive ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </PageContainer>
      </header>

      <PageContainer layout="wide" className="py-8">
        <Outlet />
      </PageContainer>
    </div>
  )
}

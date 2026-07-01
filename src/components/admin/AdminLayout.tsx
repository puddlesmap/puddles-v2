import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { PageContainer } from '../layout/PageContainer'
import { SHEET_SOURCE } from '../../data/sheet-source'
import { useAdminAuth } from '../../context/AdminAuthContext'

const NAV_ITEMS = [
  { to: '/admin/events', label: 'Events' },
  { to: '/admin/submissions', label: 'Submissions' },
] as const

export function AdminLayout() {
  const location = useLocation()
  const { authRequired, signOut } = useAdminAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    const robotsMeta = document.createElement('meta')
    robotsMeta.name = 'robots'
    robotsMeta.content = 'noindex, nofollow'
    document.head.appendChild(robotsMeta)

    return () => {
      robotsMeta.remove()
    }
  }, [])

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
        <PageContainer layout="wide" className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">Puddles Admin</div>
              <h1 className="mt-1 font-display text-xl text-charcoal">Operations dashboard</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={SHEET_SOURCE.spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="admin-btn admin-btn-secondary"
              >
                Open Google Sheet ↗
              </a>
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

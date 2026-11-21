import { useEffect, useMemo, useState } from 'react'
import { DetailRow, DetailSection } from '../../components/admin/AdminDetailGrid'
import { ACTIVITY_TYPES, type ActivityType } from '../../types/event'
import type { AudienceRow } from '../../types/audience'
import { fetchAudienceAdmin, patchAudienceAdmin } from '../../utils/audienceApi'
import { trackNewsletterUnsubscribed } from '../../utils/analytics'
import { downloadRowsAsCsv } from '../../utils/exportCsv'
import { exportFilename } from '../../utils/adminExport'
import { formatEventDate } from '../../utils/dates'
import { getCatalogEventById } from '../../utils/eventPages'

type NewsletterFilter = 'all' | 'subscribed' | 'not_subscribed'
type SavedFilter = 'all' | 'has_saves' | 'no_saves'
type CountFilter = 'all' | '0' | '1-3' | '4+'
type InterestView = 'aggregate' | 'per_parent'

function formatWhen(value: string | null | undefined): string {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function newsletterLabel(status: AudienceRow['newsletterStatus']): string {
  if (status === 'subscribed') return 'Subscribed'
  if (status === 'unsubscribed') return 'Unsubscribed'
  return 'Not subscribed'
}

function sourceLabel(source: AudienceRow['signupSource']): string {
  if (source === 'puddles_picks_card') return 'Homepage card'
  if (source === 'puddles_picks_pill') return 'Mobile pill'
  if (source === 'puddles_picks_pill_home') return 'Mobile pill · Home'
  if (source === 'puddles_picks_pill_browse') return 'Mobile pill · Browse'
  if (source === 'puddles_picks_pill_seasonal') return 'Mobile pill · Seasonal'
  if (source === 'puddles_picks_pill_guide') return 'Mobile pill · Guide'
  if (source === 'puddles_picks_popup') return 'Popup'
  if (source === 'puddles_picks') return 'Puddles Picks'
  if (source === 'homepage') return 'Homepage'
  if (source === 'guide') return 'Guide'
  if (source === 'footer') return 'Footer'
  if (source === 'admin') return 'Admin'
  return '—'
}

function eventCategories(eventId: string): string {
  const event = getCatalogEventById(eventId)
  return event?.types?.join(', ') || '—'
}

function matchesCount(count: number | null, filter: CountFilter): boolean {
  if (filter === 'all') return true
  const value = count ?? 0
  if (filter === '0') return value === 0
  if (filter === '1-3') return value >= 1 && value <= 3
  return value >= 4
}

function rowHasType(row: AudienceRow, type: ActivityType): boolean {
  return row.saves.some((save) => getCatalogEventById(save.eventId)?.types.includes(type))
}

function topActivityTypes(rows: AudienceRow[]): Array<{ type: string; count: number }> {
  const counts = new Map<string, number>()
  for (const row of rows) {
    for (const save of row.saves) {
      const event = getCatalogEventById(save.eventId)
      for (const type of event?.types || []) {
        counts.set(type, (counts.get(type) || 0) + 1)
      }
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }))
}

function topCities(rows: AudienceRow[]): Array<{ city: string; count: number }> {
  const counts = new Map<string, number>()
  for (const row of rows) {
    for (const save of row.saves) {
      const city = getCatalogEventById(save.eventId)?.city?.trim()
      if (!city) continue
      counts.set(city, (counts.get(city) || 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([city, count]) => ({ city, count }))
}

function interestsFromSaves(row: AudienceRow): { types: string[]; cities: string[] } {
  const types = new Set<string>()
  const cities = new Set<string>()
  for (const save of row.saves) {
    const event = getCatalogEventById(save.eventId)
    for (const type of event?.types || []) types.add(type)
    const city = event?.city?.trim()
    if (city) cities.add(city)
  }
  return {
    types: [...types].sort((a, b) => a.localeCompare(b)),
    cities: [...cities].sort((a, b) => a.localeCompare(b)),
  }
}

export function AdminAudiencePage() {
  const [rows, setRows] = useState<AudienceRow[]>([])
  const [summary, setSummary] = useState({
    total: 0,
    parents: 0,
    verified: 0,
    newsletterOnly: 0,
    overlap: 0,
    subscribed: 0,
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [newsletterFilter, setNewsletterFilter] = useState<NewsletterFilter>('all')
  const [savedFilter, setSavedFilter] = useState<SavedFilter>('all')
  const [countFilter, setCountFilter] = useState<CountFilter>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | ActivityType>('all')
  const [interestView, setInterestView] = useState<InterestView>('aggregate')
  const [exportMessage, setExportMessage] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const view = await fetchAudienceAdmin()
    setLoading(false)
    if (!view.ok) {
      setError(view.error || 'Could not load audience.')
      return
    }
    setError(null)
    setRows(view.rows)
    setSummary(view.summary)
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (query && !row.email.includes(query)) return false
      if (newsletterFilter === 'subscribed' && row.newsletterStatus !== 'subscribed') return false
      if (newsletterFilter === 'not_subscribed' && row.newsletterStatus === 'subscribed') return false
      if (savedFilter === 'has_saves' && !(row.savedCount && row.savedCount > 0)) return false
      if (savedFilter === 'no_saves' && (row.savedCount ?? 0) > 0) return false
      if (!matchesCount(row.savedCount, countFilter)) return false
      if (typeFilter !== 'all' && !rowHasType(row, typeFilter)) return false
      return true
    })
  }, [countFilter, newsletterFilter, rows, savedFilter, search, typeFilter])

  const selected = filtered.find((row) => row.email === selectedEmail) || null
  const popularTypes = useMemo(() => topActivityTypes(rows), [rows])
  const popularCities = useMemo(() => topCities(rows), [rows])
  const maxTypeCount = popularTypes[0]?.count || 0
  const selectedInterests = selected ? interestsFromSaves(selected) : null

  async function handleVerify(row: AudienceRow) {
    if (!row.userId) return
    setBusyKey(row.email)
    const view = await patchAudienceAdmin({ action: 'verify', userId: row.userId })
    setBusyKey(null)
    if (!view.ok) {
      setError(view.error || 'Could not verify email.')
      return
    }
    setRows(view.rows)
    setSummary(view.summary)
  }

  async function handleUnsubscribe(row: AudienceRow) {
    setBusyKey(row.email)
    const view = await patchAudienceAdmin({ action: 'unsubscribe', email: row.email })
    setBusyKey(null)
    if (!view.ok) {
      setError(view.error || 'Could not unsubscribe.')
      return
    }
    trackNewsletterUnsubscribed()
    setRows(view.rows)
    setSummary(view.summary)
  }

  function handleExport() {
    const ok = downloadRowsAsCsv(
      exportFilename('audience', filtered.length),
      filtered,
      [
        { key: 'email', label: 'Email', value: (row) => row.email },
        { key: 'newsletter', label: 'Newsletter Status', value: (row) => newsletterLabel(row.newsletterStatus) },
        { key: 'saves', label: 'Saved Events', value: (row) => (row.savedCount == null ? '' : row.savedCount) },
        { key: 'lastActive', label: 'Last Active', value: (row) => row.lastSeenAt || row.subscribedAt || '' },
        { key: 'verified', label: 'Email Verified', value: (row) => (row.emailVerifiedAt ? 'Yes' : 'No') },
        { key: 'source', label: 'Signup Source', value: (row) => sourceLabel(row.signupSource) },
      ],
    )
    setExportMessage(
      ok ? `Exported ${filtered.length} audience rows.` : 'Nothing to export — adjust filters.',
    )
  }

  return (
    <>
      <section className="admin-sync-bar" aria-label="Audience overview">
        <p className="admin-submissions-intro">
          Experiment records for parent identity, saved events, and newsletter opt-in. Emails stay
          off GitHub. Saving does not subscribe anyone. Interest below is computed from saved event
          ids → catalog — not stored as a profile.
        </p>
        {error ? (
          <p className="admin-action-alert admin-action-alert--error" role="status">
            {error}
          </p>
        ) : null}
        {exportMessage ? (
          <p className="admin-action-alert admin-action-alert--success" role="status">
            {exportMessage}
          </p>
        ) : null}
        <div className="admin-stat-grid" style={{ marginTop: '1rem' }}>
          <div className="admin-stat-card">
            <div className="admin-stat-value">{summary.parents}</div>
            <div className="admin-stat-label">Parents</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-value">{summary.verified}</div>
            <div className="admin-stat-label">Verified</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-value">{summary.newsletterOnly}</div>
            <div className="admin-stat-label">Newsletter only</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-value">{summary.overlap}</div>
            <div className="admin-stat-label">Subscribed + saved</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-value">{summary.subscribed}</div>
            <div className="admin-stat-label">Subscribed</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-value">{loading ? '…' : rows.length}</div>
            <div className="admin-stat-label">All contacts</div>
          </div>
        </div>

        <div className="admin-interest-toggle" role="tablist" aria-label="Interest from saves view">
          <button
            type="button"
            role="tab"
            aria-selected={interestView === 'aggregate'}
            className={`admin-interest-toggle-btn${interestView === 'aggregate' ? ' is-active' : ''}`}
            onClick={() => setInterestView('aggregate')}
          >
            A · Aggregate
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={interestView === 'per_parent'}
            className={`admin-interest-toggle-btn${interestView === 'per_parent' ? ' is-active' : ''}`}
            onClick={() => setInterestView('per_parent')}
          >
            B · Per parent
          </button>
        </div>

        {interestView === 'aggregate' ? (
          <div className="admin-interest-panel" aria-label="Interest from saves">
            <h3>Interest from saves</h3>
            <p className="admin-interest-derived">
              Computed now from saved event ids → catalog types &amp; cities. Not stored as a profile.
            </p>
            {popularTypes.length === 0 ? (
              <p className="admin-sync-hint" style={{ margin: 0 }}>
                No saved events yet — interest appears after parents sync hearts while signed in.
              </p>
            ) : (
              <>
                <div className="admin-interest-bars">
                  {popularTypes.map((item) => (
                    <div key={item.type} className="admin-interest-bar-row">
                      <span className="admin-interest-bar-label">{item.type}</span>
                      <div className="admin-interest-bar-track">
                        <div
                          className="admin-interest-bar-fill"
                          style={{
                            width: `${maxTypeCount ? Math.round((item.count / maxTypeCount) * 100) : 0}%`,
                          }}
                        />
                      </div>
                      <span className="admin-interest-bar-count">{item.count}</span>
                    </div>
                  ))}
                </div>
                {popularCities.length > 0 ? (
                  <div className="admin-interest-chips" aria-label="Cities from saves">
                    {popularCities.map((item) => (
                      <span key={item.city} className="admin-interest-chip">
                        {item.city} <em>· {item.count}</em>
                      </span>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>
        ) : (
          <p className="admin-sync-hint" style={{ marginTop: '0.75rem' }}>
            Per parent: expand a row to see interests derived from that contact’s saves. Fold again to
            hide.
          </p>
        )}
      </section>

      <section className="admin-events-section">
        <div className="admin-events-header">
          <div>
            <h2 className="font-display text-lg text-charcoal">Audience</h2>
            <p className="mt-1 text-sm text-muted">
              Click a row for parent, newsletter, and saved activity. Newsletter-only contacts show
              saved history as unavailable until the email is linked.
            </p>
          </div>
          <div className="admin-table-actions">
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => void load()}>
              Refresh
            </button>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={handleExport}>
              Export CSV
            </button>
          </div>
        </div>

        <div className="admin-toolbar">
          <label className="admin-search">
            <span className="sr-only">Search emails</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search email…"
              className="admin-search-input"
            />
          </label>
          <label className="admin-select-wrap">
            <span className="admin-select-label">Newsletter</span>
            <select
              className="admin-select"
              value={newsletterFilter}
              onChange={(event) => setNewsletterFilter(event.target.value as NewsletterFilter)}
            >
              <option value="all">All</option>
              <option value="subscribed">Subscribers</option>
              <option value="not_subscribed">Non-subscribers</option>
            </select>
          </label>
          <label className="admin-select-wrap">
            <span className="admin-select-label">Saved</span>
            <select
              className="admin-select"
              value={savedFilter}
              onChange={(event) => setSavedFilter(event.target.value as SavedFilter)}
            >
              <option value="all">All</option>
              <option value="has_saves">Has saved events</option>
              <option value="no_saves">No saved events</option>
            </select>
          </label>
          <label className="admin-select-wrap">
            <span className="admin-select-label">Save count</span>
            <select
              className="admin-select"
              value={countFilter}
              onChange={(event) => setCountFilter(event.target.value as CountFilter)}
            >
              <option value="all">All</option>
              <option value="0">0</option>
              <option value="1-3">1–3</option>
              <option value="4+">4+</option>
            </select>
          </label>
          <label className="admin-select-wrap">
            <span className="admin-select-label">Interest</span>
            <select
              className="admin-select"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as 'all' | ActivityType)}
            >
              <option value="all">All types</option>
              {ACTIVITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="admin-table-wrap" style={{ marginTop: '1rem' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Newsletter Status</th>
                <th>Saved Events</th>
                <th>Last Active</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted">
                    {loading
                      ? 'Loading audience…'
                      : error
                        ? 'Audience list did not load.'
                        : 'No audience records yet. Heart events, Continue with email, or join Puddles Picks.'}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.email}
                    className={`admin-table-row-clickable${selectedEmail === row.email ? ' admin-table-row-selected' : ''}`}
                    tabIndex={0}
                    role="button"
                    aria-expanded={selectedEmail === row.email}
                    onClick={() => setSelectedEmail(row.email === selectedEmail ? null : row.email)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setSelectedEmail(row.email === selectedEmail ? null : row.email)
                      }
                    }}
                  >
                    <td>{row.email}</td>
                    <td>{newsletterLabel(row.newsletterStatus)}</td>
                    <td>{row.savedCount == null ? '—' : row.savedCount}</td>
                    <td>{formatWhen(row.lastSeenAt || row.subscribedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selected ? (
          <div className="admin-table-expand-panel" style={{ marginTop: '1rem' }}>
            <DetailSection title="Parent information">
              <DetailRow label="Email" value={selected.email} />
              <DetailRow
                label="Account"
                value={selected.hasAccount ? (selected.emailVerifiedAt ? 'Verified' : 'Unverified') : 'Newsletter only'}
              />
              <DetailRow label="Created" value={formatWhen(selected.createdAt)} />
              <DetailRow label="Last activity" value={formatWhen(selected.lastSeenAt)} />
              <DetailRow
                label="Magic link"
                value={selected.lastLoginSentAt ? `Sent ${formatWhen(selected.lastLoginSentAt)}` : '—'}
              />
            </DetailSection>
            <DetailSection title="Newsletter">
              <DetailRow label="Status" value={newsletterLabel(selected.newsletterStatus)} />
              <DetailRow label="Signup date" value={formatWhen(selected.subscribedAt)} />
              <DetailRow label="Signup source" value={sourceLabel(selected.signupSource)} />
              <DetailRow label="Consent" value={selected.consentVersion} />
            </DetailSection>
            <DetailSection title="Saved activity">
              <DetailRow
                label="Total saved"
                value={
                  selected.savedCount == null
                    ? 'Unavailable until this email is linked to an account'
                    : String(selected.savedCount)
                }
              />
            </DetailSection>
            {interestView === 'per_parent' && selected.hasAccount && selectedInterests ? (
              <div className="admin-interest-from-saves">
                <h4>From their saves</h4>
                {selected.saves.length === 0 ? (
                  <p>No active saved events to derive interest from.</p>
                ) : (
                  <>
                    <div className="admin-interest-chips">
                      {selectedInterests.types.map((type) => (
                        <span key={type} className="admin-interest-chip">
                          {type}
                        </span>
                      ))}
                      {selectedInterests.cities.map((city) => (
                        <span key={city} className="admin-interest-chip">
                          {city}
                        </span>
                      ))}
                    </div>
                    <p>
                      Derived at open time from {selected.saves.length} saved event
                      {selected.saves.length === 1 ? '' : 's'} — no extra fields written.
                    </p>
                  </>
                )}
              </div>
            ) : null}
            {selected.hasAccount ? (
              selected.saves.length > 0 ? (
                <ul className="admin-audience-saves">
                  {selected.saves.map((save) => {
                    const event = getCatalogEventById(save.eventId)
                    return (
                      <li key={`${save.eventId}-${save.savedAt}`}>
                        <strong>{event?.title || save.eventId}</strong>
                        <span>
                          {event ? formatEventDate(event.date) : '—'} · {eventCategories(save.eventId)}
                          {event?.city ? ` · ${event.city}` : ''}
                        </span>
                        <span>Saved {formatWhen(save.savedAt)}</span>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted">No active saved events.</p>
              )
            ) : null}
            <div className="admin-table-actions" style={{ marginTop: '1rem' }}>
              {selected.hasAccount && !selected.emailVerifiedAt ? (
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  disabled={busyKey === selected.email}
                  onClick={() => void handleVerify(selected)}
                >
                  Verify email (local fallback)
                </button>
              ) : null}
              {selected.newsletterStatus === 'subscribed' ? (
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  disabled={busyKey === selected.email}
                  onClick={() => void handleUnsubscribe(selected)}
                >
                  Mark unsubscribed
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    </>
  )
}

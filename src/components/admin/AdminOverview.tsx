import type { AdminEventViewId } from '../../types/admin'

interface AdminOverviewProps {
  counts: {
    live: number
    draft: number
    hidden: number
    expired: number
    past: number
    needsVerification: number
  }
  activeView: AdminEventViewId | 'all'
  onSelectView: (view: AdminEventViewId | 'all') => void
}

const CARDS: {
  key: AdminEventViewId | 'all'
  label: string
  countKey: keyof AdminOverviewProps['counts'] | null
  hint: string
}[] = [
  { key: 'live', label: 'Live', countKey: 'live', hint: 'On the public website' },
  { key: 'draft', label: 'Draft', countKey: 'draft', hint: 'Not published yet' },
  { key: 'hidden', label: 'Hidden', countKey: 'hidden', hint: 'Removed from site' },
  { key: 'expired', label: 'Expired', countKey: 'expired', hint: 'Archived manually' },
  { key: 'past', label: 'Past', countKey: 'past', hint: 'Schedule has passed' },
  { key: 'needs-verification', label: 'Needs check', countKey: 'needsVerification', hint: 'Stale or missing last checked' },
]

export function AdminOverview({ counts, activeView, onSelectView }: AdminOverviewProps) {
  return (
    <section aria-label="Overview">
      <div className="admin-stat-grid">
        {CARDS.map((card) => {
          const count = card.countKey ? counts[card.countKey] : 0
          const isActive = activeView === card.key
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => onSelectView(card.key)}
              className={`admin-stat-card ${isActive ? 'admin-stat-card-active' : ''}`}
            >
              <div className="admin-stat-value">{count}</div>
              <div className="admin-stat-label">{card.label}</div>
              <div className="admin-stat-hint">{card.hint}</div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

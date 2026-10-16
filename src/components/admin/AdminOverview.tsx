import type { AdminEventCatalog, AdminEventViewId } from '../../types/admin'

interface AdminOverviewProps {
  catalog: AdminEventCatalog
  counts: {
    live: number
    past: number
    draft: number
    needsAttention: number
  }
  activeView: AdminEventViewId | 'all'
  onSelectView: (view: AdminEventViewId | 'all') => void
}

const CARDS: {
  key: AdminEventViewId
  label: string
  countKey: keyof AdminOverviewProps['counts']
  regularHint: string
  seasonalHint: string
}[] = [
  {
    key: 'live',
    label: 'Live',
    countKey: 'live',
    regularHint: 'Core-city public listings',
    seasonalHint: 'Current seasonal & regional listings',
  },
  {
    key: 'draft',
    label: 'Drafts',
    countKey: 'draft',
    regularHint: 'Ready to review before publishing',
    seasonalHint: 'Seasonal drafts before publishing',
  },
  {
    key: 'needs-attention',
    label: 'Needs attention',
    countKey: 'needsAttention',
    regularHint: 'Live events that need review',
    seasonalHint: 'Seasonal & regional that need review',
  },
  {
    key: 'past',
    label: 'Past',
    countKey: 'past',
    regularHint: 'Schedule has passed',
    seasonalHint: 'Seasonal & regional that have passed',
  },
]

export function AdminOverview({
  catalog,
  counts,
  activeView,
  onSelectView,
}: AdminOverviewProps) {
  return (
    <section aria-label="Overview">
      <div className="admin-stat-grid admin-stat-grid-compact">
        {CARDS.map((card) => {
          const count = counts[card.countKey]
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
              <div className="admin-stat-hint">
                {catalog === 'seasonal' ? card.seasonalHint : card.regularHint}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

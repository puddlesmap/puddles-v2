import type { AdminEventViewId } from '../../types/admin'

interface AdminOverviewProps {
  counts: {
    live: number
    past: number
    needsAttention: number
  }
  activeView: AdminEventViewId | 'all'
  onSelectView: (view: AdminEventViewId | 'all') => void
}

const CARDS: {
  key: AdminEventViewId
  label: string
  countKey: keyof AdminOverviewProps['counts']
  hint: string
}[] = [
  { key: 'live', label: 'Live', countKey: 'live', hint: 'On the public website' },
  {
    key: 'needs-attention',
    label: 'Needs attention',
    countKey: 'needsAttention',
    hint: 'Live events that need review',
  },
  { key: 'past', label: 'Past', countKey: 'past', hint: 'Schedule has passed' },
]

export function AdminOverview({ counts, activeView, onSelectView }: AdminOverviewProps) {
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
              <div className="admin-stat-hint">{card.hint}</div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

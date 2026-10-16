import type { AdminEventCatalog, AdminEventViewId } from '../../types/admin'

interface AdminOverviewProps {
  catalog: AdminEventCatalog
  counts: {
    live: number
    past: number
  }
  activeView: AdminEventViewId | 'all'
  onSelectView: (view: AdminEventViewId | 'all') => void
}

const CARDS: {
  key: AdminEventViewId
  label: string
  countKey: 'live' | 'past'
  regularHint: string
  seasonalHint: string
}[] = [
  {
    key: 'live',
    label: 'Live',
    countKey: 'live',
    regularHint: 'Everyday Browse in Palo Alto, Los Altos, Mountain View, and Sunnyvale',
    seasonalHint: 'Every collection on Home today, in one list',
  },
  {
    key: 'past',
    label: 'Past',
    countKey: 'past',
    regularHint: 'The date has passed',
    seasonalHint: 'The date has passed',
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

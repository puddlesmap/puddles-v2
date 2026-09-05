import { Link } from 'react-router-dom'
import { SeasonalThemeCalendarReview } from '../../components/seasonal/SeasonalThemeCalendarReview'
import { getLiveSeasonalThemeScheduleEntries } from '../../data/seasonalDiscovery'

export function AdminSeasonalCalendarPage() {
  const liveEntries = getLiveSeasonalThemeScheduleEntries()

  return (
    <div className="admin-seasonal-calendar-page">
      <div className="admin-events-header">
        <div>
          <h2 className="font-display text-xl text-charcoal">Seasonal calendar</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
            Editorial schedule for home seasonal modules. Hello Fall and Halloween overlap Oct 5–31
            (two Home bands); later months hand off in sequence.
          </p>
        </div>
        <div className="admin-events-header-actions">
          <Link to="/experiment/seasonal-discovery/calendar" className="admin-btn admin-btn-secondary">
            Experiment calendar ↗
          </Link>
          <Link to="/experiment/seasonal-discovery" className="admin-btn admin-btn-secondary">
            Seasonal experiment ↗
          </Link>
        </div>
      </div>

      {liveEntries.length > 0 ? (
        <p className="admin-seasonal-calendar-page__live-note" role="status">
          Live module{liveEntries.length > 1 ? 's' : ''} today:{' '}
          <strong>{liveEntries.map((entry) => entry.moduleTitle).join(' · ')}</strong>
        </p>
      ) : (
        <p className="admin-seasonal-calendar-page__live-note" role="status">
          No seasonal module is scheduled for today.
        </p>
      )}

      <SeasonalThemeCalendarReview />

      <p className="admin-seasonal-calendar-page__source-note">
        Schedule source: <code>src/data/seasonalDiscovery.ts</code> (
        <code>SEASONAL_THEME_SCHEDULE</code>). Curated collections: Fall (
        <Link to="/experiment/seasonal-discovery/hello-fall">hello-fall</Link>
        ), Halloween (
        <Link to="/experiment/seasonal-discovery/halloween-with-little-ones">
          halloween-with-little-ones
        </Link>
        ).
      </p>
    </div>
  )
}

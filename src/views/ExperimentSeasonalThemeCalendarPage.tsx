import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { PageContainer } from '../components/layout/PageContainer'
import { Footer } from '../components/layout/Footer'
import { SeasonalThemeCalendarReview } from '../components/seasonal/SeasonalThemeCalendarReview'
import { formatDocumentTitle, setPageTitle } from '../utils/siteMeta'

export function ExperimentSeasonalThemeCalendarPage() {
  const location = useLocation()

  useEffect(() => {
    setPageTitle(formatDocumentTitle('Seasonal Theme Calendar'), location.pathname)
  }, [location.pathname])

  return (
    <div className="browse-page-shell browse-page-shell--experiment seasonal-calendar-review-page">
      <AppHeader />
      <div className="browse-page-body">
        <PageContainer layout="wide" className="browse-content">
          <header className="browse-discovery-banner seasonal-calendar-review-banner">
            <p className="browse-discovery-banner__eyebrow">Seasonal discovery</p>
            <h1 className="browse-discovery-banner__title">Theme calendar review</h1>
            <p className="browse-discovery-banner__lede">
              Editorial schedule for home seasonal modules — one live theme at a time, with gradual
              handoffs between Fall, Halloween, and Holiday magic.
            </p>
            <p className="browse-discovery-banner__links">
              <Link to="/admin/seasonal-calendar">Admin calendar review</Link>
              {' · '}
              <Link to="/experiment/seasonal-discovery">Seasonal discovery experiment</Link>
              {' · '}
              <Link to="/experiment/browse-live-vs-option2">Live vs Option 2 cards</Link>
            </p>
          </header>

          <SeasonalThemeCalendarReview />
        </PageContainer>
      </div>
      <Footer />
    </div>
  )
}

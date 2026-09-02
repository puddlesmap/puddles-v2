import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { HomeExperimentPage } from './HomeExperimentPage'
import { SeasonalDiscoveryModule } from '../components/seasonal/SeasonalDiscoveryModule'
import { SeasonalBrowseCategoriesPreview } from '../components/seasonal/SeasonalBrowseCategoriesPreview'
import {
  PUDDLES_WORDMARK_LOGO_SRC,
  PUDDLES_WORDMARK_LOGO_SRC_2X,
} from './experimentShared'
import { SeasonalThemeCalendarReview } from '../components/seasonal/SeasonalThemeCalendarReview'
import {
  getSeasonalCollectionForExperiment,
  getUpcomingSeasonalCollectionForExperiment,
  resolveFeaturedSeasonalEvents,
  seasonalCollectionPath,
} from '../data/seasonalDiscovery'
import { useEventNavigation } from '../hooks/useEventNavigation'

export function ExperimentSeasonalDiscoveryPage() {
  const openEvent = useEventNavigation()
  const collection = getSeasonalCollectionForExperiment()
  const upcoming = getUpcomingSeasonalCollectionForExperiment()

  const featuredEvents = useMemo(
    () => resolveFeaturedSeasonalEvents(collection),
    [collection],
  )

  const topBand = (
    <SeasonalDiscoveryModule
      collection={collection}
      events={featuredEvents}
      onEventClick={(event) => openEvent(event, 'home', { viewMode: 'list' })}
      bandLayout="home"
      homeBandEyebrow="timing"
      homeBandCopyTone="neutral"
    />
  )

  const afterResults = (
    <>
      <aside className="seasonal-next-preview" aria-label="Next seasonal theme">
        <p className="seasonal-next-preview__eyebrow">Coming next</p>
        <div className="seasonal-next-preview__row">
          <img
            src={upcoming.illustrationSrc}
            alt=""
            className="seasonal-next-preview__illustration"
            width={72}
            height={72}
            decoding="async"
          />
          <div className="seasonal-next-preview__copy">
            <h2 className="seasonal-next-preview__title">{upcoming.subtitle}</h2>
            <p className="seasonal-next-preview__tagline">{upcoming.moduleTagline}</p>
          </div>
          <Link
            to={seasonalCollectionPath(upcoming.slug)}
            className="seasonal-next-preview__cta"
          >
            Preview Halloween →
          </Link>
        </div>
      </aside>

      <SeasonalBrowseCategoriesPreview />
      <SeasonalThemeCalendarReview compact />
      <p className="seasonal-discovery-experiment-note seasonal-discovery-experiment-note--calendar">
        <Link to="/experiment/seasonal-discovery/calendar">Open full calendar review →</Link>
      </p>
    </>
  )

  const leading = (
    <p className="seasonal-discovery-experiment-note">
      Seasonal discovery experiment — Hello, Fall is live; Halloween is a separate October
      collection.{' '}
      <Link to="/experiment/seasonal-bg-dial" className="seasonal-discovery-experiment-note__link">
        Open background color dial
      </Link>
      {' · '}
      <Link to="/" className="seasonal-discovery-experiment-note__link">
        View production home
      </Link>
    </p>
  )

  return (
    <HomeExperimentPage
      pageClassName="home-experiment-page--refined home-experiment-page--seasonal-discovery"
      shellClassName="home-experiment-shell--refined"
      heroVariant="refined"
      layout="refined"
      logoOnly={false}
      logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
      logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
      showBrandName={false}
      leading={leading}
      topBand={topBand}
      afterResults={afterResults}
    />
  )
}

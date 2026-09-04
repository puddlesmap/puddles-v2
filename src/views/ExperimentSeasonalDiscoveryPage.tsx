import { useMemo } from 'react'
import { HomeExperimentPage } from './HomeExperimentPage'
import { SeasonalDiscoveryModule } from '../components/seasonal/SeasonalDiscoveryModule'
import { SeasonalBrowseCategoriesPreview } from '../components/seasonal/SeasonalBrowseCategoriesPreview'
import { HomeLaunchAnnouncement } from '../components/home/HomeLaunchAnnouncement'
import {
  PUDDLES_WORDMARK_LOGO_SRC,
  PUDDLES_WORDMARK_LOGO_SRC_2X,
} from './experimentShared'
import {
  getComingNextSeasonalTeaser,
  getSeasonalCollectionForExperiment,
  resolveFeaturedSeasonalEvents,
} from '../data/seasonalDiscovery'
import { useEventNavigation } from '../hooks/useEventNavigation'

export function ExperimentSeasonalDiscoveryPage() {
  const openEvent = useEventNavigation()
  const collection = getSeasonalCollectionForExperiment()
  const comingNext = getComingNextSeasonalTeaser()

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
      {comingNext ? (
        <aside className="seasonal-next-preview" aria-label="Next seasonal theme">
          <p className="seasonal-next-preview__eyebrow">Coming next</p>
          <div className="seasonal-next-preview__row">
            <img
              src={comingNext.illustrationSrc}
              alt=""
              className="seasonal-next-preview__illustration"
              width={72}
              height={72}
              decoding="async"
            />
            <div className="seasonal-next-preview__copy">
              <h2 className="seasonal-next-preview__title">{comingNext.subtitle}</h2>
              <p className="seasonal-next-preview__tagline">{comingNext.moduleTagline}</p>
            </div>
          </div>
        </aside>
      ) : null}

      <SeasonalBrowseCategoriesPreview />
    </>
  )

  return (
    <HomeExperimentPage
      pageClassName="home-experiment-page--refined home-experiment-page--seasonal-discovery home-experiment-page--planetbox-band"
      shellClassName="home-experiment-shell--refined home-experiment-shell--seasonal-puddles-aligned"
      heroVariant="refined"
      layout="refined"
      logoOnly={false}
      logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
      logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
      showBrandName={false}
      headerBelow={<HomeLaunchAnnouncement />}
      topBand={topBand}
      afterResults={afterResults}
    />
  )
}

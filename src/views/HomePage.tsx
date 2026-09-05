import { HomeExperimentPage } from './HomeExperimentPage'
import { HomeSeasonalDiscoveryBands } from '../components/seasonal/HomeSeasonalDiscoveryBands'
import { SeasonalBrowseCategoriesPreview } from '../components/seasonal/SeasonalBrowseCategoriesPreview'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import { useStructuredData } from '../hooks/useStructuredData'
import { websiteJsonLd, websiteStructuredDataId } from '../utils/siteStructuredData'
import { getComingNextSeasonalTeaser } from '../data/seasonalDiscovery'
import { HomeLaunchAnnouncement } from '../components/home/HomeLaunchAnnouncement'
import { useEventNavigation } from '../hooks/useEventNavigation'

export function HomePage() {
  useStructuredData(websiteStructuredDataId, websiteJsonLd)
  const openEvent = useEventNavigation()
  const comingNext = getComingNextSeasonalTeaser()

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
      topBand={
        <HomeSeasonalDiscoveryBands
          onEventClick={(event) => openEvent(event, 'home', { viewMode: 'list' })}
        />
      }
      afterResults={afterResults}
    />
  )
}

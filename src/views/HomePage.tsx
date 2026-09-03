import { useMemo } from 'react'
import { HomeExperimentPage } from './HomeExperimentPage'
import { SeasonalDiscoveryModule } from '../components/seasonal/SeasonalDiscoveryModule'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import { useStructuredData } from '../hooks/useStructuredData'
import { websiteJsonLd, websiteStructuredDataId } from '../utils/siteStructuredData'
import {
  getActiveSeasonalCollection,
  resolveFeaturedSeasonalEvents,
} from '../data/seasonalDiscovery'
import { HomeLaunchAnnouncement } from '../components/home/HomeLaunchAnnouncement'
import { useEventNavigation } from '../hooks/useEventNavigation'

export function HomePage() {
  useStructuredData(websiteStructuredDataId, websiteJsonLd)
  const openEvent = useEventNavigation()
  const collection = getActiveSeasonalCollection()
  const featuredEvents = useMemo(
    () => (collection ? resolveFeaturedSeasonalEvents(collection) : []),
    [collection],
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
        collection ? (
          <SeasonalDiscoveryModule
            collection={collection}
            events={featuredEvents}
            onEventClick={(event) => openEvent(event, 'home', { viewMode: 'list' })}
            bandLayout="home"
            homeBandEyebrow="timing"
            homeBandCopyTone="neutral"
          />
        ) : null
      }
    />
  )
}

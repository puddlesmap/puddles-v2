import { Link } from 'react-router-dom'
import { HomeExperimentPage } from './HomeExperimentPage'
import { HomeSeasonalDiscoveryBands } from '../components/seasonal/HomeSeasonalDiscoveryBands'
import { HomeLaunchAnnouncement } from '../components/home/HomeLaunchAnnouncement'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import { useLaunchStagingCatalog } from '../context/LaunchStagingContext'
import { useEventNavigation } from '../hooks/useEventNavigation'

/** Pre-deployment review — discovery band, launch announcement, Sunnyvale city chip. */
export function HomeLaunchPreviewPage() {
  const openEvent = useEventNavigation()
  const { getCatalog } = useLaunchStagingCatalog()

  const leading = (
    <p className="home-launch-preview-note">
      Launch preview — staging catalog on.{' '}
      <Link to="/experiment/seasonal-launch-review">Review hub</Link>
      {' · '}
      <Link to="/">Production home</Link>
    </p>
  )

  return (
    <HomeExperimentPage
      pageClassName="home-experiment-page--refined home-experiment-page--seasonal-discovery home-experiment-page--planetbox-band home-experiment-page--launch-preview"
      shellClassName="home-experiment-shell--refined home-experiment-shell--launch-preview home-experiment-shell--seasonal-puddles-aligned"
      heroVariant="refined"
      layout="refined"
      logoOnly={false}
      logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
      logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
      showBrandName={false}
      headerBelow={<HomeLaunchAnnouncement />}
      leading={leading}
      getEventsCatalog={getCatalog}
      topBand={
        <HomeSeasonalDiscoveryBands
          catalog={getCatalog()}
          onEventClick={(event) => openEvent(event, 'home', { viewMode: 'list' })}
        />
      }
    />
  )
}

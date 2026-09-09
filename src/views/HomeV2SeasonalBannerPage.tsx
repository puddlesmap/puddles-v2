import { Link } from 'react-router-dom'
import { useCallback, useState } from 'react'
import { HomeExperimentPage } from './HomeExperimentPage'
import { HomeSeasonalDiscoveryBands } from '../components/seasonal/HomeSeasonalDiscoveryBands'
import { HomeSeasonalScrollBlend } from '../components/seasonal/HomeSeasonalScrollBlend'
import { SeasonalBrowseCategoriesPreview } from '../components/seasonal/SeasonalBrowseCategoriesPreview'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import { getComingNextSeasonalTeaser } from '../data/seasonalDiscovery'
import { HomeLaunchAnnouncement } from '../components/home/HomeLaunchAnnouncement'
import { useEventNavigation } from '../hooks/useEventNavigation'
import type { Event } from '../types/event'

/**
 * Home v2 — seasonal banner exploration (saved for later).
 *
 * Mobile: compact Hello Fall dock above bottom nav (title + description + map-sheet
 * cards); on scroll the dock blends away and the full band appears after main cards.
 * Desktop: seasonal band under the header (same as production).
 */
export function HomeV2SeasonalBannerPage() {
  const openEvent = useEventNavigation()
  const comingNext = getComingNextSeasonalTeaser()
  const [seasonalDockCollapsed, setSeasonalDockCollapsed] = useState(false)

  const handleSeasonalCollapsed = useCallback((collapsed: boolean) => {
    setSeasonalDockCollapsed(collapsed)
  }, [])

  const openSeasonalEvent = useCallback(
    (event: Event) => openEvent(event, 'home', { viewMode: 'list' }),
    [openEvent],
  )

  const leading = (
    <p className="home-launch-preview-note">
      Home v2 — seasonal banner exploration.{' '}
      <Link to="/">Production home</Link>
    </p>
  )

  const afterResults = (
    <>
      <div
        className={[
          'home-seasonal-inline-band',
          seasonalDockCollapsed ? 'home-seasonal-inline-band--visible' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden={!seasonalDockCollapsed}
      >
        <HomeSeasonalDiscoveryBands onEventClick={openSeasonalEvent} />
      </div>

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
      pageClassName="home-experiment-page--refined home-experiment-page--seasonal-discovery home-experiment-page--planetbox-band home-experiment-page--seasonal-bottom-dock"
      shellClassName="home-experiment-shell--refined home-experiment-shell--seasonal-puddles-aligned"
      heroVariant="refined"
      layout="refined"
      logoOnly={false}
      logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
      logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
      showBrandName={false}
      headerBelow={<HomeLaunchAnnouncement />}
      leading={leading}
      topBand={
        <div className="home-seasonal-desktop-band">
          <HomeSeasonalDiscoveryBands onEventClick={openSeasonalEvent} />
        </div>
      }
      mobileBottomDock={
        <HomeSeasonalScrollBlend onCollapsedChange={handleSeasonalCollapsed}>
          <HomeSeasonalDiscoveryBands
            variant="compact"
            maxEvents={4}
            onEventClick={openSeasonalEvent}
          />
        </HomeSeasonalScrollBlend>
      }
      afterResults={afterResults}
    />
  )
}

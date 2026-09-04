import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { HomeExperimentPage } from './HomeExperimentPage'
import { SeasonalDiscoveryModule } from '../components/seasonal/SeasonalDiscoveryModule'
import { SeasonalBrowseCategoriesPreview } from '../components/seasonal/SeasonalBrowseCategoriesPreview'
import { HomeLaunchAnnouncement } from '../components/home/HomeLaunchAnnouncement'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import {
  getActiveSeasonalCollection,
  getComingNextSeasonalTeaser,
  resolveFeaturedSeasonalEvents,
} from '../data/seasonalDiscovery'
import { useEventNavigation } from '../hooks/useEventNavigation'
import './experiment-home-apricot-band.css'

/**
 * Review mockup: full Home chrome with Browse by activity always below Today results.
 * Coming next stays date-gated (hidden outside the 14-day window).
 */
export function ExperimentHomeBrowseChipsMockupPage() {
  const openEvent = useEventNavigation()
  const collection = getActiveSeasonalCollection()
  const comingNext = getComingNextSeasonalTeaser()
  const featuredEvents = useMemo(
    () => (collection ? resolveFeaturedSeasonalEvents(collection) : []),
    [collection],
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

  const leading = (
    <div className="home-apricot-mockup-rules" aria-labelledby="browse-chips-mockup-heading">
      <p className="home-apricot-mockup-rules__eyebrow">Review mockup · not a separate deploy</p>
      <h1 id="browse-chips-mockup-heading" className="home-apricot-mockup-rules__title">
        Browse by activity — always on Home
      </h1>
      <p className="home-apricot-mockup-rules__lede">
        Scroll past Today&apos;s activity cards. Chips stay year-round (no lede). Coming next only
        appears in the last 14 days before the next seasonal theme.
        {comingNext
          ? ' Coming next is visible today.'
          : ' Coming next is hidden today (outside the window).'}{' '}
        Compare <Link to="/">production Home</Link>.
      </p>
    </div>
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
      leading={leading}
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
      afterResults={afterResults}
    />
  )
}

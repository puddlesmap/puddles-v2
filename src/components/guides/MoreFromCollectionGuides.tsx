import { Link } from 'react-router-dom'
import {
  getSiblingGuides,
  type GuideCatalogEntry,
} from '../../data/guidesCatalog'
import {
  HOLIDAY_MAGIC_HUB_GUIDE_COPY,
  type HolidayMagicHubGuideSlug,
} from '../../data/holidayMagicHubGuides'
import {
  getSeasonalCollection,
  seasonalCollectionPath,
  type SeasonalCollectionSlug,
} from '../../data/seasonalDiscovery'
import { trackGuideSeasonalHubClicked } from '../../utils/analytics'
import { guideCommonProps } from '../../utils/guideVisitAnalytics'
import {
  SeasonalGuidesCarousel,
  type SeasonalCarouselGuide,
} from './SeasonalGuidesCarousel'
import './holiday-magic-guides-panel.css'
import './moreFromCollectionGuides.css'

function toCarouselGuide(guide: GuideCatalogEntry): SeasonalCarouselGuide {
  const copy = HOLIDAY_MAGIC_HUB_GUIDE_COPY[guide.slug as HolidayMagicHubGuideSlug]
  if (!copy) return guide
  return {
    ...guide,
    displayTitle: `${guide.title} ${copy.emoji}`,
    hubDek: copy.sentence,
  }
}

/** Sibling guides in the Holiday Magic Explore-the-guides card-grid layout. */
export function MoreFromCollectionGuides({
  collectionSlug,
  currentSlug,
}: {
  collectionSlug: SeasonalCollectionSlug
  currentSlug: string
}) {
  const collection = getSeasonalCollection(collectionSlug)
  const siblings = getSiblingGuides(collectionSlug, currentSlug).map(toCarouselGuide)
  if (!collection || siblings.length === 0) return null

  const hubHref = seasonalCollectionPath(collection.slug)

  return (
    <div className="hmg-guides-carousel more-from-collection">
      <div className="more-from-collection__hub">
        <Link
          className="more-from-collection__hub-link"
          to={hubHref}
          onClick={() => {
            trackGuideSeasonalHubClicked(
              currentSlug,
              'more_from_collection',
              hubHref,
              guideCommonProps(currentSlug),
            )
          }}
        >
          Explore {collection.subtitle} hub →
        </Link>
      </div>
      <SeasonalGuidesCarousel
        guides={siblings}
        heading={`More from ${collection.subtitle}`}
        desktopMode="card-grid"
      />
    </div>
  )
}

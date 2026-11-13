import {
  getSiblingGuides,
  type GuideCatalogEntry,
} from '../../data/guidesCatalog'
import {
  getSeasonalCollection,
  type SeasonalCollectionSlug,
} from '../../data/seasonalDiscovery'
import {
  SeasonalGuidesCarousel,
  type SeasonalCarouselGuide,
} from './SeasonalGuidesCarousel'
import './holiday-magic-guides-panel.css'
import './moreFromCollectionGuides.css'

/** Short card deks — ~2/3 of full guide deks, same spirit as the hub. */
const LIGHTS_HUB_DEK = 'Train rides, Santa visits & festive outings.'
const STORIES_HUB_DEK = 'Shows, stories, crafts & winter play.'
const NEW_YEAR_HUB_DEK = 'Balloon drops & January traditions.'

function toCarouselGuide(guide: GuideCatalogEntry): SeasonalCarouselGuide {
  if (guide.slug === 'holiday-lights-traditions') {
    return {
      ...guide,
      displayTitle: `${guide.title} ✨`,
      hubDek: LIGHTS_HUB_DEK,
    }
  }
  if (guide.slug === 'holiday-stories-play') {
    return {
      ...guide,
      displayTitle: `${guide.title} 🎭`,
      hubDek: STORIES_HUB_DEK,
    }
  }
  if (guide.slug === 'hello-new-year') {
    return {
      ...guide,
      displayTitle: `${guide.title} 🎉`,
      hubDek: NEW_YEAR_HUB_DEK,
    }
  }
  return guide
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

  return (
    <div className="hmg-guides-carousel more-from-collection">
      <SeasonalGuidesCarousel
        guides={siblings}
        heading={`More from ${collection.subtitle}`}
        desktopMode="card-grid"
      />
    </div>
  )
}

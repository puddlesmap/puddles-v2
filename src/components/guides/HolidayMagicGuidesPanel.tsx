import { orderGuidesForCollectionHub } from '../../data/guideHubFeatured'
import {
  SeasonalGuidesCarousel,
  type SeasonalCarouselGuide,
} from './SeasonalGuidesCarousel'
import './holiday-magic-guides-panel.css'

/** Hub-only featured dek — shorter than the guide article dek (mobile cards). */
const LIGHTS_HUB_DEK = 'Train rides, Santa visits & festive outings.'

function hubGuides(): SeasonalCarouselGuide[] {
  return orderGuidesForCollectionHub('holiday-magic').map((guide) => {
    if (guide.slug === 'holiday-lights-traditions') {
      return {
        ...guide,
        displayTitle: `${guide.title} ✨`,
        hubDek: LIGHTS_HUB_DEK,
      }
    }
    if (guide.slug === 'holiday-stories-play') {
      return { ...guide, displayTitle: `${guide.title} 🎭` }
    }
    if (guide.slug === 'hello-new-year') {
      return { ...guide, displayTitle: `${guide.title} 🎉` }
    }
    return guide
  })
}

/** Explore-the-guides section on the Holiday Magic seasonal hub. */
export function HolidayMagicGuidesPanel() {
  return (
    <div className="hmg-guides-carousel">
      <SeasonalGuidesCarousel guides={hubGuides()} desktopMode="card-grid" />
    </div>
  )
}

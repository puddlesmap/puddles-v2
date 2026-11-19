import {
  HOLIDAY_MAGIC_GUIDES_HEADING_DEK,
  HOLIDAY_MAGIC_HUB_GUIDE_COPY,
  type HolidayMagicHubGuideSlug,
} from '../../data/holidayMagicHubGuides'
import { orderGuidesForCollectionHub } from '../../data/guideHubFeatured'
import {
  SeasonalGuidesCarousel,
  type SeasonalCarouselGuide,
} from './SeasonalGuidesCarousel'
import './holiday-magic-guides-panel.css'
import '../seasonal/holidayOutingRows.css'

function hubGuides(): SeasonalCarouselGuide[] {
  return orderGuidesForCollectionHub('holiday-magic').map((guide) => {
    const copy = HOLIDAY_MAGIC_HUB_GUIDE_COPY[guide.slug as HolidayMagicHubGuideSlug]
    if (!copy) return guide
    return {
      ...guide,
      displayTitle: `${guide.title} ${copy.emoji}`,
      hubTagline: copy.tagline,
      hubDek: copy.sentence,
    }
  })
}

/** Explore-the-guides section on the Holiday Magic seasonal hub. */
export function HolidayMagicGuidesPanel() {
  return (
    <div className="hmg-guides-carousel">
      <SeasonalGuidesCarousel
        guides={hubGuides()}
        headingDek={HOLIDAY_MAGIC_GUIDES_HEADING_DEK}
        desktopMode="card-grid"
      />
    </div>
  )
}

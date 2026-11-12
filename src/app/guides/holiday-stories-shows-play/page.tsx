import { permanentRedirect } from 'next/navigation'
import { HOLIDAY_STORIES_GUIDE_PATH } from '@/data/holidayStoriesGuide'

export const dynamic = 'force-static'

/** Legacy “Shows & Play” URL → current Holiday Stories & Play path. */
export default function HolidayStoriesGuideLegacyRedirect() {
  permanentRedirect(HOLIDAY_STORIES_GUIDE_PATH)
}

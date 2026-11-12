import { permanentRedirect } from 'next/navigation'
import { HOLIDAY_GUIDE_PATH } from '@/data/holidayGuide'

export const dynamic = 'force-static'

/** Legacy Holiday Magic guide URL → Holiday Lights & Traditions. */
export default function HolidayGuideLegacyRedirect() {
  permanentRedirect(HOLIDAY_GUIDE_PATH)
}

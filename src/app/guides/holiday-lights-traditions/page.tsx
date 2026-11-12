import type { Metadata } from 'next'
import { SiteCatchAllLoader } from '../../[[...slug]]/SiteCatchAllLoader'
import {
  HOLIDAY_GUIDE_COVER,
  HOLIDAY_GUIDE_PATH,
  HOLIDAY_GUIDE_SEO_DESCRIPTION,
  HOLIDAY_GUIDE_SEO_TITLE,
} from '@/data/holidayGuide'

export const dynamic = 'force-static'

const title = HOLIDAY_GUIDE_SEO_TITLE
const description = HOLIDAY_GUIDE_SEO_DESCRIPTION
const canonical = `https://puddlesmap.com${HOLIDAY_GUIDE_PATH}`

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: {
    title,
    description,
    url: canonical,
    type: 'article',
    siteName: 'Puddles the tot map',
    images: [{ url: HOLIDAY_GUIDE_COVER }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [HOLIDAY_GUIDE_COVER],
  },
}

export default function HolidayGuideRoute() {
  return <SiteCatchAllLoader />
}

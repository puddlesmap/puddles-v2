import type { Metadata } from 'next'
import { SiteCatchAllLoader } from '../../[[...slug]]/SiteCatchAllLoader'
import {
  HOLIDAY_STORIES_GUIDE_COVER,
  HOLIDAY_STORIES_GUIDE_PATH,
  HOLIDAY_STORIES_GUIDE_SEO_DESCRIPTION,
  HOLIDAY_STORIES_GUIDE_SEO_TITLE,
} from '@/data/holidayStoriesGuide'

export const dynamic = 'force-static'

const title = HOLIDAY_STORIES_GUIDE_SEO_TITLE
const description = HOLIDAY_STORIES_GUIDE_SEO_DESCRIPTION
const canonical = `https://puddlesmap.com${HOLIDAY_STORIES_GUIDE_PATH}`

export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: false },
  alternates: { canonical },
  openGraph: {
    title,
    description,
    url: canonical,
    type: 'article',
    siteName: 'Puddles the tot map',
    images: [{ url: HOLIDAY_STORIES_GUIDE_COVER }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [HOLIDAY_STORIES_GUIDE_COVER],
  },
}

export default function HolidayStoriesGuideRoute() {
  return <SiteCatchAllLoader />
}

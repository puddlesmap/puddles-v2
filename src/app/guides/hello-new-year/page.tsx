import type { Metadata } from 'next'
import { SiteCatchAllLoader } from '../../[[...slug]]/SiteCatchAllLoader'
import {
  HELLO_NEW_YEAR_GUIDE_COVER,
  HELLO_NEW_YEAR_GUIDE_PATH,
  HELLO_NEW_YEAR_GUIDE_SEO_DESCRIPTION,
  HELLO_NEW_YEAR_GUIDE_SEO_TITLE,
} from '@/data/helloNewYearGuide'

export const dynamic = 'force-static'

const title = HELLO_NEW_YEAR_GUIDE_SEO_TITLE
const description = HELLO_NEW_YEAR_GUIDE_SEO_DESCRIPTION
const canonical = `https://puddlesmap.com${HELLO_NEW_YEAR_GUIDE_PATH}`

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
    images: [{ url: HELLO_NEW_YEAR_GUIDE_COVER }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [HELLO_NEW_YEAR_GUIDE_COVER],
  },
}

export default function HelloNewYearGuideRoute() {
  return <SiteCatchAllLoader />
}

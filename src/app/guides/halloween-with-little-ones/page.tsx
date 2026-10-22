import type { Metadata } from 'next'
import { SiteCatchAllLoader } from '../../[[...slug]]/SiteCatchAllLoader'
import { HALLOWEEN_GUIDE_COVER, HALLOWEEN_GUIDE_PATH } from '@/data/halloweenGuide'

export const dynamic = 'force-static'

const title = 'Halloween with Little Ones: Your 2026 South Peninsula Guide'
const description =
  'Halloween falls on a Saturday this year, but the fun starts well before October 31. From neighborhood parades and pumpkin patches to costume parties and beloved trick-or-treat streets, discover the best ways to celebrate with little ones ages 0–5 in Palo Alto, Los Altos, Mountain View, Sunnyvale, and beyond.'
const canonical = `https://puddlesmap.com${HALLOWEEN_GUIDE_PATH}`

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
    images: [{ url: HALLOWEEN_GUIDE_COVER }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [HALLOWEEN_GUIDE_COVER],
  },
}

export default function HalloweenGuideRoute() {
  return <SiteCatchAllLoader />
}

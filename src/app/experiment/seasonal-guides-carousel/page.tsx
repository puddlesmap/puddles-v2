import { Suspense } from 'react'
import type { Metadata } from 'next'
import { SeasonalGuidesCarouselClient } from './SeasonalGuidesCarouselClient'

export const metadata: Metadata = {
  title: 'Seasonal guides carousel mockups · Puddles',
}

export default function SeasonalGuidesCarouselRoute() {
  return (
    <Suspense fallback={null}>
      <SeasonalGuidesCarouselClient />
    </Suspense>
  )
}

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { HolidayGuidePalettesClient } from './HolidayGuidePalettesClient'

export const metadata: Metadata = {
  title: 'Holiday guide palette mockups · Puddles',
}

export default function HolidayGuidePalettesRoute() {
  return (
    <Suspense fallback={null}>
      <HolidayGuidePalettesClient />
    </Suspense>
  )
}

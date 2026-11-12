import { Suspense } from 'react'
import type { Metadata } from 'next'
import { GuidesHomeMockupsClient } from './GuidesHomeMockupsClient'

export const metadata: Metadata = {
  title: 'Guides home mockups · Puddles',
}

export default function GuidesHomeMockupsRoute() {
  return (
    <Suspense fallback={null}>
      <GuidesHomeMockupsClient />
    </Suspense>
  )
}

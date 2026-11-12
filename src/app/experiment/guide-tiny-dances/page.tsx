import { Suspense } from 'react'
import type { Metadata } from 'next'
import { GuideTinyDancesClient } from './GuideTinyDancesClient'

export const metadata: Metadata = {
  title: 'Guide Tiny Dances layouts · Puddles',
}

export default function GuideTinyDancesRoute() {
  return (
    <Suspense fallback={null}>
      <GuideTinyDancesClient />
    </Suspense>
  )
}

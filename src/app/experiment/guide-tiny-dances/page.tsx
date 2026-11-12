import type { Metadata } from 'next'
import { GuideTinyDancesClient } from './GuideTinyDancesClient'

export const metadata: Metadata = {
  title: 'Guide Tiny Dances layouts · Puddles',
}

export default function GuideTinyDancesRoute() {
  return <GuideTinyDancesClient />
}

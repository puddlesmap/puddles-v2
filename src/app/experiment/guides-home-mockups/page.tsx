import type { Metadata } from 'next'
import { GuidesHomeMockupsClient } from './GuidesHomeMockupsClient'

export const metadata: Metadata = {
  title: 'Guides home mockups · Puddles',
}

export default function GuidesHomeMockupsRoute() {
  return <GuidesHomeMockupsClient />
}

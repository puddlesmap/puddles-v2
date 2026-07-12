'use client'

import dynamic from 'next/dynamic'

const EventDetailPageClient = dynamic(
  () => import('./EventDetailPageClient').then((mod) => mod.EventDetailPageClient),
  { ssr: false },
)

export function EventDetailPageLoader() {
  return <EventDetailPageClient />
}

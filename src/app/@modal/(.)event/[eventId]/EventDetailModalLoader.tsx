'use client'

import dynamic from 'next/dynamic'

/**
 * Keep the intercepting modal out of the Netlify server bundle.
 * The previous page.tsx was a fat client module (~434KB server page) and
 * correlated with /event/* 502s on Netlify.
 */
const EventDetailModalClient = dynamic(
  () => import('./EventDetailModalClient').then((mod) => mod.EventDetailModalClient),
  { ssr: false },
)

export function EventDetailModalLoader() {
  return <EventDetailModalClient />
}

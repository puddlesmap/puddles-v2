'use client'

import dynamic from 'next/dynamic'

const SiteCatchAllClient = dynamic(
  () => import('./SiteCatchAllClient').then((mod) => mod.SiteCatchAllClient),
  { ssr: false },
)

export function SiteCatchAllLoader() {
  return <SiteCatchAllClient />
}

'use client'

import dynamic from 'next/dynamic'

function SiteCatchAllLoading() {
  return (
    <div className="admin-auth-shell" role="status" aria-live="polite">
      <p className="admin-auth-loading">Loading Puddles…</p>
    </div>
  )
}

const SiteCatchAllClient = dynamic(
  () => import('./SiteCatchAllClient').then((mod) => mod.SiteCatchAllClient),
  { ssr: false, loading: SiteCatchAllLoading },
)

export function SiteCatchAllLoader() {
  return <SiteCatchAllClient />
}

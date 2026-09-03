'use client'

import { Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { ClientRoutePage } from '@/components/ClientRoutePage'

function SiteCatchAllInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()

  return <ClientRoutePage pathname={pathname} search={search ? `?${search}` : ''} />
}

function SiteCatchAllLoading() {
  return (
    <div className="admin-auth-shell" role="status" aria-live="polite">
      <p className="admin-auth-loading">Loading Puddles…</p>
    </div>
  )
}

/** Client-only shell — Leaflet (and friends) touch `window` at import time. */
export function SiteCatchAllClient() {
  return (
    <Suspense fallback={<SiteCatchAllLoading />}>
      <SiteCatchAllInner />
    </Suspense>
  )
}

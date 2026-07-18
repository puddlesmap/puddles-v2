'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { MemoryRouter } from 'react-router-dom'
import { SharedEventUrlPage } from '@/components/event-detail/SharedEventUrlPage'
import { useCloseEventDetail } from '@/hooks/useCloseEventDetail'
import { useEventDetailDocument } from '@/hooks/useEventDetailDocument'
import { readEventDetailOverlayState } from '@/utils/nextEventDetailState'

/** Lazy: soft-open background must not pull Leaflet into the event route graph. */
const ClientRoutePage = dynamic(
  () => import('@/components/ClientRoutePage').then((mod) => mod.ClientRoutePage),
  { ssr: false },
)

function backgroundEntryParts(backgroundPath: string): { pathname: string; search: string } {
  const queryIndex = backgroundPath.indexOf('?')
  if (queryIndex === -1) {
    return { pathname: backgroundPath || '/', search: '' }
  }
  return {
    pathname: backgroundPath.slice(0, queryIndex) || '/',
    search: backgroundPath.slice(queryIndex),
  }
}

export function EventDetailPageClient() {
  const params = useParams<{ eventId: string }>()
  const { close, hasInAppReturn } = useCloseEventDetail()
  const { event, lifecycleStatus, now } = useEventDetailDocument({ skipPageMeta: true })
  const overlayBackground = readEventDetailOverlayState()?.backgroundPath

  // Soft-open with @modal: keep Home/Browse as children instead of the standalone event shell.
  if (overlayBackground) {
    const { pathname, search } = backgroundEntryParts(overlayBackground)
    return <ClientRoutePage pathname={pathname} search={search} />
  }

  const entry = params.eventId ? `/event/${params.eventId}` : '/event/unknown'

  return (
    <Suspense fallback={null}>
      <MemoryRouter key={entry} initialEntries={[entry]}>
        <SharedEventUrlPage
          event={event}
          lifecycleStatus={lifecycleStatus}
          lifecycleNow={now}
          hasInAppReturn={hasInAppReturn}
          onClose={close}
          analyticsSource="discovery"
        />
      </MemoryRouter>
    </Suspense>
  )
}

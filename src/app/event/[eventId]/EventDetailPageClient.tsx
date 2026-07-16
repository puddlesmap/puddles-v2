'use client'

import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import { MemoryRouter } from 'react-router-dom'
import { ClientRoutePage } from '@/components/ClientRoutePage'
import { SharedEventUrlPage } from '@/components/event-detail/SharedEventUrlPage'
import { useCloseEventDetail } from '@/hooks/useCloseEventDetail'
import { useEventDetailDocument } from '@/hooks/useEventDetailDocument'
import { readEventDetailOverlayState } from '@/utils/nextEventDetailState'

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
  const { publicEvent, isIndexable } = useEventDetailDocument({ skipPageMeta: true })
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
          event={publicEvent}
          isIndexable={isIndexable}
          hasInAppReturn={hasInAppReturn}
          onClose={close}
          analyticsSource="discovery"
        />
      </MemoryRouter>
    </Suspense>
  )
}

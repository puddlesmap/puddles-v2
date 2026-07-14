'use client'

import { ClientRoutePage } from '@/components/ClientRoutePage'
import { EventDetailView } from '@/components/EventDetailView'
import { EventUnavailableState } from '@/components/empty-states/EventUnavailableState'
import { PageContainer } from '@/components/layout/PageContainer'
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
  const { close, hasInAppReturn } = useCloseEventDetail()
  const { publicEvent, isIndexable } = useEventDetailDocument({ skipPageMeta: true })
  const overlayBackground = readEventDetailOverlayState()?.backgroundPath

  // Soft-open with @modal: keep Home/Browse as children instead of the standalone event shell.
  if (overlayBackground) {
    const { pathname, search } = backgroundEntryParts(overlayBackground)
    return <ClientRoutePage pathname={pathname} search={search} />
  }

  return (
    <div className="event-detail-page-shell event-detail-page-shell--standalone">
      <PageContainer layout="app" className="event-detail-page-body">
        {publicEvent && isIndexable ? (
          <EventDetailView
            event={publicEvent}
            analyticsSource="discovery"
            hasInAppReturn={hasInAppReturn}
            onClose={close}
            presentation="overlay"
            shareInHeader={!hasInAppReturn}
          />
        ) : (
          <EventUnavailableState hasInAppReturn={hasInAppReturn} onClose={close} />
        )}
      </PageContainer>
    </div>
  )
}

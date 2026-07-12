'use client'

import { EventDetailView } from '@/components/EventDetailView'
import { EventUnavailableState } from '@/components/empty-states/EventUnavailableState'
import { PageContainer } from '@/components/layout/PageContainer'
import { useCloseEventDetail } from '@/hooks/useCloseEventDetail'
import { useEventDetailDocument } from '@/hooks/useEventDetailDocument'

export function EventDetailPageClient() {
  const { close, hasInAppReturn } = useCloseEventDetail()
  const { publicEvent, isIndexable } = useEventDetailDocument({ skipPageMeta: true })

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

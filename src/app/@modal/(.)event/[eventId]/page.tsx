'use client'

import { useEffect } from 'react'
import { EventDetailView } from '@/components/EventDetailView'
import { EventUnavailableState } from '@/components/empty-states/EventUnavailableState'
import { useCloseEventDetail } from '@/hooks/useCloseEventDetail'
import { useEventDetailDocument } from '@/hooks/useEventDetailDocument'
import { readEventDetailOverlayState } from '@/utils/nextEventDetailState'

export default function EventDetailModalPage() {
  const { close } = useCloseEventDetail()
  const overlayState = readEventDetailOverlayState()
  const { publicEvent, isIndexable } = useEventDetailDocument({ skipPageMeta: true })

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [close])

  const shareInHeader = overlayState?.eventOpenSource != null

  return (
    <div
      className="event-detail-overlay"
      role="presentation"
      onClick={close}
    >
      <div
        className="event-detail-overlay__dialog"
        role="dialog"
        aria-modal="true"
        aria-label={publicEvent?.title ?? 'Event details'}
        onClick={(event) => event.stopPropagation()}
      >
        {publicEvent && isIndexable ? (
          <EventDetailView
            event={publicEvent}
            analyticsSource={overlayState?.eventOpenSource ?? 'discovery'}
            hasInAppReturn
            onClose={close}
            presentation="overlay"
            shareInHeader={shareInHeader}
          />
        ) : (
          <div className="event-detail-overlay__unavailable">
            <EventUnavailableState hasInAppReturn onClose={close} />
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import { EventDetailView } from '@/components/EventDetailView'
import { EventUnavailableState } from '@/components/empty-states/EventUnavailableState'
import { useCloseEventDetail } from '@/hooks/useCloseEventDetail'
import { useEventDetailDocument } from '@/hooks/useEventDetailDocument'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { readEventDetailOverlayState } from '@/utils/nextEventDetailState'
import { resolveEventOverlayLayout } from '@/utils/eventOverlayLayout'

export default function EventDetailModalPage() {
  const { close } = useCloseEventDetail()
  const overlayState = readEventDetailOverlayState()
  const { publicEvent, isIndexable } = useEventDetailDocument({ skipPageMeta: true })
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const resolvedLayout = resolveEventOverlayLayout(
    overlayState?.backgroundPath ?? overlayState?.returnTo ?? null,
  )
  // v3 / wide chrome is desktop-only; mobile keeps the classic modal shell
  const overlayLayout = isDesktop ? resolvedLayout : 'default'
  const isWideDesktop = overlayLayout === 'wide'
  const isV3Desktop = overlayLayout === 'v3'

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
      className={[
        'event-detail-overlay',
        isWideDesktop ? 'event-detail-overlay--wide' : '',
        isV3Desktop ? 'event-detail-overlay--v3' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="presentation"
      onClick={close}
    >
      <div
        className={[
          'event-detail-overlay__dialog',
          isWideDesktop ? 'event-detail-overlay__dialog--wide' : '',
          isV3Desktop ? 'event-detail-overlay__dialog--v3' : '',
        ]
          .filter(Boolean)
          .join(' ')}
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
            overlayLayout={overlayLayout}
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

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { EventDetailView } from '../components/EventDetailView'
import { EventUnavailableState } from '../components/empty-states/EventUnavailableState'
import { useCloseEventDetail } from '../hooks/useCloseEventDetail'
import { useEventDetailDocument } from '../hooks/useEventDetailDocument'
import { useMediaQuery } from '../hooks/useMediaQuery'
import {
  getEventDetailBackground,
  isEventModalOverlaySource,
  parseEventDetailLocationState,
} from '../utils/eventDetailNavigation'
import { resolveEventOverlayLayout } from '../utils/eventOverlayLayout'

export function EventDetailModalOverlay() {
  const location = useLocation()
  const { close } = useCloseEventDetail()
  const { event: publicEvent, lifecycleStatus, now } = useEventDetailDocument()
  const navState = parseEventDetailLocationState(location.state)
  const analyticsSource = navState?.eventOpenSource
  const backgroundLocation = getEventDetailBackground(location.state)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const resolvedLayout = resolveEventOverlayLayout(
    backgroundLocation?.pathname ?? navState?.returnTo ?? null,
  )
  // v3 / wide chrome is desktop-only; mobile keeps the classic modal shell
  const overlayLayout = isDesktop ? resolvedLayout : 'default'
  const isWideDesktop = overlayLayout === 'wide'
  const isV3Desktop = overlayLayout === 'v3'
  const shareInHeader =
    navState?.eventOpenSource != null &&
    isEventModalOverlaySource(navState.eventOpenSource)

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
        {publicEvent ? (
          <EventDetailView
            event={publicEvent}
            analyticsSource={analyticsSource}
            hasInAppReturn
            onClose={close}
            presentation="overlay"
            overlayLayout={overlayLayout}
            shareInHeader={shareInHeader}
            lifecycleStatus={lifecycleStatus ?? undefined}
            lifecycleNow={now}
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

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { EventDetailView } from '../components/EventDetailView'
import { EventUnavailableState } from '../components/empty-states/EventUnavailableState'
import { useCloseEventDetail } from '../hooks/useCloseEventDetail'
import { useEventDetailDocument } from '../hooks/useEventDetailDocument'
import {
  getEventDetailBackground,
  parseEventDetailLocationState,
} from '../utils/eventDetailNavigation'

export function EventDetailModalOverlay() {
  const location = useLocation()
  const { close } = useCloseEventDetail()
  const { publicEvent, isIndexable } = useEventDetailDocument()
  const navState = parseEventDetailLocationState(location.state)
  const analyticsSource = navState?.eventOpenSource
  const backgroundLocation = getEventDetailBackground(location.state)
  const isWideExperiment =
    backgroundLocation?.pathname === '/experiment-event-modal' ||
    navState?.returnTo?.startsWith('/experiment-event-modal') === true

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
        isWideExperiment ? 'event-detail-overlay--wide' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="presentation"
      onClick={close}
    >
      <div
        className={[
          'event-detail-overlay__dialog',
          isWideExperiment ? 'event-detail-overlay__dialog--wide' : '',
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
            analyticsSource={analyticsSource}
            hasInAppReturn
            onClose={close}
            presentation="overlay"
            overlayLayout={isWideExperiment ? 'wide' : 'default'}
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

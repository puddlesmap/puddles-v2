import { useLocation } from 'react-router-dom'
import { SharedEventUrlPage } from '../components/event-detail/SharedEventUrlPage'
import { useCloseEventDetail } from '../hooks/useCloseEventDetail'
import { useEventDetailDocument } from '../hooks/useEventDetailDocument'
import { parseEventDetailLocationState } from '../utils/eventDetailNavigation'

export function EventDetailPage() {
  const location = useLocation()
  const { close, hasInAppReturn } = useCloseEventDetail()
  const { event, lifecycleStatus, now } = useEventDetailDocument()
  const analyticsSource = parseEventDetailLocationState(location.state)?.eventOpenSource

  return (
    <SharedEventUrlPage
      event={event}
      lifecycleStatus={lifecycleStatus}
      lifecycleNow={now}
      hasInAppReturn={hasInAppReturn}
      onClose={close}
      analyticsSource={analyticsSource}
    />
  )
}

import { useLocation } from 'react-router-dom'
import { SharedEventUrlPage } from '../components/event-detail/SharedEventUrlPage'
import { useCloseEventDetail } from '../hooks/useCloseEventDetail'
import { useEventDetailDocument } from '../hooks/useEventDetailDocument'
import { parseEventDetailLocationState } from '../utils/eventDetailNavigation'

export function EventDetailPage() {
  const location = useLocation()
  const { close, hasInAppReturn } = useCloseEventDetail()
  const { publicEvent, isIndexable } = useEventDetailDocument()
  const analyticsSource = parseEventDetailLocationState(location.state)?.eventOpenSource

  return (
    <SharedEventUrlPage
      event={publicEvent}
      isIndexable={isIndexable}
      hasInAppReturn={hasInAppReturn}
      onClose={close}
      analyticsSource={analyticsSource}
    />
  )
}

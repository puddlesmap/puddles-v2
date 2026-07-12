import { useLocation } from 'react-router-dom'
import { PageContainer } from '../components/layout/PageContainer'
import { EventDetailView } from '../components/EventDetailView'
import { EventUnavailableState } from '../components/empty-states/EventUnavailableState'
import { useCloseEventDetail } from '../hooks/useCloseEventDetail'
import { useEventDetailDocument } from '../hooks/useEventDetailDocument'
import { parseEventDetailLocationState } from '../utils/eventDetailNavigation'

export function EventDetailPage() {
  const location = useLocation()
  const { close, hasInAppReturn } = useCloseEventDetail()
  const { publicEvent, isIndexable } = useEventDetailDocument()
  const analyticsSource = parseEventDetailLocationState(location.state)?.eventOpenSource
  const shareInHeader = !hasInAppReturn

  return (
    <div className="event-detail-page-shell event-detail-page-shell--standalone">
      <PageContainer layout="app" className="event-detail-page-body">
        {publicEvent && isIndexable ? (
          <EventDetailView
            event={publicEvent}
            analyticsSource={analyticsSource}
            hasInAppReturn={hasInAppReturn}
            onClose={close}
            presentation="overlay"
            shareInHeader={shareInHeader}
          />
        ) : (
          <EventUnavailableState hasInAppReturn={hasInAppReturn} onClose={close} />
        )}
      </PageContainer>
    </div>
  )
}

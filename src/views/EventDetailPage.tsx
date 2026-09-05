import { useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { SharedEventUrlPage } from '../components/event-detail/SharedEventUrlPage'
import { parseEventDetailLocationState } from '../utils/eventDetailNavigation'
import {
  getEventLifecycleStatus,
  getLifecycleDetailEventById,
} from '../utils/eventLifecycle'

/**
 * React-router `/event/:eventId` (Vite + ClientRoutePage MemoryRouter).
 * Next.js standalone uses `EventDetailPageClient` instead — do not import next/navigation here.
 */
export function EventDetailPage() {
  const { eventId = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const now = useMemo(() => new Date(), [])
  const event = eventId ? getLifecycleDetailEventById(eventId) : undefined
  const lifecycleStatus = event ? getEventLifecycleStatus(event, now) : null
  const analyticsSource = parseEventDetailLocationState(location.state)?.eventOpenSource

  const hasInAppReturn = Boolean(
    parseEventDetailLocationState(location.state) ||
      (typeof window !== 'undefined' && window.history.length > 1),
  )

  return (
    <SharedEventUrlPage
      event={event}
      lifecycleStatus={lifecycleStatus}
      lifecycleNow={now}
      hasInAppReturn={hasInAppReturn}
      onClose={() => {
        if (hasInAppReturn) navigate(-1)
        else navigate('/browse')
      }}
      analyticsSource={analyticsSource}
    />
  )
}

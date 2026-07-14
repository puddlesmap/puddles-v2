import type { Event } from '../../types/event'
import { sharedEventCityLabel } from '../../utils/sharedEventNearby'

interface SharedEventVisitorIntroProps {
  event: Pick<Event, 'city'>
}

export function SharedEventVisitorIntro({ event }: SharedEventVisitorIntroProps) {
  const city = sharedEventCityLabel(event.city || '')

  return (
    <p className="shared-event-visitor-intro">
      Shared from Puddles · Find nearby activities for ages 0–5 around {city}.
    </p>
  )
}

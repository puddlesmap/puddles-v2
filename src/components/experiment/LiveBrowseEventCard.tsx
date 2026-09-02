import { Link } from 'react-router-dom'
import type { Event } from '../../types/event'
import { isFreeCost } from '../../types/event'
import { getEventCardAgeLabel } from '../../utils/ageRange'
import { formatCardDateTime } from '../../utils/dates'
import { getEventDisplayCategory } from '../../utils/eventImages'
import { formatEventCardLocation } from '../../utils/maps'
import { eventDetailPath } from '../../utils/eventPages'
import { EventImage } from '../EventImage'

interface LiveBrowseEventCardProps {
  event: Event
  onClick?: () => void
}

/** Matches deployed `/browse` EventCard as of Aug 2026 (main branch). */
function LiveBrowseEventCardPills({ event }: { event: Event }) {
  const pills: Array<{ key: string; label: string; tone?: 'category' | 'free' }> = []

  const category = getEventDisplayCategory(event)
  if (category) pills.push({ key: 'category', label: category, tone: 'category' })
  pills.push({ key: 'age', label: getEventCardAgeLabel(event.ageRange) })

  if (isFreeCost(event.cost)) {
    pills.push({ key: 'cost', label: 'Free', tone: 'free' })
  } else {
    pills.push({ key: 'cost', label: event.cost })
  }

  const visible =
    pills.length <= 3 ? pills : pills.filter((pill) => pill.key !== 'category').slice(0, 3)

  return (
    <div className="event-card-pills" aria-hidden>
      {visible.map((pill) => (
        <span
          key={pill.key}
          className={[
            'event-card-pill',
            pill.tone === 'category' ? 'event-card-pill--category' : '',
            pill.tone === 'free' ? 'event-card-pill--free' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {pill.label}
        </span>
      ))}
    </div>
  )
}

export function LiveBrowseEventCard({ event, onClick }: LiveBrowseEventCardProps) {
  const dateTime = formatCardDateTime(event.date, event.startTime)

  return (
    <Link
      to={eventDetailPath(event)}
      onClick={(clickEvent) => {
        if (!onClick) return
        clickEvent.preventDefault()
        onClick()
      }}
      className="card-listing group discovery-event-card"
    >
      <div className="card-listing-media relative aspect-square">
        <EventImage event={event} className="card-listing-image" />
        <LiveBrowseEventCardPills event={event} />
      </div>
      <div className="discovery-event-card-body">
        <div className="discovery-event-meta">
          <p className="discovery-event-datetime">{dateTime}</p>
        </div>
        <h3 className="discovery-event-title">{event.title}</h3>
        <p className="discovery-event-location">{formatEventCardLocation(event)}</p>
      </div>
    </Link>
  )
}

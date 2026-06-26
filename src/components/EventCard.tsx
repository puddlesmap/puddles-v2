import type { Event } from '../types/event'
import { formatCardDateTime } from '../utils/dates'

interface EventCardProps {
  event: Event
  onClick: () => void
  variant?: 'list' | 'grid' | 'map-grid' | 'map-preview-sheet'
  selected?: boolean
  hovered?: boolean
  discovery?: boolean
}

function EventCardPills({ event }: { event: Event }) {
  const pills: Array<{ key: string; label: string; tone?: 'category' | 'free' }> = []

  const category = event.types[0]
  if (category) pills.push({ key: 'category', label: category, tone: 'category' })
  pills.push({ key: 'age', label: `Age ${event.ageRange}` })

  if (event.cost === 'Free') {
    pills.push({ key: 'cost', label: 'Free', tone: 'free' })
  } else if (pills.length < 3) {
    pills.push({ key: 'cost', label: event.cost })
  }

  return (
    <div className="event-card-pills" aria-hidden>
      {pills.slice(0, 3).map((pill) => (
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

function EventCardLocation({ event, discovery = false }: { event: Event; discovery?: boolean }) {
  return (
    <p
      className={
        discovery
          ? 'discovery-event-location'
          : 'card-listing-location event-location'
      }
    >
      {event.venue} · {event.city}
    </p>
  )
}

function cardClass(selected: boolean, hovered: boolean, extra = '') {
  return [
    'card-listing group',
    selected ? 'card-listing--selected' : '',
    hovered ? 'card-listing--hovered' : '',
    extra,
  ]
    .filter(Boolean)
    .join(' ')
}

export function EventCard({
  event,
  onClick,
  variant = 'list',
  selected = false,
  hovered = false,
  discovery = false,
}: EventCardProps) {
  const dateTime = formatCardDateTime(event.date, event.startTime)

  if (variant === 'map-preview-sheet') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cardClass(selected, hovered, 'card-listing--map-preview-sheet')}
      >
        <div className="card-listing-media relative aspect-[16/10]">
          <img
            src={event.imageUrl}
            alt=""
            className="card-listing-image"
            loading="lazy"
          />
          <EventCardPills event={event} />
        </div>
        <div className="card-listing-body card-listing-body--map-preview-sheet">
          <p className="card-listing-datetime">{dateTime}</p>
          <h3 className="card-listing-title">{event.title}</h3>
          <EventCardLocation event={event} />
        </div>
      </button>
    )
  }

  if (variant === 'map-grid') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cardClass(selected, hovered, 'card-listing--map-grid')}
      >
        <div className="card-listing-media relative aspect-square">
          <img
            src={event.imageUrl}
            alt=""
            className="card-listing-image"
            loading="lazy"
          />
          <EventCardPills event={event} />
        </div>
        <div className="card-listing-body">
          <p className="card-listing-datetime">{dateTime}</p>
          <h3 className="card-listing-title">{event.title}</h3>
          <EventCardLocation event={event} />
        </div>
      </button>
    )
  }

  if (variant === 'grid') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cardClass(selected, hovered, discovery ? 'discovery-event-card' : '')}
      >
        <div className="card-listing-media relative aspect-square">
          <img
            src={event.imageUrl}
            alt=""
            className="card-listing-image"
            loading="lazy"
          />
          <EventCardPills event={event} />
        </div>
        <div className={discovery ? 'discovery-event-card-body' : 'card-listing-body'}>
          <p className={discovery ? 'discovery-event-datetime' : 'card-listing-datetime'}>
            {dateTime}
          </p>
          <h3 className={discovery ? 'discovery-event-title' : 'card-listing-title'}>
            {event.title}
          </h3>
          <EventCardLocation event={event} discovery={discovery} />
        </div>
      </button>
    )
  }

  return (
    <button type="button" onClick={onClick} className={cardClass(selected, hovered)}>
      <div className="card-listing-media relative aspect-[20/19]">
        <img
          src={event.imageUrl}
          alt=""
          className="card-listing-image"
          loading="lazy"
        />
        <EventCardPills event={event} />
      </div>
      <div className="card-listing-body card-listing-body--list">
        <p className="card-listing-datetime">{dateTime}</p>
        <h3 className="card-listing-title card-listing-title--list">{event.title}</h3>
        <EventCardLocation event={event} />
      </div>
    </button>
  )
}

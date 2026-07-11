import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { Event } from '../types/event'
import { getEventCardAgeLabel } from '../utils/ageRange'
import { getEventDisplayCategory } from '../utils/eventImages'
import { formatCardDateTime } from '../utils/dates'
import { formatEventCardLocation } from '../utils/maps'
import { eventDetailPath } from '../utils/eventPages'
import { EventImage } from './EventImage'

interface EventCardProps {
  event: Event
  onClick?: () => void
  variant?: 'list' | 'grid' | 'compact-grid' | 'map-grid' | 'map-preview-sheet'
  selected?: boolean
  hovered?: boolean
  discovery?: boolean
}

function EventCardPills({
  event,
  mode = 'full',
}: {
  event: Event
  mode?: 'full' | 'free-only' | 'compact-key'
}) {
  if (mode === 'free-only') {
    if (event.cost !== 'Free') return null

    return (
      <div className="event-card-pills" aria-hidden>
        <span className="event-card-pill event-card-pill--free">Free</span>
      </div>
    )
  }

  if (mode === 'compact-key') {
    const pills: Array<{ key: string; label: string; tone?: 'free' }> = []
    const ageLabel = getEventCardAgeLabel(event.ageRange)
    if (ageLabel) pills.push({ key: 'age', label: ageLabel })
    if (event.cost === 'Free') {
      pills.push({ key: 'cost', label: 'Free', tone: 'free' })
    } else {
      pills.push({ key: 'cost', label: event.cost })
    }

    return (
      <div className="event-card-pills event-card-pills--compact" aria-hidden>
        {pills.slice(0, 2).map((pill) => (
          <span
            key={pill.key}
            className={[
              'event-card-pill',
              'event-card-pill--compact',
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

  const pills: Array<{ key: string; label: string; tone?: 'category' | 'free' }> = []

  const category = getEventDisplayCategory(event)
  if (category) pills.push({ key: 'category', label: category, tone: 'category' })
  pills.push({ key: 'age', label: getEventCardAgeLabel(event.ageRange) })

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
      {formatEventCardLocation(event)}
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

function EventCardLink({
  event,
  onClick,
  className,
  children,
}: {
  event: Event
  onClick?: () => void
  className: string
  children: ReactNode
}) {
  return (
    <Link
      to={eventDetailPath(event)}
      onClick={(event) => {
        if (!onClick) return
        event.preventDefault()
        onClick()
      }}
      className={className}
    >
      {children}
    </Link>
  )
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
      <EventCardLink
        event={event}
        onClick={onClick}
        className={cardClass(
          selected,
          hovered,
          ['card-listing--map-preview-sheet', discovery ? 'discovery-event-card' : ''].filter(Boolean).join(' '),
        )}
      >
        <div className="card-listing-media relative aspect-[16/10]">
          <EventImage event={event} className="card-listing-image" />
          <EventCardPills event={event} mode="free-only" />
        </div>
        <div
          className={
            discovery
              ? 'discovery-event-card-body card-listing-body--map-preview-sheet'
              : 'card-listing-body card-listing-body--map-preview-sheet'
          }
        >
          <p className={discovery ? 'discovery-event-datetime' : 'card-listing-datetime'}>{dateTime}</p>
          <h3 className={discovery ? 'discovery-event-title' : 'card-listing-title'}>{event.title}</h3>
          <EventCardLocation event={event} discovery={discovery} />
        </div>
      </EventCardLink>
    )
  }

  if (variant === 'map-grid') {
    return (
      <EventCardLink
        event={event}
        onClick={onClick}
        className={cardClass(
          selected,
          hovered,
          ['card-listing--map-grid', discovery ? 'discovery-event-card' : ''].filter(Boolean).join(' '),
        )}
      >
        <div className="card-listing-media relative aspect-square">
          <EventImage event={event} className="card-listing-image" />
          <EventCardPills event={event} />
        </div>
        <div className={discovery ? 'discovery-event-card-body' : 'card-listing-body'}>
          <p className={discovery ? 'discovery-event-datetime' : 'card-listing-datetime'}>{dateTime}</p>
          <h3 className={discovery ? 'discovery-event-title' : 'card-listing-title'}>{event.title}</h3>
          <EventCardLocation event={event} discovery={discovery} />
        </div>
      </EventCardLink>
    )
  }

  if (variant === 'compact-grid') {
    return (
      <EventCardLink
        event={event}
        onClick={onClick}
        className={cardClass(
          selected,
          hovered,
          ['discovery-event-card', 'discovery-event-card--compact-grid'].filter(Boolean).join(' '),
        )}
      >
        <div className="card-listing-media relative aspect-[5/4]">
          <EventImage event={event} className="card-listing-image" />
          <EventCardPills event={event} mode="compact-key" />
        </div>
        <div className="discovery-event-card-body discovery-event-card-body--compact-grid">
          <p className="discovery-event-datetime">{dateTime}</p>
          <h3 className="discovery-event-title">{event.title}</h3>
          <EventCardLocation event={event} discovery />
        </div>
      </EventCardLink>
    )
  }

  if (variant === 'grid') {
    return (
      <EventCardLink
        event={event}
        onClick={onClick}
        className={cardClass(selected, hovered, discovery ? 'discovery-event-card' : '')}
      >
        <div className="card-listing-media relative aspect-square">
          <EventImage event={event} className="card-listing-image" />
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
      </EventCardLink>
    )
  }

  return (
    <EventCardLink event={event} onClick={onClick} className={cardClass(selected, hovered)}>
      <div className="card-listing-media relative aspect-[20/19]">
        <EventImage event={event} className="card-listing-image" />
        <EventCardPills event={event} />
      </div>
      <div className="card-listing-body card-listing-body--list">
        <p className="card-listing-datetime">{dateTime}</p>
        <h3 className="card-listing-title card-listing-title--list">{event.title}</h3>
        <EventCardLocation event={event} />
      </div>
    </EventCardLink>
  )
}

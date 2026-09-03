import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { Event } from '../types/event'
import { isFreeCost } from '../types/event'
import { getEventCardAgeLabel } from '../utils/ageRange'
import { formatCostBadgeLabel } from '../utils/eventCost'
import { formatActivityTypeMetaLabel } from '../utils/activityTypeMeta'
import { formatCardDateTime } from '../utils/dates'
import { getEventDisplayCategory } from '../utils/eventImages'
import { formatEventCardLocation } from '../utils/maps'
import { eventDetailPath } from '../utils/eventPages'
import { getSeasonalEditorialBadgeForEvent } from '../utils/seasonalEditorialBadges'
import { EventEditorialBadge, type EditorialBadgeDisplay } from './EventEditorialBadge'
import { EventImage } from './EventImage'

interface EventCardProps {
  event: Event
  onClick?: () => void
  variant?: 'list' | 'grid' | 'compact-grid' | 'map-grid' | 'map-preview-sheet'
  selected?: boolean
  hovered?: boolean
  discovery?: boolean
  /**
   * Show Fall / Halloween / Holiday Pick when the event qualifies.
   * Default on for mixed feeds (browse map, nearby). Pass false on seasonal
   * Discovery collection / home band — those surfaces are already themed.
   */
  seasonalEditorial?: boolean
  /** Override seasonal editorial badge on the image. */
  editorialBadge?: EditorialBadgeDisplay | null
  /** Activity type in the card body (not on the image). Defaults to true when discovery. */
  showActivityTypeMeta?: boolean
}

function EventCardPills({
  event,
  mode = 'full',
}: {
  event: Event
  mode?: 'full' | 'free-only' | 'compact-key'
}) {
  if (mode === 'free-only') {
    if (!isFreeCost(event.cost)) return null

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
    if (isFreeCost(event.cost)) {
      pills.push({ key: 'cost', label: 'Free', tone: 'free' })
    } else {
      pills.push({ key: 'cost', label: formatCostBadgeLabel(event.cost) })
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

  const pills: Array<{ key: string; label: string; tone?: 'free' }> = []

  pills.push({ key: 'age', label: getEventCardAgeLabel(event.ageRange) })

  if (isFreeCost(event.cost)) {
    pills.push({ key: 'cost', label: 'Free', tone: 'free' })
  } else {
    pills.push({ key: 'cost', label: formatCostBadgeLabel(event.cost) })
  }

  return (
    <div className="event-card-pills" aria-hidden>
      {pills.map((pill) => (
        <span
          key={pill.key}
          className={[
            'event-card-pill',
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

function EventCardActivityType({
  event,
  discovery = false,
}: {
  event: Event
  discovery?: boolean
}) {
  const type = getEventDisplayCategory(event) ?? event.types[0]
  if (!type) return null

  return (
    <p className={discovery ? 'discovery-event-type' : 'card-listing-type'}>
      {formatActivityTypeMetaLabel(type)}
    </p>
  )
}

function EventCardMedia({
  event,
  pillMode = 'full',
  editorialBadge,
}: {
  event: Event
  pillMode?: 'full' | 'free-only' | 'compact-key'
  editorialBadge?: EditorialBadgeDisplay | null
}) {
  return (
    <>
      <EventImage event={event} className="card-listing-image" />
      {editorialBadge ? (
        <EventEditorialBadge label={editorialBadge.label} icon={editorialBadge.icon} />
      ) : null}
      <EventCardPills event={event} mode={pillMode} />
    </>
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

function EventCardDateTime({
  dateTime,
  discovery = false,
}: {
  dateTime: string
  discovery?: boolean
}) {
  return (
    <div className={discovery ? 'discovery-event-meta' : 'card-listing-meta'}>
      <p className={discovery ? 'discovery-event-datetime' : 'card-listing-datetime'}>{dateTime}</p>
    </div>
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
  seasonalEditorial = true,
  editorialBadge,
  showActivityTypeMeta,
}: EventCardProps) {
  const dateTime = formatCardDateTime(event.date, event.startTime)
  const resolvedEditorialBadge =
    editorialBadge !== undefined
      ? editorialBadge
      : seasonalEditorial
        ? getSeasonalEditorialBadgeForEvent(event)
        : null
  const showTypeMeta = showActivityTypeMeta ?? discovery

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
          <EventCardMedia
            event={event}
            pillMode="free-only"
            editorialBadge={resolvedEditorialBadge}
          />
        </div>
        <div
          className={
            discovery
              ? 'discovery-event-card-body card-listing-body--map-preview-sheet'
              : 'card-listing-body card-listing-body--map-preview-sheet'
          }
        >
          <EventCardDateTime dateTime={dateTime} discovery={discovery} />
          <h3 className={discovery ? 'discovery-event-title' : 'card-listing-title'}>{event.title}</h3>
          {showTypeMeta ? <EventCardActivityType event={event} discovery={discovery} /> : null}
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
          <EventCardMedia event={event} editorialBadge={resolvedEditorialBadge} />
        </div>
        <div className={discovery ? 'discovery-event-card-body' : 'card-listing-body'}>
          <EventCardDateTime dateTime={dateTime} discovery={discovery} />
          <h3 className={discovery ? 'discovery-event-title' : 'card-listing-title'}>{event.title}</h3>
          {showTypeMeta ? <EventCardActivityType event={event} discovery={discovery} /> : null}
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
          <EventCardMedia
            event={event}
            pillMode="compact-key"
            editorialBadge={resolvedEditorialBadge}
          />
        </div>
        <div className="discovery-event-card-body discovery-event-card-body--compact-grid">
          <EventCardDateTime dateTime={dateTime} discovery />
          <h3 className="discovery-event-title">{event.title}</h3>
          {showTypeMeta ? <EventCardActivityType event={event} discovery /> : null}
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
          <EventCardMedia event={event} editorialBadge={resolvedEditorialBadge} />
        </div>
        <div className={discovery ? 'discovery-event-card-body' : 'card-listing-body'}>
          <EventCardDateTime dateTime={dateTime} discovery={discovery} />
          <h3 className={discovery ? 'discovery-event-title' : 'card-listing-title'}>
            {event.title}
          </h3>
          {showTypeMeta ? <EventCardActivityType event={event} discovery={discovery} /> : null}
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
        <EventCardDateTime dateTime={dateTime} />
        <h3 className="card-listing-title card-listing-title--list">{event.title}</h3>
        <EventCardLocation event={event} />
      </div>
    </EventCardLink>
  )
}

import { Link } from 'react-router-dom'
import type { Event } from '../../types/event'
import { EventImage } from '../EventImage'
import {
  DiscoveryCardBody,
  discoveryCardBodyLayoutClass,
  type DiscoveryCardBodyLayout,
} from './DiscoveryCardBody'

export type { DiscoveryCardBodyLayout } from './DiscoveryCardBody'

import type { SeasonalBadgeIcon } from '../SeasonalBadgeIcon'
import { SeasonalBadgeIcon as SeasonalBadgeIconGlyph } from '../SeasonalBadgeIcon'

export type DiscoveryBadgeData = {
  kind: 'seasonal'
  label: string
  icon?: SeasonalBadgeIcon
}

/** @deprecated Seasonal labels are already short editorial picks. */
export function formatDiscoveryBadgeLabel(label: string): string {
  return label
}

/** Narrow cards — keep type pillar on one row */
export function formatDiscoveryTypePillarLabel(type: string): string {
  if (type === 'Festivals & Community') return 'Festival'
  return type
}

export interface DiscoveryV3CardData {
  title: string
  when: string
  location: string
  city: string
  type: string
  age: string
  cost: string
  imageUrl: string
  badge: DiscoveryBadgeData | null
}

interface DiscoveryV3CardProps extends DiscoveryV3CardData {
  href?: string
  event?: Event
  onClick?: () => void
  selected?: boolean
  hovered?: boolean
  compactPillars?: boolean
  bodyLayout?: DiscoveryCardBodyLayout
  /** Compact horizontal layout for mobile map preview sheet. */
  density?: 'default' | 'map-sheet'
}

export function DiscoveryBadge({
  badge,
}: {
  badge: DiscoveryBadgeData
}) {
  return (
    <span
      className={['lem-disc-badge', 'lem-disc-badge--seasonal', 'lem-disc-badge--v3'].join(' ')}
      aria-label={badge.label}
    >
      {badge.icon ? (
        <SeasonalBadgeIconGlyph icon={badge.icon} className="seasonal-badge__icon" />
      ) : null}
      {formatDiscoveryBadgeLabel(badge.label)}
    </span>
  )
}

function DiscoveryV3CardContent({
  title,
  when,
  location,
  city,
  type,
  age,
  cost,
  imageUrl,
  badge,
  event,
  compactPillars = false,
  bodyLayout = 'venue-line',
  density = 'default',
}: DiscoveryV3CardProps) {
  const isMapSheet = density === 'map-sheet'

  return (
    <>
      <div
        className={[
          'card-listing-media',
          'relative',
          isMapSheet ? 'discovery-v3-event-card__media--map-sheet' : 'aspect-square',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {event ? (
          <EventImage event={event} className="card-listing-image" />
        ) : (
          <img
            src={imageUrl}
            alt=""
            className="card-listing-image"
            loading="lazy"
            decoding="async"
          />
        )}
        {badge ? <DiscoveryBadge badge={badge} /> : null}
      </div>
      <DiscoveryCardBody
        when={when}
        title={title}
        location={location}
        city={city}
        type={type}
        age={age}
        cost={cost}
        layout={bodyLayout}
        compactPillars={compactPillars}
        bodyClassName={
          isMapSheet
            ? 'discovery-v3-event-card__body discovery-v3-event-card__body--map-sheet'
            : 'discovery-v3-event-card__body'
        }
      />
    </>
  )
}

export function DiscoveryV3Card(props: DiscoveryV3CardProps) {
  const {
    href,
    bodyLayout = 'venue-line',
    onClick,
    selected = false,
    hovered = false,
    density = 'default',
  } = props
  const cardClass = [
    'card-listing',
    'group',
    'discovery-event-card',
    'discovery-v3-event-card',
    density === 'map-sheet' ? 'discovery-v3-event-card--map-sheet card-listing--map-preview-sheet' : '',
    discoveryCardBodyLayoutClass(bodyLayout),
    selected ? 'card-listing--selected' : '',
    hovered ? 'card-listing--hovered' : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (href) {
    return (
      <Link
        to={href}
        className={cardClass}
        onClick={(clickEvent) => {
          if (!onClick) return
          clickEvent.preventDefault()
          onClick()
        }}
      >
        <DiscoveryV3CardContent {...props} />
      </Link>
    )
  }

  return (
    <article className={cardClass}>
      <DiscoveryV3CardContent {...props} />
    </article>
  )
}

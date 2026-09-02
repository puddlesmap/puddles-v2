import { Link } from 'react-router-dom'
import type { Event } from '../../types/event'
import { EventImage } from '../EventImage'
import { formatDiscoveryImagePrice } from './discoveryBrowseMockupData'
import { DiscoveryBadge, type DiscoveryV3CardData } from './DiscoveryV3Card'
import {
  DiscoveryCardBody,
  discoveryCardBodyLayoutClass,
  type DiscoveryCardBodyLayout,
} from './DiscoveryCardBody'
import '../../views/experiment-launch-expand-mockup.css'

type DiscoveryV2CardVariant = 'v2' | 'v2-2'

interface DiscoveryV2CardProps extends DiscoveryV3CardData {
  href?: string
  event?: Event
  variant?: DiscoveryV2CardVariant
  bodyLayout?: DiscoveryCardBodyLayout
}

function ImageKeyPills({
  age,
  cost,
  variant = 'v2',
}: Pick<DiscoveryV3CardData, 'age' | 'cost'> & { variant?: DiscoveryV2CardVariant }) {
  const priceLabel = formatDiscoveryImagePrice(cost)
  const pillClass = variant === 'v2-2' ? 'lem-disc-white-pill' : 'lem-disc-superhost-pill'

  return (
    <div className="lem-disc-card__key-pills" aria-hidden>
      <span className={pillClass}>{age}</span>
      <span className={pillClass}>{priceLabel}</span>
    </div>
  )
}

function DiscoveryV2CardContent({
  title,
  when,
  location,
  city,
  age,
  cost,
  imageUrl,
  badge,
  event,
  variant = 'v2-2',
  bodyLayout = 'venue-line',
}: DiscoveryV2CardProps) {
  const isV22 = variant === 'v2-2'
  const mediaBarClass = [
    'lem-disc-card__media-bar',
    isV22 ? 'lem-disc-card__media-bar--v2-2' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <div className="card-listing-media relative aspect-square">
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
        <div className={mediaBarClass}>
          {isV22 ? (
            <>
              <ImageKeyPills age={age} cost={cost} variant="v2-2" />
              {badge ? <DiscoveryBadge badge={badge} /> : null}
            </>
          ) : (
            <>
              {badge ? (
                <DiscoveryBadge badge={badge} />
              ) : (
                <span className="lem-disc-card__media-bar-spacer" aria-hidden />
              )}
              <ImageKeyPills age={age} cost={cost} variant="v2" />
            </>
          )}
        </div>
      </div>
      <DiscoveryCardBody
        when={when}
        title={title}
        location={location}
        city={city}
        age={age}
        cost={cost}
        layout={bodyLayout}
        showPillars={false}
        bodyClassName="discovery-v2-event-card__body"
      />
    </>
  )
}

export function DiscoveryV2Card(props: DiscoveryV2CardProps) {
  const { href, variant = 'v2-2', bodyLayout = 'venue-line' } = props
  const cardClass = [
    'card-listing',
    'group',
    'discovery-event-card',
    'discovery-v2-event-card',
    variant === 'v2-2' ? 'discovery-v2-2-event-card' : '',
    discoveryCardBodyLayoutClass(bodyLayout),
  ]
    .filter(Boolean)
    .join(' ')

  if (href) {
    return (
      <Link to={href} className={cardClass}>
        <DiscoveryV2CardContent {...props} variant={variant} />
      </Link>
    )
  }

  return (
    <article className={cardClass}>
      <DiscoveryV2CardContent {...props} variant={variant} />
    </article>
  )
}

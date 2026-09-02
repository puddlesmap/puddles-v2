import {
  formatDiscoveryTypePillarLabel,
  type DiscoveryV3CardData,
} from './DiscoveryV3Card'

export type DiscoveryCardBodyLayout =
  | 'venue-line'
  | 'city-inline'
  | 'city-pill'
  | 'city-plain'
  | 'city-soft'

interface MetaRowProps extends Pick<DiscoveryV3CardData, 'age' | 'cost' | 'type'> {
  city?: string
  compact?: boolean
  cityMode?: 'outline' | 'soft' | 'none'
}

function MetaCityPinIcon() {
  return (
    <svg
      className="lem-disc-meta-pill__pin"
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

function MetaPlainTextRow({ age, cost, type, city, compact = false }: MetaRowProps) {
  const typeLabel = compact ? formatDiscoveryTypePillarLabel(type) : type

  return (
    <p className="lem-disc-meta-plain" aria-hidden>
      {city ? <span className="lem-disc-meta-plain__city">{city}</span> : null}
      {city ? <span className="lem-disc-meta-plain__sep">·</span> : null}
      <span className="lem-disc-meta-plain__item">{age}</span>
      <span className="lem-disc-meta-plain__sep">·</span>
      <span className="lem-disc-meta-plain__item">{cost}</span>
      <span className="lem-disc-meta-plain__sep">·</span>
      <span className="lem-disc-meta-plain__item">{typeLabel}</span>
    </p>
  )
}

function MetaStyledPillars({
  age,
  cost,
  type,
  city,
  compact = false,
  cityMode = 'none',
}: MetaRowProps) {
  const priceTone = cost === 'Free' ? 'free' : cost === 'Low-cost' ? 'low' : 'paid'
  const typeLabel = compact ? formatDiscoveryTypePillarLabel(type) : type

  return (
    <div
      className={[
        'lem-disc-meta-pillars',
        compact ? 'lem-disc-meta-pillars--compact' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    >
      {cityMode !== 'none' && city ? (
        <span
          className={[
            'lem-disc-meta-pill',
            'lem-disc-meta-pill--city',
            cityMode === 'soft' ? 'lem-disc-meta-pill--city-soft' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {cityMode === 'soft' ? <MetaCityPinIcon /> : null}
          {city}
        </span>
      ) : null}
      <span className="lem-disc-meta-pill lem-disc-meta-pill--age">{age}</span>
      <span
        className={[
          'lem-disc-meta-pill',
          'lem-disc-meta-pill--price',
          `lem-disc-meta-pill--price-${priceTone}`,
        ].join(' ')}
      >
        {cost}
      </span>
      <span className="lem-disc-meta-pill lem-disc-meta-pill--type">{typeLabel}</span>
    </div>
  )
}

interface DiscoveryCardBodyProps extends Pick<
  DiscoveryV3CardData,
  'when' | 'title' | 'location' | 'age' | 'cost'
> {
  city: string
  type?: string
  layout?: DiscoveryCardBodyLayout
  compactPillars?: boolean
  showPillars?: boolean
  bodyClassName?: string
}

export function DiscoveryCardBody({
  when,
  title,
  location,
  city,
  age,
  cost,
  type,
  layout = 'venue-line',
  compactPillars = false,
  showPillars = true,
  bodyClassName,
}: DiscoveryCardBodyProps) {
  const isCompactLayout =
    layout === 'city-pill' ||
    layout === 'city-soft' ||
    layout === 'city-plain' ||
    layout === 'city-inline'
  const bodyClass = [
    'discovery-event-card-body',
    bodyClassName,
    isCompactLayout ? 'discovery-card-body--compact' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={bodyClass}>
      <div className="discovery-event-meta">
        <p className="discovery-event-datetime">
          {when}
          {layout === 'city-inline' && city ? (
            <>
              <span className="discovery-event-datetime__sep" aria-hidden>
                {' '}
                ·{' '}
              </span>
              <span className="discovery-event-datetime__city">{city.toUpperCase()}</span>
            </>
          ) : null}
        </p>
      </div>
      <h3 className="discovery-event-title">{title}</h3>
      {layout === 'venue-line' && location ? (
        <p className="discovery-event-location">{location}</p>
      ) : null}
      {showPillars && type ? (
        layout === 'city-plain' ? (
          <MetaPlainTextRow
            age={age}
            cost={cost}
            type={type}
            city={city}
            compact={compactPillars}
          />
        ) : (
          <MetaStyledPillars
            age={age}
            cost={cost}
            type={type}
            city={city}
            compact={compactPillars}
            cityMode={
              layout === 'city-pill' ? 'outline' : layout === 'city-soft' ? 'soft' : 'none'
            }
          />
        )
      ) : null}
    </div>
  )
}

export function discoveryCardBodyLayoutClass(layout: DiscoveryCardBodyLayout): string {
  return `discovery-card-body-layout--${layout}`
}

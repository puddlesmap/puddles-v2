import type { GuideMapCategory, GuidePlace } from '../../data/halloweenGuide'
import { SaveHeartButton } from '../saved/SaveHeartButton'

function eventIdFromHref(href?: string): string | null {
  if (!href) return null
  const match = href.match(/\/event\/([^/?#]+)/)
  return match?.[1] ?? null
}

export type GuideMapPlaceCardCategory = {
  label: string
  imageSrc?: string
}

export function GuideMapPlaceCard({
  place,
  category,
  selected = false,
  density = 'sheet',
  onSelect,
  onSeeDetails,
}: {
  place: GuidePlace
  category?: GuideMapPlaceCardCategory | GuideMapCategory | null
  selected?: boolean
  density?: 'sheet' | 'list'
  onSelect?: () => void
  onSeeDetails: (slug: string) => void
}) {
  const eventId = eventIdFromHref(place.eventHref)
  const meta = [place.date, place.city].filter(Boolean).join(' · ')
  const categoryLabel = category && 'label' in category ? category.label : null
  const categoryIcon =
    category && 'imageSrc' in category ? (category as GuideMapPlaceCardCategory).imageSrc : undefined

  return (
    <article
      className={`gdm-map-g-card gdm-map-g-card--${density}${selected ? ' is-selected' : ''}`}
      aria-label={place.name}
      aria-current={selected ? 'true' : undefined}
    >
      {density === 'list' && onSelect ? (
        <button type="button" className="gdm-map-g-card__select" onClick={onSelect} aria-label={`Select ${place.name}`}>
          Select
        </button>
      ) : null}
      <div className="gdm-map-g-card__body">
        <div className="gdm-map-g-card__top">
          <div className="gdm-map-g-card__category">
            {categoryIcon ? (
              <img
                className="gdm-map-g-card__category-icon"
                src={categoryIcon}
                alt=""
                decoding="async"
              />
            ) : null}
            {categoryLabel ? (
              <span className="gdm-map-g-card__category-label">{categoryLabel}</span>
            ) : null}
          </div>
          {eventId ? (
            <SaveHeartButton eventId={eventId} variant="map-sheet" saveSurface="guide_map" />
          ) : null}
        </div>
        <h3 className="gdm-map-g-card__title">{place.name}</h3>
        {meta ? <p className="gdm-map-g-card__meta">{meta}</p> : null}
        {place.summary ? <p className="gdm-map-g-card__summary">{place.summary}</p> : null}
        {density === 'list' && place.tip ? (
          <p className="gdm-map-g-card__tip">{place.tip}</p>
        ) : null}
        <button
          type="button"
          className="gdm-map-g-card__cta"
          onClick={() => onSeeDetails(place.slug)}
        >
          See details →
        </button>
      </div>
    </article>
  )
}

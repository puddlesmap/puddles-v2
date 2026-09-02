import { Link } from 'react-router-dom'
import { ACTIVITY_TYPES, type ActivityType } from '../../types/event'
import { EVENT_FALLBACK_IMAGES } from '../../utils/eventImages'

const PREVIEW_TYPES: ActivityType[] = ACTIVITY_TYPES.filter((type) => type !== 'Other')

function browseActivityHref(type: ActivityType): string {
  return `/browse?activity=${encodeURIComponent(type)}`
}

export function SeasonalBrowseCategoriesPreview() {
  return (
    <section className="seasonal-browse-preview" aria-labelledby="seasonal-browse-preview-heading">
      <div className="seasonal-browse-preview__head">
        <h2 id="seasonal-browse-preview-heading" className="seasonal-browse-preview__title">
          Browse by activity
        </h2>
        <p className="seasonal-browse-preview__lede">
          Filter the full catalog when you know what you&apos;re in the mood for.
        </p>
      </div>

      <div className="seasonal-browse-preview__track">
        {PREVIEW_TYPES.map((type) => (
          <Link
            key={type}
            to={browseActivityHref(type)}
            className="seasonal-browse-preview__chip"
          >
            <span className="seasonal-browse-preview__chip-icon-wrap" aria-hidden>
              <img
                src={EVENT_FALLBACK_IMAGES[type]}
                alt=""
                className="seasonal-browse-preview__chip-icon"
                loading="lazy"
                decoding="async"
              />
            </span>
            <span className="seasonal-browse-preview__chip-label">{type}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

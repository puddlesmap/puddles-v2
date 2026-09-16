import { Link } from 'react-router-dom'
import { isNewActivityTypeFilter, publicActivityTypeFilterOrder } from '../../config/activityTypeLaunch'
import type { ActivityType } from '../../types/event'
import { trackActivityTypeSelected } from '../../utils/analytics'
import { EVENT_FALLBACK_IMAGES } from '../../utils/eventImages'

const PREVIEW_TYPES: ActivityType[] = publicActivityTypeFilterOrder()

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
      </div>

      <div className="seasonal-browse-preview__scroller">
        <div className="seasonal-browse-preview__track">
          {PREVIEW_TYPES.map((type) => {
            const showNew = isNewActivityTypeFilter(type)
            return (
              <Link
                key={type}
                to={browseActivityHref(type)}
                className={[
                  'seasonal-browse-preview__chip',
                  showNew ? 'seasonal-browse-preview__chip--new' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => trackActivityTypeSelected(type)}
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
                <span className="seasonal-browse-preview__chip-caption">
                  <span className="seasonal-browse-preview__chip-label">{type}</span>
                  {showNew ? (
                    <span className="seasonal-browse-preview__chip-new" aria-label="New activity type">
                      NEW
                    </span>
                  ) : null}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

import { BeforeYouGoTipItems } from '../event-detail/BeforeYouGoIcon'
import {
  getSeasonalCollection,
  resolveSeasonalEvents,
  type SeasonalCollectionSlug,
} from '../../data/seasonalDiscovery'
import { formatEventDate, formatEventTimeRange } from '../../utils/dates'
import { parseEventTips } from '../../utils/eventTips'
import { sortSeasonalDiscoveryEvents } from '../../utils/formatSeasonalSchedule'

function CollectionEventList({
  heading,
  eventIds,
}: {
  heading: string
  eventIds: string[]
}) {
  const events = sortSeasonalDiscoveryEvents(resolveSeasonalEvents(eventIds))

  return (
    <section className="admin-seasonal-review__band" aria-label={heading}>
      <h4 className="admin-seasonal-review__band-title">{heading}</h4>
      {events.length === 0 ? (
        <p className="admin-seasonal-review__empty">No events in this list.</p>
      ) : (
        <ul className="admin-seasonal-review__list">
          {events.map((event) => {
            const tips = parseEventTips(event.tips)
            const official = event.eventUrl && event.eventUrl !== '#' ? event.eventUrl : null
            return (
              <li key={event.id} className="admin-seasonal-review__card">
                <h5 className="admin-seasonal-review__title">{event.title}</h5>
                <dl className="admin-seasonal-review__facts">
                  <div>
                    <dt>When</dt>
                    <dd>
                      {formatEventDate(event.openingDate || event.date)}
                      {event.closingDate && event.closingDate !== (event.openingDate || event.date)
                        ? ` – ${formatEventDate(event.closingDate)}`
                        : ''}
                      {' · '}
                      {formatEventTimeRange(event.startTime, event.endTime)}
                    </dd>
                  </div>
                  <div>
                    <dt>Where</dt>
                    <dd>
                      {event.venue}
                      {event.city ? ` · ${event.city}` : ''}
                    </dd>
                  </div>
                  <div>
                    <dt>Cost</dt>
                    <dd>{event.cost || '—'}</dd>
                  </div>
                  <div>
                    <dt>Ages</dt>
                    <dd>{event.ageRange || '—'}</dd>
                  </div>
                </dl>
                {event.description ? (
                  <p className="admin-seasonal-review__description">{event.description}</p>
                ) : null}
                <div className="admin-seasonal-review__tips">
                  <span>Before you go</span>
                  {tips.length > 0 ? (
                    <ul className="event-detail-tips-list">
                      <BeforeYouGoTipItems items={tips} />
                    </ul>
                  ) : (
                    <p>No verified preparation guidance yet.</p>
                  )}
                </div>
                {official ? (
                  <a href={official} target="_blank" rel="noreferrer" className="admin-btn admin-btn-text">
                    Official page ↗
                  </a>
                ) : (
                  <p className="admin-seasonal-review__empty">No official page on file.</p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export function AdminSeasonalCollectionReview({ slug }: { slug: SeasonalCollectionSlug }) {
  const collection = getSeasonalCollection(slug)
  if (!collection) return null

  const driveIds = new Set(collection.driveEventIds ?? [])
  const closeIds = collection.collectionEventIds.filter((id) => !driveIds.has(id))

  return (
    <section className="admin-seasonal-review" aria-labelledby={`seasonal-review-${slug}`}>
      <h3 id={`seasonal-review-${slug}`} className="admin-seasonal-review__heading">
        {collection.subtitle}
      </h3>
      <p className="admin-seasonal-review__lede">
        Every event on this collection, including worth-a-drive rows and dates that have passed.
      </p>
      <CollectionEventList heading={collection.closeToHome?.title ?? 'Close to home'} eventIds={closeIds} />
      {collection.driveEventIds?.length ? (
        <CollectionEventList
          heading={collection.worthADrive?.title ?? 'Worth a little drive'}
          eventIds={collection.driveEventIds}
        />
      ) : null}
    </section>
  )
}

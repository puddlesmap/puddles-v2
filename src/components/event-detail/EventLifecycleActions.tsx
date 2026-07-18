import { Link } from 'react-router-dom'
import type { Event } from '../../types/event'
import type { EventLifecycleStatus } from '../../utils/eventLifecycle'
import { isOfficialEventUrl } from '../../utils/eventPages'
import {
  resolveLifecycleBrowseAllHref,
  resolveLifecycleNearbyHref,
  resolveLifecycleNextEventHref,
  type LifecycleLinkTarget,
} from '../../utils/eventLifecycleBrowse'
import { getAllCatalogEventsForLifecycle } from '../../utils/eventLifecycle'

interface EventLifecycleActionsProps {
  event: Event
  status: EventLifecycleStatus
  now: Date
  linkTarget?: LifecycleLinkTarget
}

export function EventLifecycleActions({
  event,
  status,
  now,
  linkTarget = 'production',
}: EventLifecycleActionsProps) {
  if (status === 'upcoming') return null

  const nearbyHref = resolveLifecycleNearbyHref(event, linkTarget)
  const browseAllHref = resolveLifecycleBrowseAllHref(event)
  const nextPath = resolveLifecycleNextEventHref(
    event,
    getAllCatalogEventsForLifecycle(),
    now,
    linkTarget,
  )
  const hasOfficialPage = isOfficialEventUrl(event.eventUrl)

  return (
    <div className="event-lifecycle-actions shrink-0 border-t border-border bg-white px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="event-lifecycle-actions__ctas">
        {nextPath ? (
          <Link to={nextPath} className="btn-primary">
            View the next date
          </Link>
        ) : (
          <Link to={nearbyHref} className="btn-primary">
            See what&apos;s coming up nearby
          </Link>
        )}

        <Link to={browseAllHref} className="btn-secondary">
          Browse all activities
        </Link>
      </div>

      {hasOfficialPage ? (
        <div className="event-lifecycle-actions__official">
          <a href={event.eventUrl} target="_blank" rel="noreferrer" className="event-lifecycle-actions__official-link">
            View original activity page
          </a>
          <p className="event-lifecycle-actions__official-note">
            The original activity page may no longer be available.
          </p>
        </div>
      ) : null}
    </div>
  )
}

import { Link } from 'react-router-dom'
import type { Event } from '../../types/event'
import type { EventLifecycleStatus } from '../../utils/eventLifecycle'
import {
  formatLifecycleCancelledPhrase,
  formatLifecycleEndedPhrase,
} from '../../utils/eventLifecycle'
import {
  buildLifecycleBrowseHref,
  lifecycleBrowseContextFromEvent,
} from '../../utils/eventLifecycleBrowse'

interface EventLifecycleBannerProps {
  event: Event
  status: EventLifecycleStatus
}

export function EventLifecycleBanner({ event, status }: EventLifecycleBannerProps) {
  if (status === 'upcoming') return null

  const isCancelled = status === 'cancelled'
  const title = isCancelled ? 'This activity was cancelled.' : 'This activity has ended.'
  const schedule = isCancelled
    ? formatLifecycleCancelledPhrase(event)
    : formatLifecycleEndedPhrase(event)
  const ctaLabel = isCancelled
    ? 'See what else is coming up nearby'
    : 'See what\u2019s coming up nearby'
  const ctaHref = buildLifecycleBrowseHref(lifecycleBrowseContextFromEvent(event))

  return (
    <section className="event-lifecycle-banner" aria-labelledby="event-lifecycle-banner-title">
      <div id="event-lifecycle-banner-title" className="event-lifecycle-banner__header event-modal-trust-header">
        <span className="event-modal-trust-header-label event-lifecycle-banner__label">{title}</span>
        <span className="event-modal-trust-timestamp event-lifecycle-banner__schedule">{schedule}</span>
      </div>
      <Link to={ctaHref} className="event-lifecycle-banner__cta">
        {ctaLabel} <span aria-hidden="true">{'\u2192'}</span>
      </Link>
    </section>
  )
}

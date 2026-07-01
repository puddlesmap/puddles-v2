import { Link } from 'react-router-dom'
import { EmptyStatePin } from './EmptyStatePin'

export function EventUnavailableState({
  hasInAppReturn = false,
  onClose,
}: {
  hasInAppReturn?: boolean
  onClose?: () => void
}) {
  return (
    <div className="empty-state empty-state-quiet event-unavailable-state">
      <EmptyStatePin />
      <h1 className="empty-state-title text-[17px]">This activity isn&apos;t available right now</h1>
      <p className="empty-state-body mt-2">
        It may have ended, been removed, or isn&apos;t listed on Puddles yet. Try browsing nearby
        activities instead.
      </p>
      <div className="event-unavailable-actions">
        {hasInAppReturn && onClose ? (
          <button type="button" onClick={onClose} className="btn-primary">
            Go back
          </button>
        ) : (
          <Link to="/browse" className="btn-primary">
            Browse more events
          </Link>
        )}
        {!hasInAppReturn ? (
          <Link to="/map" className="btn-secondary">
            View map
          </Link>
        ) : null}
      </div>
    </div>
  )
}

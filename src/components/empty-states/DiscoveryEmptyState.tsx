import { EmptyStatePin } from './EmptyStatePin'

export function DiscoveryEmptyState({
  variant = 'default',
  onRetryLocation,
}: {
  variant?: 'default' | 'nearby-denied' | 'refined-home'
  onRetryLocation?: () => void
}) {
  if (variant === 'nearby-denied') {
    return (
      <div className="empty-state empty-state-quiet">
        <p className="empty-state-title text-[17px]">Turn on location to see what&apos;s nearby</p>
        <p className="empty-state-body mt-2">
          Pick a city below, or allow location access to find activities within 5 miles of you.
        </p>
        {onRetryLocation ? (
          <button type="button" className="btn-secondary mt-4" onClick={onRetryLocation}>
            Try again
          </button>
        ) : null}
      </div>
    )
  }

  if (variant === 'refined-home') {
    return (
      <div className="empty-state empty-state-quiet empty-state-refined-home">
        <EmptyStatePin />
        <p className="empty-state-title text-[17px]">We&apos;re still gathering puddles here</p>
        <p className="empty-state-body mt-2">
          Try another nearby city, another day, or check back soon.
        </p>
      </div>
    )
  }

  return (
    <div className="empty-state empty-state-quiet">
      <EmptyStatePin />
      <p className="empty-state-title text-[17px]">We&apos;re still gathering puddles here</p>
      <p className="empty-state-body mt-2">Try another day, a nearby city, or check back soon.</p>
    </div>
  )
}

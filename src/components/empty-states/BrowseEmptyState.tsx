import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { BrowseFilters } from '../../utils/filters'
import {
  getBrowseEmptyStateTimeLabel,
  getResetBrowseFilters,
  resolveBrowseEmptyStateCase,
} from '../../utils/filters'
import { NEARBY_RADIUS_MILES } from '../../utils/geo'
import { EmptyStatePin } from './EmptyStatePin'

interface BrowseEmptyStateProps {
  filters: BrowseFilters
  onResetFilters: (filters: BrowseFilters) => void
  onTryAllCities: () => void
  onSeeUpcomingEvents: () => void
}

export function BrowseEmptyState({
  filters,
  onResetFilters,
  onTryAllCities,
  onSeeUpcomingEvents,
}: BrowseEmptyStateProps) {
  const emptyCase = resolveBrowseEmptyStateCase(filters)
  const timeLabel = getBrowseEmptyStateTimeLabel(filters)
  const cityName =
    filters.city === 'all' ? '' : filters.city === 'nearby' ? 'nearby' : filters.city

  if (emptyCase === 'no-database') {
    return (
      <QuietEmptyStateShell
        primary="Puddles is just getting started"
        body="We're adding storytimes, music circles, drop-ins, and small nearby moments for families."
        actions={
          <Link to="/share" className="btn-secondary w-full sm:w-auto">
            Share with us
          </Link>
        }
      />
    )
  }

  if (emptyCase === 'filters-active') {
    return (
      <QuietEmptyStateShell
        primary="No puddles found here yet"
        body="See what's coming up next, or reset your filters to browse everything."
        actions={
          <BrowseRecoveryActions
            onSeeUpcomingEvents={onSeeUpcomingEvents}
            onResetFilters={() => onResetFilters(getResetBrowseFilters(filters))}
          />
        }
      />
    )
  }

  if (emptyCase === 'city') {
    const primary =
      filters.city === 'nearby'
        ? `Nothing within ${NEARBY_RADIUS_MILES} mi yet`
        : `Nothing in ${cityName} yet`

    return (
      <QuietEmptyStateShell
        primary={primary}
        body={
          filters.city === 'nearby'
            ? "We're still gathering puddles nearby. Try all cities or see what's coming up next."
            : "We're still gathering puddles here. Try all cities or see what's coming up next."
        }
        actions={
          <>
            <button type="button" onClick={onTryAllCities} className="btn-primary w-full sm:w-auto">
              Try all cities
            </button>
            <button
              type="button"
              onClick={onSeeUpcomingEvents}
              className="btn-secondary w-full sm:w-auto"
            >
              See upcoming events
            </button>
            <Link to="/share" className="btn-secondary w-full sm:w-auto">
              Share with us
            </Link>
          </>
        }
      />
    )
  }

  if (emptyCase === 'time-window') {
    return (
      <QuietEmptyStateShell
        primary={`Nothing for ${timeLabel} yet`}
        body="See what's coming up next, or reset your filters to browse everything."
        actions={
          <BrowseRecoveryActions
            onSeeUpcomingEvents={onSeeUpcomingEvents}
            onResetFilters={() => onResetFilters(getResetBrowseFilters(filters))}
          />
        }
      />
    )
  }

  return (
    <QuietEmptyStateShell
      showPin
      primary="We're still gathering puddles here"
      body="See what's coming up next, or reset your filters to browse everything."
      actions={
        <BrowseRecoveryActions
          onSeeUpcomingEvents={onSeeUpcomingEvents}
          onResetFilters={() => onResetFilters(getResetBrowseFilters(filters))}
        />
      }
    />
  )
}

function BrowseRecoveryActions({
  onSeeUpcomingEvents,
  onResetFilters,
}: {
  onSeeUpcomingEvents: () => void
  onResetFilters: () => void
}) {
  return (
    <>
      <button type="button" onClick={onSeeUpcomingEvents} className="btn-primary w-full sm:w-auto">
        See upcoming events
      </button>
      <button type="button" onClick={onResetFilters} className="btn-secondary w-full sm:w-auto">
        Reset filters
      </button>
      <Link to="/share" className="btn-secondary w-full sm:w-auto">
        Share with us
      </Link>
    </>
  )
}

function QuietEmptyStateShell({
  primary,
  body,
  actions,
  showPin = false,
}: {
  primary: string
  body: string
  actions: ReactNode
  showPin?: boolean
}) {
  return (
    <div className="empty-state empty-state-quiet">
      {showPin ? <EmptyStatePin /> : null}
      <p className="empty-state-title text-[17px]">{primary}</p>
      <p className="empty-state-body mt-2">{body}</p>
      <div className="empty-state-actions">{actions}</div>
    </div>
  )
}

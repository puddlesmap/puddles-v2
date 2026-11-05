'use client'

import { Link } from 'react-router-dom'
import { ExperimentSeasonalCollectionPage } from './ExperimentSeasonalCollectionPage'

/** Thin alias — live `/seasonal/holiday-magic` already enables typeahead filters. */
export function ExperimentHolidayMagicFiltersPage() {
  return (
    <div className="experiment-holiday-magic-filters">
      <p style={{ margin: '0.75rem 1rem 0', maxWidth: '52rem' }}>
        Alias of live Holiday Magic filters.{' '}
        <Link to="/seasonal/holiday-magic">Open live page</Link>
        {' · '}
        <Link to="/browse">Browse</Link>
      </p>
      <ExperimentSeasonalCollectionPage slug="holiday-magic" typeaheadFilters />
    </div>
  )
}

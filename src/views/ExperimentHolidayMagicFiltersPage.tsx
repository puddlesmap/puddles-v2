'use client'

import { Link } from 'react-router-dom'
import { ExperimentSeasonalCollectionPage } from './ExperimentSeasonalCollectionPage'

/**
 * Mockup: Holiday Magic hub with an “Explore the events” section title
 * (same hierarchy as “Explore the guides”) plus Browse-style Where / Day / Time filters.
 */
export function ExperimentHolidayMagicFiltersPage() {
  return (
    <div className="experiment-holiday-magic-filters">
      <p style={{ margin: '0.75rem 1rem 0', maxWidth: '52rem' }}>
        Mockup · section title + Browse location / date / time filters.{' '}
        <Link to="/seasonal/holiday-magic#events">Open live page</Link>
        {' · '}
        <Link to="/browse">Browse</Link>
      </p>
      <ExperimentSeasonalCollectionPage
        slug="holiday-magic"
        typeaheadFilters
        skin="lighten"
        eventsHeading="Explore the events"
      />
    </div>
  )
}

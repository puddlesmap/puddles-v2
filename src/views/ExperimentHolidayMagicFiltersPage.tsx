'use client'

import { Link } from 'react-router-dom'
import { ExperimentSeasonalCollectionPage } from './ExperimentSeasonalCollectionPage'
import './experiment-where-when-home-browse.css'

/** Holiday Magic collection + Browse-style city/ZIP typeahead and pick-a-date. */
export function ExperimentHolidayMagicFiltersPage() {
  return (
    <div className="experiment-holiday-magic-filters">
      <p className="wwhb-note" style={{ margin: '0.75rem 1rem 0', maxWidth: '52rem' }}>
        Mockup — Holiday Magic with typeahead filters (city/ZIP → ~8 mi + pick-a-date).{' '}
        <Link to="/experiment/seasonal-discovery/holiday-magic">Holiday without filters</Link>
        {' · '}
        <Link to="/browse">Live Browse</Link>
        {' · '}
        <Link to="/experiment/browse-typeahead-filters">Browse typeahead</Link>
      </p>
      <ExperimentSeasonalCollectionPage slug="holiday-magic" typeaheadFilters />
    </div>
  )
}

'use client'

import { Link } from 'react-router-dom'
import { ExperimentSeasonalCollectionPage } from './ExperimentSeasonalCollectionPage'

/** Prior reverse skin — live hub now ships lighten. */
export function ExperimentHolidayMagicLightenPage() {
  return (
    <div className="experiment-holiday-magic-lighten">
      <p style={{ margin: '0.75rem 1rem 0', maxWidth: '52rem' }}>
        Prior reverse skin (not live).{' '}
        <Link to="/seasonal/holiday-magic">Open live lighten</Link>
        {' · '}
        <Link to="/guides">Guides</Link>
      </p>
      <ExperimentSeasonalCollectionPage slug="holiday-magic" skin="reverse" />
    </div>
  )
}

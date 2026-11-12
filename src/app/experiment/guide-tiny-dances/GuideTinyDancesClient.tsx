'use client'

import { MemoryRouter } from 'react-router-dom'
import { ExperimentGuideTinyDancesPage } from '@/views/ExperimentGuideTinyDancesPage'

export function GuideTinyDancesClient() {
  return (
    <MemoryRouter>
      <ExperimentGuideTinyDancesPage />
    </MemoryRouter>
  )
}

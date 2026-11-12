'use client'

import { MemoryRouter } from 'react-router-dom'
import { ExperimentGuidesHomeMockupsPage } from '@/views/ExperimentGuidesHomeMockupsPage'

export function GuidesHomeMockupsClient() {
  return (
    <MemoryRouter>
      <ExperimentGuidesHomeMockupsPage />
    </MemoryRouter>
  )
}

'use client'

import { MemoryRouter } from 'react-router-dom'
import { ExperimentHolidayGuidePalettesPage } from '@/views/ExperimentHolidayGuidePalettesPage'

export function HolidayGuidePalettesClient() {
  return (
    <MemoryRouter>
      <ExperimentHolidayGuidePalettesPage />
    </MemoryRouter>
  )
}

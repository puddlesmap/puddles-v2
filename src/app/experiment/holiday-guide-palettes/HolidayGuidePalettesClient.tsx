'use client'

import dynamic from 'next/dynamic'
import { MemoryRouter } from 'react-router-dom'

const ExperimentHolidayGuidePalettesPage = dynamic(
  () =>
    import('@/views/ExperimentHolidayGuidePalettesPage').then(
      (mod) => mod.ExperimentHolidayGuidePalettesPage,
    ),
  { ssr: false },
)

export function HolidayGuidePalettesClient() {
  return (
    <MemoryRouter>
      <ExperimentHolidayGuidePalettesPage />
    </MemoryRouter>
  )
}

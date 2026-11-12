'use client'

import dynamic from 'next/dynamic'
import { MemoryRouter } from 'react-router-dom'

const ExperimentGuideTinyDancesPage = dynamic(
  () =>
    import('@/views/ExperimentGuideTinyDancesPage').then(
      (mod) => mod.ExperimentGuideTinyDancesPage,
    ),
  { ssr: false },
)

export function GuideTinyDancesClient() {
  return (
    <MemoryRouter>
      <ExperimentGuideTinyDancesPage />
    </MemoryRouter>
  )
}

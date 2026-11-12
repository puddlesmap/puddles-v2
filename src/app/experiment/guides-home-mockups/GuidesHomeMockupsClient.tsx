'use client'

import dynamic from 'next/dynamic'
import { MemoryRouter } from 'react-router-dom'

const ExperimentGuidesHomeMockupsPage = dynamic(
  () =>
    import('@/views/ExperimentGuidesHomeMockupsPage').then(
      (mod) => mod.ExperimentGuidesHomeMockupsPage,
    ),
  { ssr: false },
)

export function GuidesHomeMockupsClient() {
  return (
    <MemoryRouter>
      <ExperimentGuidesHomeMockupsPage />
    </MemoryRouter>
  )
}

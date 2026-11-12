'use client'

import dynamic from 'next/dynamic'
import { MemoryRouter } from 'react-router-dom'

const ExperimentSeasonalGuidesCarouselPage = dynamic(
  () =>
    import('@/views/ExperimentSeasonalGuidesCarouselPage').then(
      (mod) => mod.ExperimentSeasonalGuidesCarouselPage,
    ),
  { ssr: false },
)

export function SeasonalGuidesCarouselClient() {
  return (
    <MemoryRouter
      initialEntries={['/experiment/seasonal-guides-carousel?surface=lime-grid']}
    >
      <ExperimentSeasonalGuidesCarouselPage />
    </MemoryRouter>
  )
}

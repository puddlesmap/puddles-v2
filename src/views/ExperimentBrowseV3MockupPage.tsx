import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { DiscoveryV3Card } from '../components/experiment/DiscoveryV3Card'
import { ExperimentBrowseDiscoveryMockupShell } from '../components/experiment/ExperimentBrowseDiscoveryMockupShell'
import {
  eventToDiscoveryCard,
  getDiscoveryBrowseMockupFeed,
} from '../components/experiment/discoveryBrowseMockupData'
import { formatDocumentTitle, setPageTitle } from '../utils/siteMeta'

export function ExperimentBrowseV3MockupPage() {
  const location = useLocation()
  const { newDiscoveryEvents, seasonalEvents, feedEvents, badgeCounts } = useMemo(
    () => getDiscoveryBrowseMockupFeed(),
    [],
  )

  useEffect(() => {
    setPageTitle(formatDocumentTitle('Browse · Version 3 · User Test'), location.pathname)
  }, [location.pathname])

  return (
    <ExperimentBrowseDiscoveryMockupShell
      version={3}
      title="Version 3 · Option 2 city"
      lede="Discovery badge on the image for seasonal picks only; soft city chip with pin + age · price · type in metadata. NEW on activity-type filters for Festival and Parent & Me."
      eventCount={feedEvents.length}
      badgeCounts={badgeCounts}
      Card={DiscoveryV3Card}
      newDiscoveryEvents={newDiscoveryEvents}
      seasonalEvents={seasonalEvents}
      cardBodyLayout="city-soft"
    >
      {feedEvents.map((event) => {
        const card = eventToDiscoveryCard(event)
        return (
          <DiscoveryV3Card
            key={event.id}
            {...card}
            event={event}
            compactPillars
            bodyLayout="city-soft"
          />
        )
      })}
    </ExperimentBrowseDiscoveryMockupShell>
  )
}

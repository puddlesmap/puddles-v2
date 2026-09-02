import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { DiscoveryV2Card } from '../components/experiment/DiscoveryV2Card'
import { ExperimentBrowseDiscoveryMockupShell } from '../components/experiment/ExperimentBrowseDiscoveryMockupShell'
import {
  eventToDiscoveryCard,
  getDiscoveryBrowseMockupFeed,
} from '../components/experiment/discoveryBrowseMockupData'
import { formatDocumentTitle, setPageTitle } from '../utils/siteMeta'

export function ExperimentBrowseV2MockupPage() {
  const location = useLocation()
  const { newDiscoveryEvents, seasonalEvents, feedEvents, badgeCounts } = useMemo(
    () => getDiscoveryBrowseMockupFeed(),
    [],
  )

  useEffect(() => {
    setPageTitle(formatDocumentTitle('Browse · Version 2-2 · User Test'), location.pathname)
  }, [location.pathname])

  return (
    <ExperimentBrowseDiscoveryMockupShell
      version={2}
      title="Version 2-2 · user test"
      lede="Age and price on the image; seasonal editorial badge when relevant. Activity type in metadata only — NEW on filters for Festival and Parent & Me."
      eventCount={feedEvents.length}
      badgeCounts={badgeCounts}
      Card={DiscoveryV2Card}
      newDiscoveryEvents={newDiscoveryEvents}
      seasonalEvents={seasonalEvents}
    >
      {feedEvents.map((event) => {
        const card = eventToDiscoveryCard(event)
        return <DiscoveryV2Card key={event.id} {...card} event={event} />
      })}
    </ExperimentBrowseDiscoveryMockupShell>
  )
}

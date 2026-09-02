import type { ComponentType, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader } from '../layout/AppHeader'
import { PageContainer } from '../layout/PageContainer'
import { Footer } from '../layout/Footer'
import { ExperimentBrowseDiscoverySections } from './ExperimentBrowseDiscoverySections'
import type { Event } from '../../types/event'
import type { DiscoveryCardBodyLayout, DiscoveryV3CardData } from './DiscoveryV3Card'
import { ACTIVITY_TYPE_FILTER_NEW_UNTIL } from '../../config/activityTypeLaunch'
import type { BrowseMockupBadgeCounts } from './discoveryBrowseMockupData'
import '../../views/experiment-browse-mockup.css'

type DiscoveryCardComponent = ComponentType<
  DiscoveryV3CardData & {
    href: string
    event?: Event
    compactPillars?: boolean
    bodyLayout?: DiscoveryCardBodyLayout
  }
>

interface ExperimentBrowseDiscoveryMockupShellProps {
  version: 2 | 3
  title: string
  lede: string
  eventCount: number
  badgeCounts: BrowseMockupBadgeCounts
  Card: DiscoveryCardComponent
  newDiscoveryEvents: Event[]
  seasonalEvents: Event[]
  cardBodyLayout?: DiscoveryCardBodyLayout
  children: ReactNode
}

export function ExperimentBrowseDiscoveryMockupShell({
  version,
  title,
  lede,
  eventCount,
  badgeCounts,
  Card,
  newDiscoveryEvents,
  seasonalEvents,
  cardBodyLayout,
  children,
}: ExperimentBrowseDiscoveryMockupShellProps) {
  const otherVersion = version === 2 ? 3 : 2
  const otherPath =
    otherVersion === 2 ? '/experiment/browse-v2-mockup' : '/experiment/browse-v3-mockup'

  return (
    <div className="browse-page-shell browse-page-shell--experiment browse-page-shell--experiment-3 browse-page-shell--experiment-2-column">
      <AppHeader />
      <div className="browse-page-body">
        <PageContainer layout="wide" className="browse-content">
          <header className="browse-discovery-banner">
            <p className="browse-discovery-banner__eyebrow">User test · Browse mockup</p>
            <h1 className="browse-discovery-banner__title">{title}</h1>
            <p className="browse-discovery-banner__lede">{lede}</p>
            <p className="browse-discovery-usertest-note">
              Main feed includes seasonal editorial picks — Fall Pick ({badgeCounts.fallPick}),
              Halloween Pick ({badgeCounts.halloweenPick}), Holiday Pick ({badgeCounts.holidayPick}
              ). Activity types show in card metadata; NEW on activity-type filters through{' '}
              {[
                ...new Set(
                  Object.values(ACTIVITY_TYPE_FILTER_NEW_UNTIL).filter(Boolean),
                ),
              ].join(' · ') || 'launch window'}
              .
            </p>
            <p className="browse-discovery-banner__links">
              <Link to={otherPath}>Version {otherVersion} browse mockup</Link>
              {' · '}
              <Link to="/experiment/browse-card-design-reference">Design reference</Link>
              {' · '}
              <Link to="/experiment/browse-card-layout-mockup">Card layout comparison</Link>
              {' · '}
              <Link to="/experiment/launch-expand-mockup">Card comparison mockup</Link>
              {' · '}
              <Link to="/browse">Live browse</Link>
            </p>
          </header>

          <ExperimentBrowseDiscoverySections
            version={version}
            Card={Card}
            newDiscoveryEvents={newDiscoveryEvents}
            seasonalEvents={seasonalEvents}
            cardBodyLayout={cardBodyLayout}
          />

          <p className="browse-results-count browse-discovery-results-count">
            {eventCount} activities nearby
          </p>

          <div className="browse-feed">
            <div className="browse-event-grid browse-event-grid--compact-two-column">{children}</div>
          </div>

          <p className="browse-discovery-footer-note">
            User test only — badges are editorial mocks, not live launch rules. Version {version}{' '}
            card chrome on production discovery event cards.
          </p>
        </PageContainer>
        <Footer fullBleed className="mt-0" />
      </div>
    </div>
  )
}

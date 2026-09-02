import type { ComponentType, CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { Event } from '../../types/event'
import {
  getSeasonalCollectionForExperiment,
  seasonalCollectionPath,
} from '../../data/seasonalDiscovery'
import { EVENT_FALLBACK_IMAGES } from '../../utils/eventImages'
import { SeasonalDiscoveryModuleHeader } from '../seasonal/SeasonalDiscoveryModuleHeader'
import type { DiscoveryCardBodyLayout, DiscoveryV3CardData } from './DiscoveryV3Card'
import {
  eventToDiscoveryCardWithBadge,
  getNewDiscoveryBadgeForEvent,
  getSeasonalBadgeForEvent,
} from './discoveryBrowseMockupData'

type DiscoveryCardComponent = ComponentType<
  DiscoveryV3CardData & {
    href: string
    event?: Event
    compactPillars?: boolean
    bodyLayout?: DiscoveryCardBodyLayout
  }
>

interface ExperimentBrowseDiscoverySectionsProps {
  version: 2 | 3
  Card: DiscoveryCardComponent
  newDiscoveryEvents: Event[]
  seasonalEvents: Event[]
  cardBodyLayout?: DiscoveryCardBodyLayout
}

function DiscoveryCarousel({
  ariaLabelledBy,
  events,
  Card,
  getBadge,
  compactPillars = false,
  bodyLayout,
}: {
  ariaLabelledBy: string
  events: Event[]
  Card: DiscoveryCardComponent
  getBadge: (event: Event) => DiscoveryV3CardData['badge']
  compactPillars?: boolean
  bodyLayout?: DiscoveryCardBodyLayout
}) {
  return (
    <div className="seasonal-discovery-module__carousel-wrap">
      <div
        className="seasonal-discovery-module__carousel browse-event-grid"
        role="list"
        aria-labelledby={ariaLabelledBy}
      >
        {events.map((event) => {
          const card = eventToDiscoveryCardWithBadge(event, getBadge(event))
          return (
            <div key={event.id} className="seasonal-discovery-module__card" role="listitem">
              <Card {...card} event={event} compactPillars={compactPillars} bodyLayout={bodyLayout} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ExperimentBrowseDiscoverySections({
  version,
  Card,
  newDiscoveryEvents,
  seasonalEvents,
  cardBodyLayout,
}: ExperimentBrowseDiscoverySectionsProps) {
  const seasonalCollection = getSeasonalCollectionForExperiment()

  if (newDiscoveryEvents.length === 0 && seasonalEvents.length === 0) {
    return null
  }

  return (
    <div className="browse-discovery-sections">
      {newDiscoveryEvents.length > 0 ? (
        <section
          className="seasonal-discovery-module seasonal-discovery-module--featured browse-new-discovery-module"
          aria-labelledby="browse-new-discovery-heading"
          style={
            {
              '--seasonal-accent-eyebrow': 'var(--color-brand-dark, #4db8f2)',
            } as CSSProperties
          }
        >
          <div className="seasonal-discovery-module__shell">
            <header className="seasonal-discovery-module__header">
              <div className="seasonal-discovery-module__intro">
                <p className="seasonal-discovery-module__eyebrow">Launch expansion</p>
                <h2 id="browse-new-discovery-heading" className="seasonal-discovery-module__title">
                  New discovery activities
                </h2>
                <p className="seasonal-discovery-module__description">
                  Festival, Parent &amp; Me, and Sunnyvale coverage — activity type in metadata;
                  look for NEW on activity-type filters.
                </p>
              </div>
              <img
                src={EVENT_FALLBACK_IMAGES['Parent & Me']}
                alt=""
                className="seasonal-discovery-module__illustration"
                width={88}
                height={88}
                decoding="async"
              />
            </header>

            <DiscoveryCarousel
              ariaLabelledBy="browse-new-discovery-heading"
              events={newDiscoveryEvents}
              Card={Card}
              getBadge={getNewDiscoveryBadgeForEvent}
              compactPillars={version === 3}
              bodyLayout={cardBodyLayout}
            />

            <div className="seasonal-discovery-module__footer">
              <Link to="/experiment/launch-expand-mockup" className="seasonal-discovery-module__cta">
                Badge rules
                <span aria-hidden> →</span>
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {seasonalEvents.length > 0 ? (
        <section
          className="seasonal-discovery-module seasonal-discovery-module--featured"
          aria-labelledby="browse-seasonal-discovery-heading"
          style={
            {
              '--seasonal-accent-eyebrow': seasonalCollection.accent.eyebrow,
              '--seasonal-accent-bg': seasonalCollection.accent.background,
              '--seasonal-accent-border': seasonalCollection.accent.border,
              '--seasonal-accent-glow': seasonalCollection.accent.glow,
            } as CSSProperties
          }
        >
          <div className="seasonal-discovery-module__shell">
            <SeasonalDiscoveryModuleHeader
              collection={seasonalCollection}
              headingId="browse-seasonal-discovery-heading"
            />

            <DiscoveryCarousel
              ariaLabelledBy="browse-seasonal-discovery-heading"
              events={seasonalEvents}
              Card={Card}
              getBadge={getSeasonalBadgeForEvent}
              compactPillars={version === 3}
              bodyLayout={cardBodyLayout}
            />

            <div className="seasonal-discovery-module__footer">
              <Link
                to={seasonalCollectionPath(seasonalCollection.slug)}
                className="seasonal-discovery-module__cta"
              >
                {seasonalCollection.ctaLabel}
                <span aria-hidden> →</span>
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}

import { Fragment, useEffect, useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CommunityCtaCard } from '../components/brand/CommunityCtaCard'
import { DiscoveryMapPreview } from '../components/discovery/DiscoveryMapPreview'
import { getPublicEventsFromCatalog } from '../data/events'
import { EventCard } from '../components/EventCard'
import { DiscoveryEmptyState } from '../components/empty-states/DiscoveryEmptyState'
import { DiscoveryFilterChip } from '../components/filters/DiscoveryFilterChip'
import { DiscoveryHeroSearch } from '../components/DiscoveryHeroSearch'
import { PageContainer } from '../components/layout/PageContainer'
import { Footer } from '../components/layout/Footer'
import { AppHeader } from '../components/layout/AppHeader'
import { DiscoveryHeroPlaceholder } from '../components/placeholders/VisualPlaceholders'
import { useApp } from '../context/AppContext'
import { useEventNavigation } from '../hooks/useEventNavigation'
import { filterEvents } from '../utils/filters'
import { getFirstTemporalTabWithEvents, getTemporalTabs } from '../utils/dates'
import { trackCitySelected, trackDateFilterSelected } from '../utils/analytics'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'

const CITY_CHIPS = [
  { value: 'all', label: 'All' },
  { value: 'Palo Alto', label: 'Palo Alto' },
  { value: 'Los Altos', label: 'Los Altos' },
  { value: 'Mountain View', label: 'Mountain View' },
] as const

const MOBILE_MAP_INSERT_AFTER_INDEX = 1
const BROWSE_MAP_LINK = '/browse?view=map'

interface DiscoveryPageProps {
  shellClassName?: string
  experimentNote?: ReactNode
}

function DiscoveryMapTeaser({ events, feedKey }: { events: ReturnType<typeof getPublicEventsFromCatalog>; feedKey: string }) {
  return (
    <div className="discovery-map-teaser">
      <DiscoveryMapPreview events={events} resetKey={feedKey} />
      <Link to={BROWSE_MAP_LINK} className="discovery-map-teaser-link">
        View map
      </Link>
    </div>
  )
}

export function DiscoveryPage({
  shellClassName,
  experimentNote,
}: DiscoveryPageProps = {}) {
  const { city, setCity, temporalTab, setTemporalTab, setShowLocationBridge, setLocationBridgeSource } =
    useApp()
  const openEvent = useEventNavigation()

  const tabs = getTemporalTabs()

  useEffect(() => {
    const pool = filterEvents(getPublicEventsFromCatalog(), { city: city === 'all' ? 'all' : city })
    setTemporalTab(getFirstTemporalTabWithEvents(pool))
  }, [city, setTemporalTab])

  const events = filterEvents(getPublicEventsFromCatalog(), {
    city: city === 'all' ? 'all' : city,
    temporalTab,
  })

  const feedKey = useMemo(() => `${city}|${temporalTab}`, [city, temporalTab])

  function openLocationBridge() {
    setLocationBridgeSource('discovery')
    setShowLocationBridge(true)
  }

  function handleCityChange(nextCity: string) {
    if (nextCity === city) return
    trackCitySelected(nextCity, 'browse')
    setCity(nextCity)
  }

  function handleDayChange(day: (typeof tabs)[number]['key']) {
    if (day === temporalTab) return
    trackDateFilterSelected(day, 'browse')
    setTemporalTab(day)
  }

  const mapInsertIndex = Math.min(MOBILE_MAP_INSERT_AFTER_INDEX, events.length - 1)

  return (
    <div className={['discovery-page-shell', shellClassName].filter(Boolean).join(' ')}>
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
        below={
          <div className="browse-controls-band">
            <div className="layout-container browse-controls">
              <div className="browse-controls-row">
                <div className="browse-location-row">
                  <DiscoveryHeroSearch onClick={openLocationBridge} />
                </div>
              </div>
            </div>
          </div>
        }
      />

      <PageContainer className="discovery-page pt-4 md:pt-8">
        <section className="discovery-entry" aria-label="Find activities">
          <div className="discovery-entry-top">
            <div className="discovery-entry-head">
              <h1 className="discovery-hero-title">
                Free &amp; budget-friendly toddler activities nearby
              </h1>
              <p className="discovery-hero-desc">
                Find storytimes, music, drop-ins, outdoor play, and small community moments for ages
                0–5.
              </p>
              <p className="discovery-hero-location-note">
                Starting in Palo Alto, Los Altos, and Mountain View.
              </p>
            </div>

            <DiscoveryHeroPlaceholder className="discovery-hero-art" />
          </div>

          <div className="discovery-filters">
            <div className="discovery-filter-group">
                <span className="discovery-filter-label" id="discovery-where-label">
                  Where
                </span>
                <div className="discovery-filter-chips" role="group" aria-labelledby="discovery-where-label">
                  {CITY_CHIPS.map((chip) => (
                    <DiscoveryFilterChip
                      key={chip.value}
                      label={chip.label}
                      active={city === chip.value}
                      onClick={() => handleCityChange(chip.value)}
                    />
                  ))}
                </div>
              </div>

              <div className="discovery-filter-group">
                <span className="discovery-filter-label" id="discovery-when-label">
                  When
                </span>
                <div className="discovery-filter-chips" role="group" aria-labelledby="discovery-when-label">
                  {tabs.map((tab) => (
                    <DiscoveryFilterChip
                      key={tab.key}
                      label={tab.label}
                      sub={tab.sub}
                      active={temporalTab === tab.key}
                      onClick={() => handleDayChange(tab.key)}
                    />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="discovery-browse">
          <div key={feedKey} className="discovery-feed-layout motion-feed-in">
            <div className="discovery-feed">
              {events.length === 0 ? (
                <DiscoveryEmptyState />
              ) : (
                <div className="discovery-event-grid">
                  {events.map((event, index) => (
                    <Fragment key={event.id}>
                      <EventCard
                        event={event}
                        variant="grid"
                        discovery
                        onClick={() => openEvent(event, 'discovery')}
                      />
                      {index === mapInsertIndex && events.length > 0 && (
                        <div className="discovery-map-teaser discovery-map-teaser--inline">
                          <DiscoveryMapTeaser events={events} feedKey={feedKey} />
                        </div>
                      )}
                    </Fragment>
                  ))}
                </div>
              )}
            </div>

            {events.length > 0 && (
              <aside className="discovery-map-preview-panel" aria-label="Map preview">
                <DiscoveryMapPreview events={events} resetKey={feedKey} />
                <p className="discovery-map-preview-caption">Activities on the map</p>
                <Link to={BROWSE_MAP_LINK} className="discovery-map-preview-link">
                  View map
                </Link>
              </aside>
            )}
          </div>
        </section>

        <CommunityCtaCard
          className="discovery-cta-section"
          title="Know something we should add?"
          body="Puddles is just getting started! If you know a great storytime, music circle, or drop-in spot, share it to help grow the map for other families."
        >
          <Link to="/share" className="btn-primary">
            Share with us
          </Link>
        </CommunityCtaCard>
      </PageContainer>

      {experimentNote ? (
        <PageContainer className="pb-8">{experimentNote}</PageContainer>
      ) : null}

      <Footer fullBleed className="mt-0" />
    </div>
  )
}

import { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { PageContainer } from '../components/layout/PageContainer'
import { Footer } from '../components/layout/Footer'
import { LiveBrowseEventCard } from '../components/experiment/LiveBrowseEventCard'
import { DiscoveryV3Card } from '../components/experiment/DiscoveryV3Card'
import {
  eventToDiscoveryCardWithBadge,
  getBrowseCardLayoutComparisonEvents,
  getSeasonalEditorialComparisonPairs,
} from '../components/experiment/discoveryBrowseMockupData'
import { getPublicEventsFromCatalog } from '../data/events'
import { formatDocumentTitle, setPageTitle } from '../utils/siteMeta'
import './experiment-browse-mockup.css'
import './experiment-browse-card-layout-mockup.css'
import './experiment-browse-live-vs-option2.css'

const COMPARISON_ROWS: {
  id: string
  label: string
  live: string
  option2: string
}[] = [
  {
    id: 'image-pills',
    label: 'Image pills',
    live: 'Category + age + cost on image (e.g. Social & Play · All ages · Free)',
    option2: 'No image pills — clean photo',
  },
  {
    id: 'image-badge',
    label: 'Image badge',
    live: 'No editorial badge on browse grid',
    option2: 'Seasonal badge when relevant (🍂 Fall Pick, Halloween Pick, Holiday Pick)',
  },
  {
    id: 'activity-type',
    label: 'Activity type',
    live: 'On image as category pill',
    option2: 'In body as lavender type pillar (not on image)',
  },
  {
    id: 'city',
    label: 'City',
    live: 'Buried in venue line — often truncates',
    option2: 'First metadata pillar — soft chip + map pin, bold city name',
  },
  {
    id: 'venue',
    label: 'Venue line',
    live: 'Venue · city under title',
    option2: 'Venue line removed from browse card',
  },
  {
    id: 'age-cost',
    label: 'Age & cost',
    live: 'White pills on image',
    option2: 'Grey age + tinted price pillars in body row',
  },
  {
    id: 'body-height',
    label: 'Body height',
    live: 'Flexible — rows can misalign',
    option2: 'Fixed compact body height for grid parity',
  },
  {
    id: 'filter-new',
    label: 'Filter NEW',
    live: 'NEW on activity-type filters only (not on cards)',
    option2: 'Same — filter NEW is unchanged',
  },
]

function getJeffCenterComparisonEvent() {
  const catalog = getPublicEventsFromCatalog()
  return (
    catalog.find((event) => event.id.startsWith('jeff-center-free-family-play')) ??
    catalog.find((event) => event.title === 'Jeff Center Free Family Play') ??
    getBrowseCardLayoutComparisonEvents(1)[0]
  )
}

export function ExperimentBrowseLiveVsOption2Page() {
  const location = useLocation()
  const comparisonEvent = useMemo(() => getJeffCenterComparisonEvent(), [])
  const gridEvents = useMemo(() => getBrowseCardLayoutComparisonEvents(4), [])
  const seasonalPairs = useMemo(() => getSeasonalEditorialComparisonPairs(), [])

  useEffect(() => {
    setPageTitle(formatDocumentTitle('Live vs V3 Option 2'), location.pathname)
  }, [location.pathname])

  const option2Card = comparisonEvent
    ? eventToDiscoveryCardWithBadge(comparisonEvent, null)
    : null

  return (
    <div className="browse-page-shell browse-page-shell--experiment browse-page-shell--experiment-3 browse-page-shell--experiment-2-column browse-live-vs-option2-page">
      <AppHeader />
      <div className="browse-page-body">
        <PageContainer layout="wide" className="browse-content">
          <header className="browse-discovery-banner browse-live-vs-option2-banner">
            <p className="browse-discovery-banner__eyebrow">Design comparison</p>
            <h1 className="browse-discovery-banner__title">Live Puddles vs V3 · Option 2</h1>
            <p className="browse-discovery-banner__lede">
              Side-by-side of what ships on <Link to="/browse">/browse</Link> today versus the
              recommended v3 city-soft layout. Same event in both columns.
            </p>
            <p className="browse-discovery-banner__links">
              <Link to="/experiment/browse-card-design-reference">Full design reference</Link>
              {' · '}
              <Link to="/experiment/browse-v3-mockup">V3 user test</Link>
            </p>
          </header>

          {comparisonEvent && option2Card ? (
            <section className="browse-live-vs-option2-hero" aria-labelledby="hero-heading">
              <h2 id="hero-heading" className="browse-live-vs-option2-hero__title">
                {comparisonEvent.title}
              </h2>
              <div className="browse-live-vs-option2-hero__grid">
                <article className="browse-live-vs-option2-panel browse-live-vs-option2-panel--live">
                  <header className="browse-live-vs-option2-panel__header">
                    <p className="browse-live-vs-option2-panel__eyebrow">Live today</p>
                    <h3 className="browse-live-vs-option2-panel__title">Production browse card</h3>
                    <p className="browse-live-vs-option2-panel__lede">
                      Category, age, and cost on the image. Datetime → title → venue · city. No
                      discovery badge on the grid.
                    </p>
                  </header>
                  <div className="browse-live-vs-option2-panel__card">
                    <LiveBrowseEventCard event={comparisonEvent} />
                  </div>
                </article>

                <article className="browse-live-vs-option2-panel browse-live-vs-option2-panel--option2">
                  <header className="browse-live-vs-option2-panel__header">
                    <p className="browse-live-vs-option2-panel__eyebrow">Proposed</p>
                    <h3 className="browse-live-vs-option2-panel__title">V3 · Option 2 · city-soft</h3>
                    <p className="browse-live-vs-option2-panel__lede">
                      Seasonal badge on image when relevant. Metadata pillars: city chip + pin, age,
                      price, type. Venue line removed.
                    </p>
                  </header>
                  <div className="browse-live-vs-option2-panel__card">
                    <DiscoveryV3Card
                      {...option2Card}
                      event={comparisonEvent}
                      compactPillars
                      bodyLayout="city-soft"
                    />
                  </div>
                </article>
              </div>
            </section>
          ) : null}

          {seasonalPairs.length > 0 ? (
            <section className="browse-live-vs-option2-seasonal" aria-labelledby="seasonal-heading">
              <header className="browse-live-vs-option2-seasonal__header">
                <h2 id="seasonal-heading" className="browse-live-vs-option2-seasonal__title">
                  With Fall Pick &amp; Halloween Pick
                </h2>
                <p className="browse-live-vs-option2-seasonal__lede">
                  Live browse has no editorial badge on the grid. Option 2 surfaces seasonal picks on
                  the image — activity type moves to the metadata row.
                </p>
              </header>

              <div className="browse-live-vs-option2-seasonal__rows">
                {seasonalPairs.map(({ event, badge }) => {
                  const option2Card = eventToDiscoveryCardWithBadge(event, badge)
                  return (
                    <div key={event.id} className="browse-live-vs-option2-seasonal__row">
                      <h3 className="browse-live-vs-option2-seasonal__row-title">{event.title}</h3>
                      <div className="browse-live-vs-option2-hero__grid">
                        <article className="browse-live-vs-option2-panel browse-live-vs-option2-panel--live">
                          <header className="browse-live-vs-option2-panel__header">
                            <p className="browse-live-vs-option2-panel__eyebrow">Live today</p>
                            <p className="browse-live-vs-option2-panel__lede">
                              Category on image — no {badge.label} badge.
                            </p>
                          </header>
                          <div className="browse-live-vs-option2-panel__card">
                            <LiveBrowseEventCard event={event} />
                          </div>
                        </article>

                        <article className="browse-live-vs-option2-panel browse-live-vs-option2-panel--option2">
                          <header className="browse-live-vs-option2-panel__header">
                            <p className="browse-live-vs-option2-panel__eyebrow">Option 2</p>
                            <p className="browse-live-vs-option2-panel__lede">
                              <strong>{badge.label}</strong> on image
                              {badge.icon === 'fall-leaf'
                                ? ' with leaf icon'
                                : badge.icon === 'halloween-pumpkin'
                                  ? ' with pumpkin icon'
                                  : ''}. Type in body
                              pillars.
                            </p>
                          </header>
                          <div className="browse-live-vs-option2-panel__card">
                            <DiscoveryV3Card
                              {...option2Card}
                              event={event}
                              compactPillars
                              bodyLayout="city-soft"
                            />
                          </div>
                        </article>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ) : null}

          <section className="browse-live-vs-option2-changes" aria-labelledby="changes-heading">
            <h2 id="changes-heading" className="browse-live-vs-option2-changes__title">
              What changed
            </h2>
            <div className="browse-live-vs-option2-changes__table-wrap">
              <table className="browse-live-vs-option2-changes__table">
                <thead>
                  <tr>
                    <th scope="col">Area</th>
                    <th scope="col">Live today</th>
                    <th scope="col">V3 · Option 2</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.id}>
                      <th scope="row">{row.label}</th>
                      <td>{row.live}</td>
                      <td>{row.option2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="browse-live-vs-option2-grid" aria-labelledby="grid-heading">
            <h2 id="grid-heading" className="browse-live-vs-option2-grid__title">
              Four events · both versions
            </h2>
            <div className="browse-live-vs-option2-grid__rows">
              {gridEvents.map((event) => {
                const card = eventToDiscoveryCardWithBadge(event, null)
                return (
                  <div key={event.id} className="browse-live-vs-option2-grid__row">
                    <div className="browse-live-vs-option2-grid__cell">
                      <LiveBrowseEventCard event={event} />
                    </div>
                    <div className="browse-live-vs-option2-grid__cell">
                      <DiscoveryV3Card
                        {...card}
                        event={event}
                        compactPillars
                        bodyLayout="city-soft"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </PageContainer>
      </div>
      <Footer />
    </div>
  )
}

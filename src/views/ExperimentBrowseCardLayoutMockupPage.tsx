import { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { PageContainer } from '../components/layout/PageContainer'
import { Footer } from '../components/layout/Footer'
import {
  DiscoveryV3Card,
  type DiscoveryCardBodyLayout,
} from '../components/experiment/DiscoveryV3Card'
import {
  eventToDiscoveryCard,
  getBrowseCardLayoutComparisonEvents,
} from '../components/experiment/discoveryBrowseMockupData'
import { formatDocumentTitle, setPageTitle } from '../utils/siteMeta'
import './experiment-browse-card-layout-mockup.css'

const LAYOUT_OPTIONS: {
  layout: DiscoveryCardBodyLayout
  rank: string
  title: string
  lede: string
  recommended?: boolean
}[] = [
  {
    layout: 'city-soft',
    rank: '2',
    title: 'Soft filled city chip + pin',
    lede: 'Lightest chip of the row — soft gray fill with map pin — city label darker (#484848, bold). Then age · price · type pills.',
    recommended: true,
  },
  {
    layout: 'city-plain',
    rank: '1',
    title: 'Plain text label',
    lede: 'Palo Alto · All ages · Free · Social & Play — no pill, city slightly darker than the rest. Simplest and cleanest.',
  },
  {
    layout: 'city-pill',
    rank: '3',
    title: 'Outlined city pill',
    lede: 'Outlined city capsule first, then age · price · type pills. Stronger city signal, but can compete with the other chips.',
  },
]

export function ExperimentBrowseCardLayoutMockupPage() {
  const location = useLocation()
  const events = useMemo(() => getBrowseCardLayoutComparisonEvents(6), [])

  useEffect(() => {
    setPageTitle(formatDocumentTitle('Browse Card Layout Comparison'), location.pathname)
  }, [location.pathname])

  return (
    <div className="browse-page-shell browse-page-shell--experiment browse-page-shell--experiment-3 browse-page-shell--experiment-2-column browse-card-layout-mockup-page">
      <AppHeader />
      <div className="browse-page-body">
        <PageContainer layout="wide" className="browse-content">
          <header className="browse-discovery-banner browse-card-layout-mockup-banner">
            <p className="browse-discovery-banner__eyebrow">Experiment · Browse card body</p>
            <h1 className="browse-discovery-banner__title">Where should city live?</h1>
            <p className="browse-discovery-banner__lede">
              Same six events in each row. Puddles parents scan for when, what, which city, and who
              it fits — venue name can wait for the detail page.
            </p>
            <p className="browse-discovery-banner__links">
              <Link to="/experiment/browse-card-design-reference">Visual design reference</Link>
              {' · '}
              <Link to="/experiment/browse-v3-mockup">Browse v3 mockup</Link>
              {' · '}
              <Link to="/experiment/browse-v2-mockup">Browse v2-2 mockup</Link>
              {' · '}
              <Link to="/experiment/launch-expand-mockup">Badge comparison</Link>
            </p>
          </header>

          <div className="browse-card-layout-mockup-sections">
            {LAYOUT_OPTIONS.map((option) => (
              <section
                key={option.layout}
                className={[
                  'browse-card-layout-mockup-section',
                  option.recommended ? 'browse-card-layout-mockup-section--recommended' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-labelledby={`layout-${option.layout}-heading`}
              >
                <header className="browse-card-layout-mockup-section__header">
                  <p className="browse-card-layout-mockup-section__rank">
                    Option {option.rank}
                    {option.recommended ? ' · Recommended' : null}
                  </p>
                  <h2 id={`layout-${option.layout}-heading`} className="browse-card-layout-mockup-section__title">
                    {option.title}
                  </h2>
                  <p className="browse-card-layout-mockup-section__lede">{option.lede}</p>
                </header>

                <div className="browse-card-layout-mockup-grid browse-event-grid browse-event-grid--compact-two-column">
                  {events.map((event) => {
                    const card = eventToDiscoveryCard(event)
                    return (
                      <DiscoveryV3Card
                        key={`${option.layout}-${event.id}`}
                        {...card}
                        event={event}
                        bodyLayout={option.layout}
                      />
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </PageContainer>
      </div>
      <Footer />
    </div>
  )
}

import { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LiveBrowseEventCard } from '../components/experiment/LiveBrowseEventCard'
import { DiscoveryV2Card } from '../components/experiment/DiscoveryV2Card'
import {
  DiscoveryV3Card,
  type DiscoveryCardBodyLayout,
} from '../components/experiment/DiscoveryV3Card'
import {
  eventToDiscoveryCardWithBadge,
  getBrowseCardDesignReferenceEvents,
  resolveReferenceCardBadge,
} from '../components/experiment/discoveryBrowseMockupData'
import type { Event } from '../types/event'
import { AppHeader } from '../components/layout/AppHeader'
import { PageContainer } from '../components/layout/PageContainer'
import { Footer } from '../components/layout/Footer'
import { formatDocumentTitle, setPageTitle } from '../utils/siteMeta'
import './experiment-browse-mockup.css'
import './experiment-browse-card-layout-mockup.css'
import './experiment-browse-card-design-reference.css'

type ReferenceVariantKind = 'production' | 'v2-2' | 'v3'

interface ReferenceVariant {
  id: string
  kind: ReferenceVariantKind
  label: string
  shortLabel: string
  group: 'shell' | 'city'
  lede: string
  bodyLayout?: DiscoveryCardBodyLayout
  recommended?: boolean
}

const REFERENCE_VARIANTS: ReferenceVariant[] = [
  {
    id: 'production',
    kind: 'production',
    label: 'Production (live browse)',
    shortLabel: 'Production',
    group: 'shell',
    lede: 'Category + age + cost on image. Datetime → title → venue · city. No discovery badge on browse grid.',
  },
  {
    id: 'v2-2',
    kind: 'v2-2',
    label: 'Discovery v2-2',
    shortLabel: 'V2-2',
    group: 'shell',
    lede: 'Age + price on image (left), discovery badge (right). Body: datetime → title → venue · city.',
  },
  {
    id: 'v3-venue',
    kind: 'v3',
    label: 'Discovery v3 · venue line',
    shortLabel: 'V3 · venue',
    group: 'shell',
    lede: 'Discovery badge on image. Body pillars for age · price · type. Venue · city under title.',
    bodyLayout: 'venue-line',
  },
  {
    id: 'v3-city-plain',
    kind: 'v3',
    label: 'V3 · Option 1 · plain city',
    shortLabel: 'Option 1',
    group: 'city',
    lede: 'City · age · cost · type as plain text — no city pill. Simplest and cleanest.',
    bodyLayout: 'city-plain',
  },
  {
    id: 'v3-city-soft',
    kind: 'v3',
    label: 'V3 · Option 2 · soft city + pin',
    shortLabel: 'Option 2',
    group: 'city',
    lede: 'Lightest filled city chip with map pin — city label #484848 — then age · price · type pills.',
    bodyLayout: 'city-soft',
    recommended: true,
  },
  {
    id: 'v3-city-pill',
    kind: 'v3',
    label: 'V3 · Option 3 · outlined city',
    shortLabel: 'Option 3',
    group: 'city',
    lede: 'Outlined city capsule first, then filled age · price · type pills.',
    bodyLayout: 'city-pill',
  },
]

function ReferenceCard({
  variant,
  event,
}: {
  variant: ReferenceVariant
  event: Event
}) {
  const card = eventToDiscoveryCardWithBadge(event, resolveReferenceCardBadge(event))

  if (variant.kind === 'production') {
    return <LiveBrowseEventCard event={event} />
  }

  if (variant.kind === 'v2-2') {
    return (
      <DiscoveryV2Card
        {...card}
        event={event}
        variant="v2-2"
        bodyLayout={variant.bodyLayout ?? 'venue-line'}
      />
    )
  }

  return (
    <DiscoveryV3Card
      {...card}
      event={event}
      compactPillars
      bodyLayout={variant.bodyLayout ?? 'venue-line'}
    />
  )
}

function ReferenceVariantBlock({
  variant,
  events,
  compact = false,
}: {
  variant: ReferenceVariant
  events: Event[]
  compact?: boolean
}) {
  return (
    <article
      id={variant.id}
      className={[
        'browse-card-design-ref-variant',
        variant.recommended ? 'browse-card-design-ref-variant--recommended' : '',
        compact ? 'browse-card-design-ref-variant--compact' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <header className="browse-card-design-ref-variant__header">
        <p className="browse-card-design-ref-variant__eyebrow">
          {variant.group === 'shell' ? 'Card shell' : 'City on v3'}
          {variant.recommended ? ' · Recommended' : null}
        </p>
        <h2 className="browse-card-design-ref-variant__title">{variant.label}</h2>
        <p className="browse-card-design-ref-variant__lede">{variant.lede}</p>
      </header>

      <div
        className={[
          'browse-card-design-ref-variant__grid',
          compact
            ? 'browse-card-design-ref-variant__grid--hero'
            : 'browse-event-grid browse-event-grid--compact-two-column',
        ].join(' ')}
      >
        {events.map((event) => (
          <div key={`${variant.id}-${event.id}`} className="browse-card-design-ref-variant__cell">
            {compact ? (
              <p className="browse-card-design-ref-variant__cell-label">{variant.shortLabel}</p>
            ) : null}
            <ReferenceCard variant={variant} event={event} />
          </div>
        ))}
      </div>
    </article>
  )
}

export function ExperimentBrowseCardDesignReferencePage() {
  const location = useLocation()
  const events = useMemo(() => getBrowseCardDesignReferenceEvents(6), [])
  const heroEvent =
    events.find((event) => resolveReferenceCardBadge(event) !== null) ?? events[0]
  const badgedEvents = useMemo(
    () => events.filter((event) => resolveReferenceCardBadge(event) !== null),
    [events],
  )

  useEffect(() => {
    setPageTitle(formatDocumentTitle('Browse Card Design Reference'), location.pathname)
  }, [location.pathname])

  const shellVariants = REFERENCE_VARIANTS.filter((variant) => variant.group === 'shell')
  const cityVariants = REFERENCE_VARIANTS.filter((variant) => variant.group === 'city')

  return (
    <div className="browse-page-shell browse-page-shell--experiment browse-page-shell--experiment-3 browse-page-shell--experiment-2-column browse-card-design-ref-page">
      <AppHeader />
      <div className="browse-page-body">
        <PageContainer layout="wide" className="browse-content">
          <header className="browse-discovery-banner browse-card-design-ref-banner">
            <p className="browse-discovery-banner__eyebrow">Design reference · Browse cards</p>
            <h1 className="browse-discovery-banner__title">Event card visual comparison</h1>
            <p className="browse-discovery-banner__lede">
              Production vs Discovery v2-2 vs v3, plus city-placement options on v3. Same real
              catalog events in each row so truncation and badges behave like browse.
            </p>
            <nav className="browse-card-design-ref-nav" aria-label="Jump to variant">
              {REFERENCE_VARIANTS.map((variant) => (
                <a key={variant.id} href={`#${variant.id}`} className="browse-card-design-ref-nav__link">
                  {variant.shortLabel}
                </a>
              ))}
            </nav>
            <p className="browse-discovery-banner__links">
              <Link to="/experiment/browse-v3-mockup">V3 user test</Link>
              {' · '}
              <Link to="/experiment/browse-v2-mockup">V2-2 user test</Link>
              {' · '}
              <Link to="/experiment/browse-live-vs-option2">Live vs Option 2</Link>
              {' · '}
              <Link to="/experiment/browse-card-layout-mockup">City layout A/B</Link>
            </p>
          </header>

          {badgedEvents.length > 0 ? (
            <section className="browse-card-design-ref-badges" aria-labelledby="badges-heading">
              <header className="browse-card-design-ref-badges__header">
                <h2 id="badges-heading" className="browse-card-design-ref-group__title">
                  Discovery badges
                </h2>
                <p className="browse-card-design-ref-group__lede">
                  New type, new city, and seasonal picks — v2-2 and v3 show badges on the image.
                </p>
              </header>
              <div className="browse-card-design-ref-badges__grid browse-event-grid browse-event-grid--compact-two-column">
                {badgedEvents.slice(0, 4).map((event) => {
                  const badge = resolveReferenceCardBadge(event)
                  return (
                    <div key={event.id} className="browse-card-design-ref-badges__cell">
                      <p className="browse-card-design-ref-badges__label">
                        {badge?.label ?? 'Badged'}
                      </p>
                      <DiscoveryV3Card
                        {...eventToDiscoveryCardWithBadge(event, badge)}
                        event={event}
                        compactPillars
                        bodyLayout="city-soft"
                      />
                    </div>
                  )
                })}
              </div>
            </section>
          ) : null}

          {heroEvent ? (
            <section className="browse-card-design-ref-hero" aria-labelledby="hero-heading">
              <header className="browse-card-design-ref-hero__header">
                <h2 id="hero-heading" className="browse-card-design-ref-hero__title">
                  Same activity, six treatments
                </h2>
                <p className="browse-card-design-ref-hero__lede">
                  <strong>{heroEvent.title}</strong> — scroll on narrow screens.
                </p>
              </header>
              <div className="browse-card-design-ref-hero__strip">
                {REFERENCE_VARIANTS.map((variant) => (
                  <ReferenceVariantBlock
                    key={`hero-${variant.id}`}
                    variant={variant}
                    events={[heroEvent]}
                    compact
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="browse-card-design-ref-group" aria-labelledby="shell-group-heading">
            <h2 id="shell-group-heading" className="browse-card-design-ref-group__title">
              Card shell
            </h2>
            <p className="browse-card-design-ref-group__lede">
              Where age, price, type, and discovery signals live — before changing city placement.
            </p>
            <div className="browse-card-design-ref-group__sections">
              {shellVariants.map((variant) => (
                <ReferenceVariantBlock key={variant.id} variant={variant} events={events} />
              ))}
            </div>
          </section>

          <section className="browse-card-design-ref-group" aria-labelledby="city-group-heading">
            <h2 id="city-group-heading" className="browse-card-design-ref-group__title">
              City placement on v3
            </h2>
            <p className="browse-card-design-ref-group__lede">
              V3 shell with venue line removed — three ways to surface city in the body.
            </p>
            <div className="browse-card-design-ref-group__sections">
              {cityVariants.map((variant) => (
                <ReferenceVariantBlock key={variant.id} variant={variant} events={events} />
              ))}
            </div>
          </section>
        </PageContainer>
      </div>
      <Footer />
    </div>
  )
}

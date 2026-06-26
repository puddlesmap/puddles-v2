import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CommunityCtaCard } from '../components/brand/CommunityCtaCard'
import { MOCK_EVENTS } from '../data/events'
import { EventCard } from '../components/EventCard'
import { DiscoveryEmptyState } from '../components/empty-states/DiscoveryEmptyState'
import {
  DiscoveryFilterChip,
  NearbyPinIcon,
} from '../components/filters/DiscoveryFilterChip'
import { PageContainer } from '../components/layout/PageContainer'
import { Footer } from '../components/layout/Footer'
import { AppHeader } from '../components/layout/AppHeader'
import {
  ABOUT_BRAND_NAME,
  ABOUT_BRAND_TAG,
  ABOUT_SHARE_CTA_BODY,
  ABOUT_TAGLINE,
} from './aboutShared'
import { HomeRotatingAccents } from '../components/HomeRotatingAccents'
import { HomeSoftAccents } from '../components/HomeSoftAccents'
import { HomeMapPreview } from '../components/home/HomeMapPreview'
import {
  HOME_EXPERIMENT_SUPPORTING_LINE,
  HOME_EXPERIMENT_REFINED_CTA_BODY,
  HOME_EXPERIMENT_REFINED_CTA_TITLE,
  HOME_EXPERIMENT_REFINED_SUPPORTING_LINE,
} from './homeExperimentAccentShared'
import {
  PUDDLES_WORDMARK_LOGO_SRC,
  PUDDLES_WORDMARK_LOGO_SRC_2X,
} from './experimentShared'
import { useUserLocation } from '../hooks/useUserLocation'
import { useApp } from '../context/AppContext'
import { filterEvents } from '../utils/filters'
import type { TemporalTab } from '../utils/dates'
import { getFirstTemporalTabWithEvents, getTemporalTabs } from '../utils/dates'
import {
  NEARBY_RADIUS_MILES,
  filterEventsByRadius,
  sortEventsByDistance,
} from '../utils/geo'
import {
  trackHomeExperimentNearbyDenied,
  trackHomeExperimentNearbySelect,
} from '../utils/analytics'
import { homeFiltersToBrowseFilters, getHomeResultsSummaryRefined } from '../utils/homeMapPreview'

type CityValue = 'all' | 'Palo Alto' | 'Los Altos' | 'Mountain View'

type WhereMode =
  | { kind: 'nearby' }
  | { kind: 'city'; value: CityValue }

const CITY_CHIPS: Array<{ value: CityValue; label: string }> = [
  { value: 'Palo Alto', label: 'Palo Alto' },
  { value: 'Los Altos', label: 'Los Altos' },
  { value: 'Mountain View', label: 'Mountain View' },
  { value: 'all', label: 'All Cities' },
]

const PREVIEW_LIMIT = 2

function formatEventCount(count: number): string {
  return `${count} ${count === 1 ? 'event' : 'events'}`
}

function getHomeLocationLabel(whereMode: WhereMode): string {
  if (whereMode.kind === 'nearby') {
    return `Within ${NEARBY_RADIUS_MILES} mi of you`
  }

  if (whereMode.value === 'all') return 'All cities'
  return whereMode.value
}

function getResultsSummary({
  whereMode,
  eventCount,
  hasNearbyCoords,
}: {
  whereMode: WhereMode
  eventCount: number
  hasNearbyCoords: boolean
}): string | null {
  if (whereMode.kind === 'nearby' && !hasNearbyCoords) return null

  if (eventCount === 0) {
    if (whereMode.kind === 'nearby') {
      return `No events found within ${NEARBY_RADIUS_MILES} mi of you`
    }

    return whereMode.value === 'all'
      ? 'No events found in all cities'
      : `No events found in ${whereMode.value}`
  }

  return `${getHomeLocationLabel(whereMode)} · ${formatEventCount(eventCount)}`
}

export type HomeHeroVariant = 'default' | 'experiment1' | 'experiment2' | 'experiment3' | 'experiment4' | 'refined'

export type HomeLayoutVariant = 'default' | 'refined'

interface HomeExperimentPageProps {
  shellClassName?: string
  pageClassName?: string
  heroVariant?: HomeHeroVariant
  layout?: HomeLayoutVariant
  trailing?: ReactNode
  logoOnly?: boolean
  logoSrc?: string
  logoSrc2x?: string
  showBrandName?: boolean
}

function HomeExperimentHero({ variant }: { variant: HomeHeroVariant }) {
  if (variant === 'refined') {
    return (
      <header className="home-experiment-intro home-experiment-intro--refined">
        <h1 className="home-experiment-title home-experiment-refined-title">
          Find <span className="home-experiment-refined-accent">easy</span>, toddler-friendly things to do
          nearby
        </h1>
        <p className="home-experiment-refined-supporting">{HOME_EXPERIMENT_REFINED_SUPPORTING_LINE}</p>
      </header>
    )
  }

  if (variant === 'experiment4') {
    return (
      <header className="home-experiment-intro home-experiment-intro--soft">
        <div className="home-experiment-soft-brand-row">
          <p className="home-experiment-brand-line">
            <span className="home-experiment-brand-name">Puddles</span>
            <span className="home-experiment-brand-tag"> the tot map</span>
          </p>
          <HomeSoftAccents />
        </div>
        <h1 className="home-experiment-title">
          Find free &amp; budget-friendly toddler activities nearby
        </h1>
        <p className="home-experiment-supporting-line">{HOME_EXPERIMENT_SUPPORTING_LINE}</p>
      </header>
    )
  }

  if (variant === 'experiment3') {
    return (
      <header className="home-experiment-intro home-experiment-intro--accent">
        <div className="home-experiment-accent-hero-grid">
          <div className="home-experiment-accent-copy">
            <h1 className="home-experiment-hero-headline">
              <span className="home-experiment-hero-line">
                <span className="home-experiment-brand-name">{ABOUT_BRAND_NAME}</span>
                <span className="home-experiment-brand-tag">{ABOUT_BRAND_TAG}</span>
              </span>
              <span className="home-experiment-hero-line home-experiment-hero-tagline">{ABOUT_TAGLINE}</span>
            </h1>
            <p className="home-experiment-supporting-line">{HOME_EXPERIMENT_SUPPORTING_LINE}</p>
            <div className="home-experiment-accent-row-wrap">
              <HomeRotatingAccents variant="row" />
            </div>
          </div>
          <div className="home-experiment-accent-aside">
            <HomeRotatingAccents variant="hero" />
          </div>
        </div>
      </header>
    )
  }

  if (variant === 'experiment1') {
    return (
      <header className="home-experiment-intro">
        <h1 className="home-experiment-hero-headline">
          <span className="home-experiment-hero-line">
            <span className="home-experiment-brand-name">{ABOUT_BRAND_NAME}</span>
            <span className="home-experiment-brand-tag">{ABOUT_BRAND_TAG}</span>
          </span>
          <span className="home-experiment-hero-line home-experiment-hero-tagline">{ABOUT_TAGLINE}</span>
        </h1>
        <p className="home-experiment-subline">
          Find free &amp; budget-friendly toddler activities nearby
        </p>
      </header>
    )
  }

  return (
    <header className="home-experiment-intro">
      <p className="home-experiment-brand-line">
        <span className="home-experiment-brand-name">Puddles</span>
        <span className="home-experiment-brand-tag"> the tot map</span>
      </p>
      <h1 className="home-experiment-title">
        Find free &amp; budget-friendly toddler activities nearby
      </h1>
    </header>
  )
}

export function HomeExperimentPage({
  shellClassName,
  pageClassName,
  heroVariant = 'default',
  layout = 'default',
  trailing,
  logoOnly = false,
  logoSrc = PUDDLES_WORDMARK_LOGO_SRC,
  logoSrc2x = PUDDLES_WORDMARK_LOGO_SRC_2X,
  showBrandName = false,
}: HomeExperimentPageProps = {}) {
  const { openEvent, browseFilters, setBrowseFilters } = useApp()
  const [whereMode, setWhereMode] = useState<WhereMode>({ kind: 'city', value: 'all' })
  const [temporalTab, setLocalTemporalTab] = useState<TemporalTab>('today')
  const { coords, isRequesting, requestLocation } = useUserLocation()

  const tabs = getTemporalTabs()

  const cityFilter = whereMode.kind === 'city' ? whereMode.value : 'all'

  useEffect(() => {
    const pool = filterEvents(MOCK_EVENTS, { city: cityFilter === 'all' ? 'all' : cityFilter })
    setLocalTemporalTab(getFirstTemporalTabWithEvents(pool))
  }, [cityFilter])

  const events = useMemo(() => {
    const base = filterEvents(MOCK_EVENTS, {
      city: whereMode.kind === 'city' && whereMode.value !== 'all' ? whereMode.value : 'all',
      temporalTab,
    })

    if (whereMode.kind === 'nearby' && coords) {
      return sortEventsByDistance(
        filterEventsByRadius(base, coords, NEARBY_RADIUS_MILES),
        coords,
      )
    }

    return base
  }, [whereMode, temporalTab, coords])

  const previewEvents = useMemo(() => events.slice(0, PREVIEW_LIMIT), [events])
  const feedKey = useMemo(
    () => `${whereMode.kind}|${whereMode.kind === 'city' ? whereMode.value : 'nearby'}|${temporalTab}|${coords?.lat ?? ''}|${coords?.lng ?? ''}`,
    [whereMode, temporalTab, coords],
  )

  const requestNearbyLocation = useCallback(async () => {
    trackHomeExperimentNearbySelect()
    const nextCoords = await requestLocation()
    if (!nextCoords) {
      trackHomeExperimentNearbyDenied()
      setWhereMode({ kind: 'city', value: 'all' })
    }
  }, [requestLocation])

  function handleNearbySelect() {
    if (whereMode.kind === 'nearby' && coords) return
    setWhereMode({ kind: 'nearby' })
    void requestNearbyLocation()
  }

  function handleCitySelect(value: CityValue) {
    setWhereMode({ kind: 'city', value })
  }

  function handleDayChange(day: TemporalTab) {
    if (day === temporalTab) return
    setLocalTemporalTab(day)
  }

  const isRefinedLayout = layout === 'refined'

  const resultsSummary = useMemo(() => {
    if (isRequesting) return null

    if (isRefinedLayout) {
      return getHomeResultsSummaryRefined({
        whereMode,
        eventCount: events.length,
        hasNearbyCoords: whereMode.kind === 'nearby' && Boolean(coords),
      })
    }

    return getResultsSummary({
      whereMode,
      eventCount: events.length,
      hasNearbyCoords: whereMode.kind === 'nearby' && Boolean(coords),
    })
  }, [isRefinedLayout, whereMode, events.length, coords, isRequesting])

  const showEmpty = previewEvents.length === 0 && !isRequesting

  const emptyStateVariant = useMemo(() => {
    if (!isRefinedLayout) return 'default' as const
    if (whereMode.kind === 'nearby' && !coords) return 'nearby-denied' as const
    return 'refined-home' as const
  }, [isRefinedLayout, whereMode, coords])

  const handleNavigateToMap = useCallback(() => {
    setBrowseFilters(homeFiltersToBrowseFilters(whereMode, temporalTab, browseFilters))
  }, [browseFilters, setBrowseFilters, temporalTab, whereMode])

  const mapPreviewEvents = useMemo(() => {
    if (whereMode.kind === 'nearby' && !coords) return []
    return events
  }, [events, whereMode, coords])

  const renderMapPreview = () => (
    <HomeMapPreview
      events={mapPreviewEvents}
      resetKey={feedKey}
      whereMode={whereMode}
      temporalTab={temporalTab}
      eventCount={mapPreviewEvents.length}
      hasNearbyCoords={whereMode.kind === 'nearby' && Boolean(coords)}
      isRequesting={isRequesting}
      onNavigateToMap={handleNavigateToMap}
      statusVariant={isRefinedLayout ? 'refined' : 'default'}
    />
  )

  const filterSection = (
    <div
      className={[
        'home-experiment-filters discovery-filters',
        isRefinedLayout ? '' : 'mt-8',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Quick filters"
    >
      <div className="discovery-filter-group home-experiment-filter-group">
        <span className="discovery-filter-label" id="home-experiment-where-label">
          Where
        </span>
        <div
          className="discovery-filter-chips discovery-filter-chips--scroll"
          role="group"
          aria-labelledby="home-experiment-where-label"
        >
          <DiscoveryFilterChip
            label="Nearby"
            icon={<NearbyPinIcon tone={isRefinedLayout ? 'brand' : 'default'} />}
            active={whereMode.kind === 'nearby'}
            onClick={handleNearbySelect}
          />
          {CITY_CHIPS.map((chip) => (
            <DiscoveryFilterChip
              key={chip.value}
              label={chip.label}
              active={whereMode.kind === 'city' && whereMode.value === chip.value}
              onClick={() => handleCitySelect(chip.value)}
            />
          ))}
        </div>
      </div>

      <div className="discovery-filter-group home-experiment-filter-group">
        <span className="discovery-filter-label" id="home-experiment-when-label">
          When
        </span>
        <div
          className="discovery-filter-chips"
          role="group"
          aria-labelledby="home-experiment-when-label"
        >
          {tabs.map((tab) => (
            <DiscoveryFilterChip
              key={tab.key}
              label={tab.label}
              active={temporalTab === tab.key}
              onClick={() => handleDayChange(tab.key)}
            />
          ))}
        </div>
      </div>
    </div>
  )

  const resultsSection = (
    <section
      className={[
        'home-experiment-content w-full',
        isRefinedLayout ? '' : 'mt-16',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Activity results"
    >
      {!isRequesting ? (
        <div className="home-experiment-results-feed browse-content">
          {resultsSummary ? (
            <p
              className={
                isRefinedLayout ? 'home-experiment-refined-results-summary' : 'browse-results-count'
              }
            >
              {resultsSummary}
            </p>
          ) : null}

          {showEmpty ? (
            <DiscoveryEmptyState
              variant={emptyStateVariant}
              onRetryLocation={emptyStateVariant === 'nearby-denied' ? requestNearbyLocation : undefined}
            />
          ) : previewEvents.length > 0 ? (
            <div key={feedKey} className="browse-event-grid motion-feed-in">
              {previewEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant="grid"
                  discovery
                  onClick={() => openEvent(event, 'browse_list')}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )

  const shareCta = (
    <div className="about-lower-section">
      <div className="about-cta-group">
        <CommunityCtaCard
          className="about-cta-section"
          title={isRefinedLayout ? HOME_EXPERIMENT_REFINED_CTA_TITLE : 'Know something we should add?'}
          body={isRefinedLayout ? HOME_EXPERIMENT_REFINED_CTA_BODY : ABOUT_SHARE_CTA_BODY}
        >
          <Link to="/share" className="btn-primary">
            Share with us
          </Link>
        </CommunityCtaCard>
      </div>
    </div>
  )

  return (
    <div className={['home-experiment-shell', shellClassName].filter(Boolean).join(' ')}>
      <AppHeader
        logoOnly={logoOnly}
        logoSrc={logoSrc}
        logoSrc2x={logoSrc2x}
        showBrandName={showBrandName}
      />

      <PageContainer
        className={['home-experiment-page pt-6 md:pt-10', pageClassName].filter(Boolean).join(' ')}
      >
        {isRefinedLayout ? (
          <div className="home-experiment-refined-layout">
            <div className="home-experiment-refined-main">
              <section className="home-experiment-control w-full" aria-label="Find activities">
                <HomeExperimentHero variant={heroVariant} />
                {filterSection}
                <div className="home-experiment-refined-map home-experiment-refined-map--mobile home-experiment-refined-panel">
                  {renderMapPreview()}
                </div>
              </section>
              {resultsSection}
              <div className="home-experiment-refined-cta home-experiment-refined-cta--inline home-experiment-refined-panel">
                {shareCta}
              </div>
            </div>

            <aside className="home-experiment-refined-aside" aria-label="Map preview">
              <div className="home-experiment-refined-map home-experiment-refined-map--desktop">
                {renderMapPreview()}
              </div>
              <div className="home-experiment-refined-cta home-experiment-refined-cta--aside">
                {shareCta}
              </div>
            </aside>
          </div>
        ) : (
          <>
            <section className="home-experiment-control w-full" aria-label="Find activities">
              <HomeExperimentHero variant={heroVariant} />
              {filterSection}
            </section>
            {resultsSection}
            {shareCta}
          </>
        )}
        {trailing}
      </PageContainer>

      <Footer fullBleed className={isRefinedLayout ? 'home-experiment-footer--refined' : 'mt-0'} />
    </div>
  )
}

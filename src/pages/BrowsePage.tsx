import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getPublicEventsFromCatalog } from '../data/events'
import { EventCard } from '../components/EventCard'
import { FilterChipButton } from '../components/FilterChipButton'
import { FilterPopover, type FilterPopoverType } from '../components/FilterPopover'
import { FilterSheet, type FilterSheetType } from '../components/FilterSheet'
import { PageContainer } from '../components/layout/PageContainer'
import { Footer } from '../components/layout/Footer'
import { AppHeader } from '../components/layout/AppHeader'
import { BrowseLocationPill } from '../components/layout/BrowseLocationPill'
import { getBrowseLocationLabel } from '../components/layout/BrandLockup'
import { useApp } from '../context/AppContext'
import { BrowseEmptyState } from '../components/empty-states/BrowseEmptyState'
import { BrowseMapView } from '../components/browse/BrowseMapView'
import { useScrollDirectionCollapse } from '../hooks/useScrollDirection'
import { useUserLocation } from '../hooks/useUserLocation'
import {
  filterEvents,
  getBrowseActivityChipLabel,
  getBrowseAgeChipLabel,
  getBrowseSeeUpcomingFilters,
  getResetBrowseFilters,
  isBrowseFiltersDefault,
  type BrowseFilters,
} from '../utils/filters'
import {
  NEARBY_RADIUS_MILES,
  filterEventsByRadius,
  sortEventsByDistance,
} from '../utils/geo'
import {
  track,
  trackBrowseCityChange,
  trackBrowseNearbyDenied,
  trackBrowseNearbySelect,
} from '../utils/analytics'
import { getBrowseEventNoun, getBrowseResultsSummary } from '../utils/browseResultsCopy'
import {
  HOME_HEADER_LOGO_SRC,
  PUDDLES_WORDMARK_LOGO_SRC,
  PUDDLES_WORDMARK_LOGO_SRC_2X,
} from './experimentShared'

const DESKTOP_MEDIA = '(min-width: 768px)'

function isDesktopViewport() {
  return window.matchMedia(DESKTOP_MEDIA).matches
}

const DAY_LABELS = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  weekend: 'This weekend',
  anytime: 'Anytime',
} as const

const TIME_LABELS = {
  any: 'Time',
  morning: 'Morning',
  'after-lunch': 'After lunch',
  'late-afternoon': 'Late afternoon',
  evening: 'Evening',
} as const

function BrowseViewToggle({
  viewMode,
  onChange,
  className = '',
}: {
  viewMode: 'list' | 'map'
  onChange: (mode: 'list' | 'map') => void
  className?: string
}) {
  return (
    <div className={`browse-view-toggle ${className}`.trim()}>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={viewMode === 'list' ? 'browse-view-toggle-active' : ''}
      >
        List
      </button>
      <button
        type="button"
        onClick={() => onChange('map')}
        className={viewMode === 'map' ? 'browse-view-toggle-active' : ''}
      >
        Map
      </button>
    </div>
  )
}

interface BrowsePageProps {
  shellClassName?: string
  useHomeHeader?: boolean
  resultsCountStyle?: 'default' | 'contextual'
  mapInteractionMode?: 'default' | 'connected'
  defaultViewMode?: 'list' | 'map'
  experimentNote?: ReactNode
}

export function BrowsePage({
  shellClassName,
  useHomeHeader = true,
  resultsCountStyle = 'default',
  mapInteractionMode = 'default',
  defaultViewMode = 'list',
  experimentNote,
}: BrowsePageProps = {}) {
  const { browseFilters, setBrowseFilters, openEvent } = useApp()
  const [searchParams] = useSearchParams()
  const [openPopover, setOpenPopover] = useState<FilterPopoverType>(null)
  const [openSheet, setOpenSheet] = useState<FilterSheetType>(null)
  const [viewMode, setViewMode] = useState<'list' | 'map'>(() => {
    if (searchParams.get('view') === 'map') return 'map'
    return defaultViewMode
  })
  const secondaryCollapsed = useScrollDirectionCollapse()
  const { coords, isRequesting, requestLocation } = useUserLocation()
  const isExperimentBrowse3 = shellClassName?.includes('experiment-3') ?? false

  useEffect(() => {
    if (!isExperimentBrowse3) return

    const root = document.querySelector('.layout-root')
    root?.classList.add('layout-root--experiment-browse-3')

    return () => {
      root?.classList.remove('layout-root--experiment-browse-3')
    }
  }, [isExperimentBrowse3])

  const requestNearbyLocation = useCallback(async () => {
    trackBrowseNearbySelect()
    const nextCoords = await requestLocation()
    if (!nextCoords) {
      trackBrowseNearbyDenied()
      return false
    }
    return true
  }, [requestLocation])

  useEffect(() => {
    if (browseFilters.city !== 'nearby' || coords || isRequesting) return

    void requestLocation().then((nextCoords) => {
      if (!nextCoords) {
        setBrowseFilters({ ...browseFilters, city: 'all', cityLocked: false })
      }
    })
  }, [browseFilters, coords, isRequesting, requestLocation, setBrowseFilters])

  const events = useMemo(() => {
    const base = filterEvents(getPublicEventsFromCatalog(), { browse: browseFilters })

    if (browseFilters.city === 'nearby' && coords) {
      return sortEventsByDistance(
        filterEventsByRadius(base, coords, NEARBY_RADIUS_MILES),
        coords,
      )
    }

    return base
  }, [browseFilters, coords])

  const awaitingNearby = browseFilters.city === 'nearby' && !coords
  const showReset = !isBrowseFiltersDefault(browseFilters)
  const locationLabel = getBrowseLocationLabel(browseFilters.city)

  const resultsSummary =
    resultsCountStyle === 'contextual'
      ? getBrowseResultsSummary(events.length, browseFilters.city, browseFilters.day)
      : `${events.length} ${getBrowseEventNoun(events.length, browseFilters.day)}`

  const feedKey = useMemo(
    () =>
      [
        browseFilters.city,
        browseFilters.day,
        browseFilters.time,
        browseFilters.age,
        browseFilters.types.join(','),
        coords?.lat ?? '',
        coords?.lng ?? '',
        viewMode,
      ].join('|'),
    [browseFilters, coords, viewMode],
  )

  function countBrowseEvents(filters: BrowseFilters) {
    const base = filterEvents(getPublicEventsFromCatalog(), { browse: filters })

    if (filters.city === 'nearby' && coords) {
      return filterEventsByRadius(base, coords, NEARBY_RADIUS_MILES).length
    }

    return base.length
  }

  function resetFilters() {
    track('browse_filters_reset')
    setBrowseFilters(getResetBrowseFilters(browseFilters))
  }

  function tryAllCities() {
    trackBrowseCityChange('all', 'pill', browseFilters.city)
    setBrowseFilters({ ...browseFilters, city: 'all', cityLocked: false })
  }

  function seeUpcomingEvents() {
    track('browse_see_upcoming_events')
    setBrowseFilters(getBrowseSeeUpcomingFilters(browseFilters, countBrowseEvents))
  }

  function handleViewModeChange(mode: 'list' | 'map') {
    if (mode !== viewMode) {
      track('browse_view_change', { view: mode })
    }
    setViewMode(mode)
  }

  function openLocationFilter() {
    setOpenPopover(null)
    if (isDesktopViewport()) {
      setOpenPopover('location')
    } else {
      setOpenSheet('location')
    }
  }

  function openFilterChip(key: 'day' | 'time' | 'age' | 'type') {
    setOpenPopover(null)
    if (isDesktopViewport()) {
      setOpenPopover(key)
    } else {
      setOpenSheet(key)
    }
  }

  const filterChips: Array<{
    key: 'day' | 'time' | 'age' | 'type'
    label: string
    active: boolean
    selectionCount?: number
  }> = [
    {
      key: 'day' as const,
      label: browseFilters.day !== 'anytime' ? DAY_LABELS[browseFilters.day] : 'Upcoming',
      active: browseFilters.day !== 'anytime',
    },
    {
      key: 'time' as const,
      label: browseFilters.time !== 'any' ? TIME_LABELS[browseFilters.time] : 'Time',
      active: browseFilters.time !== 'any',
    },
    {
      key: 'age' as const,
      label: getBrowseAgeChipLabel(browseFilters.age),
      active: browseFilters.age !== 'all',
    },
    {
      key: 'type' as const,
      label: getBrowseActivityChipLabel(browseFilters.types),
      active: browseFilters.types.length > 0,
    },
  ]

  const secondaryControls = (
    <div className="browse-secondary-controls-row">
      <div className="browse-filter-chips-scroll">
        <div className="browse-filter-chips">
          {filterChips.map((chip) => (
            <FilterChipButton
              key={chip.key}
              label={chip.label}
              active={chip.active}
              selectionCount={chip.selectionCount ?? 0}
              onClick={() => openFilterChip(chip.key)}
            />
          ))}
          {showReset && (
            <button type="button" onClick={resetFilters} className="browse-reset-link">
              Reset
            </button>
          )}
        </div>
      </div>
      <BrowseViewToggle viewMode={viewMode} onChange={handleViewModeChange} className="browse-view-toggle-inline" />
    </div>
  )

  return (
    <div className={['browse-page-shell', shellClassName].filter(Boolean).join(' ')}>
      <AppHeader
        logoSrc={useHomeHeader ? PUDDLES_WORDMARK_LOGO_SRC : HOME_HEADER_LOGO_SRC}
        logoSrc2x={useHomeHeader ? PUDDLES_WORDMARK_LOGO_SRC_2X : undefined}
        showBrandName={false}
        below={
          <div className="browse-controls-band">
            <div className="layout-container browse-controls relative">
            <div className="browse-controls-row">
              <div className="browse-location-row">
                <BrowseLocationPill label={locationLabel} onClick={openLocationFilter} />
              </div>

              <div
                className={`browse-secondary-controls ${secondaryCollapsed ? 'browse-secondary-controls--collapsed' : ''}`}
              >
                {secondaryControls}
              </div>
            </div>

            <FilterPopover
              filters={browseFilters}
              onApply={setBrowseFilters}
              open={openPopover}
              onClose={() => setOpenPopover(null)}
              hasNearbyCoords={Boolean(coords)}
              onRequestNearby={requestNearbyLocation}
            />
          </div>
          </div>
        }
      />

      <FilterSheet
        filters={browseFilters}
        onApply={setBrowseFilters}
        open={openSheet}
        onClose={() => setOpenSheet(null)}
        hasNearbyCoords={Boolean(coords)}
        onRequestNearby={requestNearbyLocation}
      />

      {viewMode === 'map' && events.length > 0 && !awaitingNearby ? (
        <BrowseMapView
          events={events}
          feedKey={feedKey}
          browseFilters={browseFilters}
          interactionMode={mapInteractionMode}
          onOpenEvent={(event) => openEvent(event, 'browse_map')}
        />
      ) : (
        <div className="browse-page-body">
          <PageContainer layout="wide" className="browse-content">
            <p className="browse-results-count">
              {awaitingNearby ? null : resultsSummary}
            </p>

            <div key={feedKey} className="browse-feed motion-feed-in">
              {awaitingNearby ? null : events.length === 0 ? (
                <BrowseEmptyState
                  filters={browseFilters}
                  onResetFilters={setBrowseFilters}
                  onTryAllCities={tryAllCities}
                  onSeeUpcomingEvents={seeUpcomingEvents}
                />
              ) : (
                <div className="browse-event-grid">
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      variant="grid"
                      discovery
                      onClick={() => openEvent(event, 'browse_list')}
                    />
                  ))}
                </div>
              )}
            </div>

            {experimentNote}
          </PageContainer>

          <Footer fullBleed className="mt-0" />
        </div>
      )}
      {viewMode === 'map' && events.length > 0 ? experimentNote : null}
    </div>
  )
}

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
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
import { useBrowseMobileControlsCollapse } from '../hooks/useBrowseMobileControlsCollapse'
import { useUserLocation } from '../hooks/useUserLocation'
import {
  DEFAULT_BROWSE_FILTERS,
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
import { trackCitySelected, trackViewModeChanged } from '../utils/analytics'
import { getBrowseActivityNoun, getBrowseResultsSummary } from '../utils/browseResultsCopy'
import {
  HOME_HEADER_LOGO_SRC,
  PUDDLES_WORDMARK_LOGO_SRC,
  PUDDLES_WORDMARK_LOGO_SRC_2X,
} from './experimentShared'
import { useEventNavigation } from '../hooks/useEventNavigation'
import { resolveCitySlugParam } from '../config/localRoutes'
import { formatDocumentTitle, setPageTitle } from '../utils/siteMeta'
import {
  consumeBrowseReturnSnapshot,
  type BrowseMapOpenSnapshot,
  type BrowseReturnSnapshot,
} from '../utils/browseReturnState'

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
  listLayout?: 'default' | 'compact-two-column'
  experimentNote?: ReactNode
}

function isBrowseHubPath(pathname: string): boolean {
  return pathname === '/browse' || pathname === '/browse-v2'
}

export function BrowsePage({
  shellClassName,
  useHomeHeader = true,
  resultsCountStyle = 'default',
  mapInteractionMode = 'default',
  defaultViewMode = 'list',
  listLayout = 'default',
  experimentNote,
}: BrowsePageProps = {}) {
  const { browseFilters, setBrowseFilters } = useApp()
  const openEvent = useEventNavigation()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [openPopover, setOpenPopover] = useState<FilterPopoverType>(null)
  const [openSheet, setOpenSheet] = useState<FilterSheetType>(null)
  const [viewMode, setViewMode] = useState<'list' | 'map'>(() => {
    if (location.pathname === '/map') return 'map'
    if (searchParams.get('view') === 'map') return 'map'
    return defaultViewMode
  })
  const [restoreSnapshot, setRestoreSnapshot] = useState<BrowseReturnSnapshot | null>(null)
  const skipViewModeSyncRef = useRef(false)
  const filterMenuOpen = openPopover !== null || openSheet !== null
  const browseControlsRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    const cityFromQuery = resolveCitySlugParam(searchParams.get('city'))
    if (!cityFromQuery) return

    setBrowseFilters({ ...DEFAULT_BROWSE_FILTERS, city: cityFromQuery, cityLocked: true })
  }, [searchParams, setBrowseFilters])

  useEffect(() => {
    const snapshot = consumeBrowseReturnSnapshot()
    if (!snapshot) return

    skipViewModeSyncRef.current = true

    if (snapshot.viewMode) {
      setViewMode(snapshot.viewMode)
    }

    setRestoreSnapshot(snapshot)

    requestAnimationFrame(() => {
      window.scrollTo({ top: snapshot.scrollY ?? 0, left: 0, behavior: 'instant' })
    })
  }, [])

  useEffect(() => {
    if (location.pathname === '/map') {
      setViewMode('map')
      return
    }

    if (location.pathname !== '/browse' && location.pathname !== '/browse-v2') return

    if (skipViewModeSyncRef.current) {
      skipViewModeSyncRef.current = false
      return
    }

    setViewMode(searchParams.get('view') === 'map' ? 'map' : 'list')
  }, [location.pathname, searchParams])

  useEffect(() => {
    if (location.pathname === '/map') {
      setPageTitle(formatDocumentTitle('Map'), '/map')
      return
    }

    if (location.pathname === '/browse-v2') {
      setPageTitle(
        viewMode === 'map'
          ? formatDocumentTitle('Map')
          : formatDocumentTitle('Browse Bay Area Activities'),
        '/browse-v2',
      )
      return
    }

    if (location.pathname !== '/browse') return

    setPageTitle(
      viewMode === 'map'
        ? formatDocumentTitle('Map')
        : formatDocumentTitle('Browse Bay Area Activities'),
      '/browse',
    )
  }, [location.pathname, viewMode])

  const requestNearbyLocation = useCallback(async () => {
    const nextCoords = await requestLocation()
    if (!nextCoords) {
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

  const mobileControlsCollapsed = useBrowseMobileControlsCollapse(!filterMenuOpen)

  useLayoutEffect(() => {
    const controls = browseControlsRef.current
    if (!controls) return

    const shell = controls.closest('.browse-page-shell') as HTMLElement | null

    const measure = () => {
      if (!window.matchMedia('(max-width: 767px)').matches) {
        shell?.style.removeProperty('--browse-band-height')
        return
      }

      const height = Math.ceil(controls.scrollHeight)
      if (height > 0) {
        shell?.style.setProperty('--browse-band-height', `${height}px`)
      }
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(controls)
    window.addEventListener('resize', measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [locationLabel, browseFilters, viewMode, showReset, events.length])

  const resultsSummary =
    resultsCountStyle === 'contextual'
      ? getBrowseResultsSummary(events.length, browseFilters.city, browseFilters.day)
      : `${events.length} ${getBrowseActivityNoun(events.length, browseFilters.day)}`

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
    setBrowseFilters(getResetBrowseFilters(browseFilters))
  }

  function tryAllCities() {
    trackCitySelected('all', 'browse')
    setBrowseFilters({ ...browseFilters, city: 'all', cityLocked: false })
  }

  function seeUpcomingEvents() {
    setBrowseFilters(getBrowseSeeUpcomingFilters(browseFilters, countBrowseEvents))
  }

  function handleViewModeChange(mode: 'list' | 'map') {
    if (mode !== viewMode) {
      trackViewModeChanged(mode)
    }
    setViewMode(mode)

    if (!isBrowseHubPath(location.pathname)) return

    const next = new URLSearchParams(searchParams)
    if (mode === 'map') {
      next.set('view', 'map')
    } else {
      next.delete('view')
    }
    setSearchParams(next, { replace: true })
  }

  const handleOpenListEvent = useCallback(
    (event: Parameters<typeof openEvent>[0]) => {
      openEvent(event, 'browse_list', { viewMode: 'list' })
    },
    [openEvent],
  )

  const handleOpenMapEvent = useCallback(
    (event: Parameters<typeof openEvent>[0], mapSnapshot?: BrowseMapOpenSnapshot) => {
      openEvent(event, 'browse_map', { viewMode: 'map', ...mapSnapshot })
    },
    [openEvent],
  )

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

  const listGridClassName =
    listLayout === 'compact-two-column'
      ? 'browse-event-grid browse-event-grid--compact-two-column'
      : 'browse-event-grid'
  const listCardVariant = listLayout === 'compact-two-column' ? 'compact-grid' : 'grid'

  return (
    <div
      className={[
        'browse-page-shell',
        shellClassName,
        mobileControlsCollapsed ? 'browse-page-shell--controls-collapsed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <AppHeader
        logoSrc={useHomeHeader ? PUDDLES_WORDMARK_LOGO_SRC : HOME_HEADER_LOGO_SRC}
        logoSrc2x={useHomeHeader ? PUDDLES_WORDMARK_LOGO_SRC_2X : undefined}
        showBrandName={false}
        below={
          <div
            className={[
              'browse-controls-band',
              mobileControlsCollapsed ? 'browse-controls-band--collapsed' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div ref={browseControlsRef} className="layout-container browse-controls relative">
            <div className="browse-controls-row">
              <div className="browse-location-row">
                <BrowseLocationPill label={locationLabel} onClick={openLocationFilter} />
              </div>

              <div className="browse-secondary-controls">
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
          restoreSnapshot={restoreSnapshot}
          onOpenEvent={handleOpenMapEvent}
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
                <div className={listGridClassName}>
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      variant={listCardVariant}
                      discovery
                      onClick={() => handleOpenListEvent(event)}
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
    </div>
  )
}

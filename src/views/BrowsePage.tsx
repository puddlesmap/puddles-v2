import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useLaunchStagingCatalog } from '../context/LaunchStagingContext'
import { ACTIVITY_TYPES, type Event } from '../types/event'
import { PUBLIC_AGE_FILTER_OPTIONS } from '../utils/ageRange'
import { BrowseEventCard } from '../components/BrowseEventCard'
import { FilterChipButton } from '../components/FilterChipButton'
import { FilterPopover, type FilterPopoverType } from '../components/FilterPopover'
import { FilterSheet, type FilterSheetType } from '../components/FilterSheet'
import { PageContainer } from '../components/layout/PageContainer'
import { Footer } from '../components/layout/Footer'
import { AppHeader } from '../components/layout/AppHeader'
import { BrowseLocationPill } from '../components/layout/BrowseLocationPill'
import {
  WhereWhenPillFilters,
  type WhereWhenCityValue,
} from '../components/filters/WhereWhenPillFilters'
import { getBrowseLocationLabel } from '../components/layout/BrandLockup'
import type { DayFilter, TimeFilter } from '../types/event'
import {
  formatSearchAnchorLocationLabel,
  type BrowseSearchAnchor,
} from '../utils/browseSearchAnchor'
import { formatShortDate } from '../utils/dates'
import { useApp } from '../context/AppContext'
import { BrowseEmptyState } from '../components/empty-states/BrowseEmptyState'
import { BrowseMapView } from '../components/browse/BrowseMapView'
import { useBrowseMobileControlsCollapse } from '../hooks/useBrowseMobileControlsCollapse'
import { useBrowseViewToggleSeparation } from '../hooks/useBrowseViewToggleSeparation'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useUserLocation } from '../hooks/useUserLocation'
import {
  DEFAULT_BROWSE_FILTERS,
  filterBrowseEventList,
  sortEventsBySchedule,
  getBrowseActivityChipLabel,
  getBrowseAgeChipLabel,
  getBrowseSeeUpcomingFilters,
  getResetBrowseFilters,
  isBrowseFiltersDefault,
  type BrowseFilters,
  type DiscoveryGate,
} from '../utils/filters'
import { formatNearbyContextLabel, NEARBY_RADIUS_MILES } from '../utils/geo'
import { trackCitySelected, trackViewModeChanged } from '../utils/analytics'
import {
  formatActivityCount,
  getBrowseActivityNoun,
  getBrowseResultsSummary,
} from '../utils/browseResultsCopy'
import {
  PUDDLES_WORDMARK_LOGO_SRC,
  PUDDLES_WORDMARK_LOGO_SRC_2X,
} from './experimentShared'
import { useEventNavigation } from '../hooks/useEventNavigation'
import { resolveCitySlugParam } from '../config/localRoutes'
import { browseShareParams, searchParamsEqual } from '../utils/browseShareParams'
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
  resultsCountStyle?: 'default' | 'contextual'
  mapInteractionMode?: 'default' | 'connected'
  defaultViewMode?: 'list' | 'map'
  listLayout?: 'default' | 'compact-two-column'
  experimentNote?: ReactNode
  getEventsCatalog?: () => Event[]
  discoveryGate?: DiscoveryGate
  buildEventDetailPath?: (event: Event) => string
  /** Card-only: append venue after the title. Live /browse stays off. */
  appendVenueToTitle?: boolean
  /** Card-only: append venue after date · time. Live /browse stays off. */
  appendVenueToWhen?: boolean
  /** Card-only: venue as its own line under the title. Live /browse stays off. */
  showVenueBelowTitle?: boolean
  /** Card-only: venue inline at 390px+, own line below 390. Live /browse stays off. */
  venueResponsive?: boolean
  /** Experiment: Where/When pill instead of location pill + Upcoming + Time chips. */
  filterVariant?: 'chips' | 'where-when-pill'
  /** Experiment: city/ZIP typeahead (~8 mi) + pick-a-date under Upcoming. */
  filterEnhancements?: boolean
}

function isBrowseHubPath(pathname: string): boolean {
  return pathname === '/browse' || pathname === '/browse-v2'
}

export function BrowsePage({
  shellClassName,
  resultsCountStyle = 'default',
  mapInteractionMode = 'default',
  defaultViewMode = 'list',
  listLayout = 'default',
  experimentNote,
  getEventsCatalog,
  discoveryGate = 'public',
  buildEventDetailPath,
  appendVenueToTitle = false,
  appendVenueToWhen = false,
  showVenueBelowTitle = false,
  venueResponsive = false,
  filterVariant = 'chips',
  filterEnhancements = false,
}: BrowsePageProps = {}) {
  const { browseFilters, setBrowseFilters } = useApp()
  const { getCatalog: getLaunchCatalog } = useLaunchStagingCatalog()
  const resolveCatalog = useCallback(
    () => (getEventsCatalog ? getEventsCatalog() : getLaunchCatalog()),
    [getEventsCatalog, getLaunchCatalog],
  )
  const navigate = useNavigate()
  const openEvent = useEventNavigation()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchParamsRef = useRef(searchParams)
  searchParamsRef.current = searchParams
  const shareWriteRef = useRef(false)
  const [shareReady, setShareReady] = useState(false)
  const [openPopover, setOpenPopover] = useState<FilterPopoverType>(null)
  const [openSheet, setOpenSheet] = useState<FilterSheetType>(null)
  const [viewMode, setViewMode] = useState<'list' | 'map'>(() => {
    if (location.pathname === '/map') return 'map'
    if (searchParams.get('view') === 'map') return 'map'
    return defaultViewMode
  })
  const [restoreSnapshot, setRestoreSnapshot] = useState<BrowseReturnSnapshot | null>(null)
  const [pickedYmd, setPickedYmd] = useState<string | null>(null)
  const [whereWhenOpen, setWhereWhenOpen] = useState(false)
  const [searchAnchor, setSearchAnchor] = useState<BrowseSearchAnchor | null>(null)
  const skipViewModeSyncRef = useRef(false)
  const useWhereWhenPill = filterVariant === 'where-when-pill'
  const useFilterEnhancements = filterEnhancements && !useWhereWhenPill
  const filterMenuOpen = openPopover !== null || openSheet !== null || whereWhenOpen
  const browseControlsRef = useRef<HTMLDivElement>(null)
  const secondaryControlsRowRef = useRef<HTMLDivElement>(null)
  const isMobileViewport = useMediaQuery('(max-width: 767px)')
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
    if (shareWriteRef.current) {
      shareWriteRef.current = false
      return
    }

    const cityFromQuery = resolveCitySlugParam(searchParams.get('city'))
    const activityFromQuery = searchParams.get('activity')
    const activityType = ACTIVITY_TYPES.find((type) => type === activityFromQuery)
    const ageFromQuery = searchParams.get('age')
    const age = PUBLIC_AGE_FILTER_OPTIONS.find((option) => option.key === ageFromQuery)?.key

    // Deep links (home announcement, seasonal chips, city landings) should land on a
    // clean filtered state — not inherit leftover day/time/type filters from prior browsing.
    if (cityFromQuery || activityType || age) {
      setBrowseFilters({
        ...DEFAULT_BROWSE_FILTERS,
        ...(cityFromQuery ? { city: cityFromQuery, cityLocked: true } : null),
        ...(activityType ? { types: [activityType] } : null),
        ...(age ? { age } : null),
      })
    }
    setShareReady(true)
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
    if (!shareReady || !isBrowseHubPath(location.pathname)) return

    const current = searchParamsRef.current
    const next = browseShareParams({
      pathname: location.pathname,
      city: browseFilters.city,
      age: browseFilters.age,
      types: browseFilters.types,
      viewMode,
      current,
    })
    if (searchParamsEqual(next, current)) return

    shareWriteRef.current = true
    setSearchParams(next, { replace: true })
  }, [
    browseFilters.age,
    browseFilters.city,
    browseFilters.types,
    location.pathname,
    setSearchParams,
    shareReady,
    viewMode,
  ])

  useEffect(() => {
    if (location.pathname === '/map') {
      setPageTitle(formatDocumentTitle('Map'), '/map', location.search)
      return
    }

    if (location.pathname === '/browse-v2') {
      setPageTitle(
        viewMode === 'map'
          ? formatDocumentTitle('Map')
          : formatDocumentTitle('Browse Bay Area Activities'),
        '/browse-v2',
        location.search,
      )
      return
    }

    if (location.pathname !== '/browse') return

    setPageTitle(
      viewMode === 'map'
        ? formatDocumentTitle('Map')
        : formatDocumentTitle('Browse Bay Area Activities'),
      '/browse',
      location.search,
    )
  }, [location.pathname, location.search, viewMode])

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
    const base = filterBrowseEventList({
      catalog: resolveCatalog(),
      browse: browseFilters,
      discoveryGate,
      pickedYmd,
      searchAnchor,
      coords,
    })

    return sortEventsBySchedule(base)
  }, [browseFilters, pickedYmd, searchAnchor, coords, discoveryGate, resolveCatalog])

  const getFilterSheetResultCount = useCallback(
    (draft: BrowseFilters, draftPickedYmd: string | null) =>
      filterBrowseEventList({
        catalog: resolveCatalog(),
        browse: draft,
        discoveryGate,
        pickedYmd: draftPickedYmd,
        searchAnchor,
        coords,
      }).length,
    [resolveCatalog, discoveryGate, searchAnchor, coords],
  )

  const awaitingNearby = browseFilters.city === 'nearby' && !coords && !searchAnchor
  const showReset =
    !isBrowseFiltersDefault(browseFilters) || Boolean(pickedYmd) || Boolean(searchAnchor)
  const locationLabel = searchAnchor
    ? formatSearchAnchorLocationLabel(searchAnchor)
    : getBrowseLocationLabel(browseFilters.city)

  const mobileControlsCollapsed = useBrowseMobileControlsCollapse(!filterMenuOpen)
  const viewToggleSeparated = useBrowseViewToggleSeparation(secondaryControlsRowRef, [
    locationLabel,
    browseFilters,
    showReset,
    events.length,
  ])

  useLayoutEffect(() => {
    const controls = browseControlsRef.current
    if (!controls) return

    const shell = controls.closest('.browse-page-shell') as HTMLElement | null
    const headerRow = shell?.querySelector('.app-header-row') as HTMLElement | null

    const measure = () => {
      if (!window.matchMedia('(max-width: 767px)').matches) {
        shell?.style.removeProperty('--browse-band-height')
        shell?.style.removeProperty('--browse-mobile-header-offset')
        return
      }

      const height = Math.ceil(controls.scrollHeight)
      if (height > 0) {
        shell?.style.setProperty('--browse-band-height', `${height}px`)
      }

      if (headerRow) {
        const offset = Math.ceil(headerRow.getBoundingClientRect().height)
        if (offset > 0) {
          shell?.style.setProperty('--browse-mobile-header-offset', `${offset}px`)
        }
      }
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(controls)
    if (headerRow) observer.observe(headerRow)
    window.addEventListener('resize', measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [locationLabel, browseFilters, viewMode, showReset, events.length])

  const nearbyContextLabel =
    browseFilters.city === 'nearby' && coords && !searchAnchor
      ? formatNearbyContextLabel(NEARBY_RADIUS_MILES)
      : null

  const resultsSummary =
    resultsCountStyle === 'contextual'
      ? getBrowseResultsSummary(events.length, browseFilters.city, browseFilters.day, {
          pickedYmd,
          nearbyContextLabel,
        })
      : [
          `${events.length} ${getBrowseActivityNoun(events.length, browseFilters.day, { pickedYmd })}`,
          nearbyContextLabel,
        ]
          .filter(Boolean)
          .join(' · ')

  const mobileResultsLabel = awaitingNearby
    ? null
    : nearbyContextLabel
      ? `${formatActivityCount(events.length)} · ${nearbyContextLabel}.`
      : `${formatActivityCount(events.length)}.`

  const listResultsLabel = awaitingNearby
    ? null
    : isMobileViewport
      ? mobileResultsLabel
      : resultsSummary

  const detachedViewToggle = (
    <BrowseViewToggle
      viewMode={viewMode}
      onChange={handleViewModeChange}
      className="browse-view-toggle-floating"
    />
  )

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
        searchAnchor?.lat ?? '',
        searchAnchor?.lng ?? '',
        pickedYmd ?? '',
        viewMode,
      ].join('|'),
    [browseFilters, coords, searchAnchor, pickedYmd, viewMode],
  )

  function countBrowseEvents(filters: BrowseFilters) {
    return filterBrowseEventList({
      catalog: resolveCatalog(),
      browse: filters,
      discoveryGate,
      searchAnchor,
      coords,
    }).length
  }

  function resetFilters() {
    setPickedYmd(null)
    setSearchAnchor(null)
    setBrowseFilters(getResetBrowseFilters(browseFilters))
  }

  function handleSearchAnchor(anchor: BrowseSearchAnchor | null) {
    setSearchAnchor(anchor)
    if (anchor) {
      setBrowseFilters({
        ...browseFilters,
        city: 'all',
        cityLocked: true,
      })
      trackCitySelected('nearby', 'browse')
    }
  }

  function handleMapSearchHere(anchor: BrowseSearchAnchor) {
    handleSearchAnchor(anchor)
  }

  function handleClearGeoBoundary() {
    setSearchAnchor(null)
    trackCitySelected('all', 'browse')
    setBrowseFilters({ ...browseFilters, city: 'all', cityLocked: false })
  }

  const showMapClearBoundary = Boolean(searchAnchor) || browseFilters.city !== 'all'

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
  }

  const handleOpenListEvent = useCallback(
    (event: Parameters<typeof openEvent>[0]) => {
      if (buildEventDetailPath) {
        navigate(buildEventDetailPath(event), {
          state: {
            fromApp: true,
            eventOpenSource: 'browse_list',
            returnTo: `${location.pathname}${location.search}${location.hash}`,
          },
        })
        return
      }

      openEvent(event, 'browse_list', { viewMode: 'list' })
    },
    [buildEventDetailPath, location, navigate, openEvent],
  )

  const handleOpenMapEvent = useCallback(
    (event: Parameters<typeof openEvent>[0], mapSnapshot?: BrowseMapOpenSnapshot) => {
      if (buildEventDetailPath) {
        navigate(buildEventDetailPath(event), {
          state: {
            fromApp: true,
            eventOpenSource: 'browse_map',
            returnTo: `${location.pathname}${location.search}${location.hash}`,
            ...mapSnapshot,
          },
        })
        return
      }

      openEvent(event, 'browse_map', { viewMode: 'map', ...mapSnapshot })
    },
    [buildEventDetailPath, location, navigate, openEvent],
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
    ...(useWhereWhenPill
      ? []
      : [
          {
            key: 'day' as const,
            label: pickedYmd
              ? formatShortDate(new Date(`${pickedYmd}T12:00:00`))
              : browseFilters.day !== 'anytime'
                ? DAY_LABELS[browseFilters.day]
                : 'Upcoming',
            active: Boolean(pickedYmd) || browseFilters.day !== 'anytime',
          },
          {
            key: 'time' as const,
            label: browseFilters.time !== 'any' ? TIME_LABELS[browseFilters.time] : 'Time',
            active: browseFilters.time !== 'any',
          },
        ]),
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

  function handleWhereWhenWhere(key: WhereWhenCityValue) {
    if (key === 'nearby') {
      setBrowseFilters({ ...browseFilters, city: 'nearby', cityLocked: true })
      trackCitySelected('nearby', 'browse')
      void requestNearbyLocation()
      return
    }
    setBrowseFilters({
      ...browseFilters,
      city: key,
      cityLocked: key !== 'all',
    })
    trackCitySelected(key === 'all' ? 'all' : key, 'browse')
  }

  function handleWhereWhenDay(key: DayFilter | string) {
    setPickedYmd(null)
    setBrowseFilters({ ...browseFilters, day: key as DayFilter })
  }

  function handleWhereWhenTime(key: TimeFilter) {
    setBrowseFilters({ ...browseFilters, time: key })
  }

  const whereWhenWhereKey = (
    ['nearby', 'all', 'other', 'Palo Alto', 'Los Altos', 'Mountain View', 'Sunnyvale'].includes(
      browseFilters.city,
    )
      ? browseFilters.city
      : 'all'
  ) as WhereWhenCityValue

  const secondaryControls = (
    <div ref={secondaryControlsRowRef} className="browse-secondary-controls-row">
      <div className="browse-filter-chips-scroll">
        <div className="browse-filter-chips">
          <FilterChipButton
            label="Seasonal"
            active={browseFilters.seasonal}
            onClick={() =>
              setBrowseFilters({ ...browseFilters, seasonal: !browseFilters.seasonal })
            }
          />
          <FilterChipButton
            label="Free"
            active={browseFilters.free}
            onClick={() => setBrowseFilters({ ...browseFilters, free: !browseFilters.free })}
          />
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
      {!viewToggleSeparated ? (
        <BrowseViewToggle
          viewMode={viewMode}
          onChange={handleViewModeChange}
          className="browse-view-toggle-inline"
        />
      ) : null}
    </div>
  )

  const listGridClassName =
    listLayout === 'compact-two-column'
      ? 'browse-event-grid browse-event-grid--compact-two-column'
      : 'browse-event-grid'
  return (
    <div
      className={[
        'browse-page-shell',
        shellClassName,
        mobileControlsCollapsed ? 'browse-page-shell--controls-collapsed' : '',
        viewToggleSeparated ? 'browse-page-shell--view-toggle-separated' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
        below={
            <div
            className={[
              'browse-controls-band',
              mobileControlsCollapsed ? 'browse-controls-band--collapsed' : '',
              whereWhenOpen ? 'browse-controls-band--where-when-open' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div ref={browseControlsRef} className="layout-container browse-controls relative">
            <div className="browse-controls-row">
              <div className="browse-location-row">
                {useWhereWhenPill ? (
                  <WhereWhenPillFilters
                    surface="browse"
                    whereKey={whereWhenWhereKey}
                    dayKey={browseFilters.day}
                    timeKey={browseFilters.time}
                    pickedYmd={pickedYmd}
                    onWhereSelect={handleWhereWhenWhere}
                    onDaySelect={handleWhereWhenDay}
                    onTimeSelect={handleWhereWhenTime}
                    onPickDate={setPickedYmd}
                    onClearPickedDate={() => setPickedYmd(null)}
                    onOpenChange={setWhereWhenOpen}
                  />
                ) : (
                  <BrowseLocationPill label={locationLabel} onClick={openLocationFilter} />
                )}
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
              filterEnhancements={useFilterEnhancements}
              searchAnchorLabel={searchAnchor?.label ?? null}
              onSearchAnchor={handleSearchAnchor}
              pickedYmd={pickedYmd}
              onPickDate={setPickedYmd}
              onClearPickedDate={() => setPickedYmd(null)}
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
        filterEnhancements={useFilterEnhancements}
        searchAnchorLabel={searchAnchor?.label ?? null}
        onSearchAnchor={handleSearchAnchor}
        pickedYmd={pickedYmd}
        onPickDate={setPickedYmd}
        onClearPickedDate={() => setPickedYmd(null)}
        getResultCount={getFilterSheetResultCount}
      />

      {viewMode === 'map' && events.length > 0 && !awaitingNearby ? (
        <BrowseMapView
          events={events}
          feedKey={feedKey}
          browseFilters={browseFilters}
          interactionMode={mapInteractionMode}
          restoreSnapshot={restoreSnapshot}
          onOpenEvent={handleOpenMapEvent}
          detachedViewToggle={viewToggleSeparated ? detachedViewToggle : null}
          venueResponsive={venueResponsive}
          onSearchHere={handleMapSearchHere}
          showClearBoundary={showMapClearBoundary}
          onClearGeoBoundary={handleClearGeoBoundary}
        />
      ) : (
        <div className="browse-page-body">
          <PageContainer layout="wide" className="browse-content">
            {viewToggleSeparated ? (
              <div className="browse-results-toolbar">
                <p className="browse-results-count">{listResultsLabel}</p>
                <BrowseViewToggle
                  viewMode={viewMode}
                  onChange={handleViewModeChange}
                  className="browse-view-toggle-toolbar"
                />
              </div>
            ) : (
              <p className="browse-results-count">{listResultsLabel}</p>
            )}

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
                    <BrowseEventCard
                      key={event.id}
                      event={event}
                      onClick={() => handleOpenListEvent(event)}
                      appendVenueToTitle={appendVenueToTitle}
                      appendVenueToWhen={appendVenueToWhen}
                      showVenueBelowTitle={showVenueBelowTitle}
                      venueResponsive={venueResponsive}
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

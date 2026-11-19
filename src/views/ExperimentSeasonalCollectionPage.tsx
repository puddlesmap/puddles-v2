import type { CSSProperties, ReactNode } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { partitionSeasonalTiming } from '../utils/seasonalWeekendBuckets'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { PageContainer } from '../components/layout/PageContainer'
import { BrowseEventCard } from '../components/BrowseEventCard'
import { FilterPopover, type FilterPopoverType } from '../components/FilterPopover'
import { FilterSheet, type FilterSheetType } from '../components/FilterSheet'
import { getBrowseLocationLabel } from '../components/layout/BrandLockup'
import { SeasonalEmDashTagline } from '../components/seasonal/SeasonalDiscoveryModuleHeader'
import type { Event } from '../types/event'
import {
  getActiveSeasonalCollection,
  getSeasonalCollection,
  isSeasonalCollectionSlug,
  resolveSeasonalEvents,
  type SeasonalCollection,
} from '../data/seasonalDiscovery'
import {
  sortSeasonalDiscoveryEvents,
  spannedScheduleMatchesWhen,
} from '../utils/formatSeasonalSchedule'
import {
  PUDDLES_WORDMARK_LOGO_SRC,
  PUDDLES_WORDMARK_LOGO_SRC_2X,
} from './experimentShared'
import {
  LocalGuideCardVariant,
  parseGuideCard,
} from '../components/guides/LocalGuideCard'
import { HolidayMagicGuidesPanel } from '../components/guides/HolidayMagicGuidesPanel'
import { HolidayOutingRowsSection } from '../components/seasonal/HolidayOutingRowsSection'
import { useLaunchStagingCatalog } from '../context/LaunchStagingContext'
import { resolveSeasonalReturnTarget } from '../utils/seasonalReturnNav'
import './guide-page.css'
import { useEventNavigation } from '../hooks/useEventNavigation'
import { useUserLocation } from '../hooks/useUserLocation'
import {
  DEFAULT_BROWSE_FILTERS,
  type BrowseFilters,
} from '../utils/filters'
import {
  formatSearchAnchorLocationLabel,
  type BrowseSearchAnchor,
} from '../utils/browseSearchAnchor'
import { formatShortDate, getAnchorDate } from '../utils/dates'
import { eventMatchesDayFilter, eventMatchesTimeFilter } from '../utils/eventSessions'
import { matchesBrowseCityFilter } from '../utils/cityRegions'
import { BrowseLocationPill } from '../components/layout/BrowseLocationPill'
import { FilterChipButton } from '../components/FilterChipButton'
import './browse-page.css'
import { eventMatchesPickedYmd } from '../utils/pickedDate'
import {
  NEARBY_RADIUS_MILES,
  filterEventsByRadius,
} from '../utils/geo'
import { getBrowseResultsSummary } from '../utils/browseResultsCopy'
import { trackCitySelected } from '../utils/analytics'

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

const DEFAULT_EVENTS_HEADING = 'Explore the events'

function applyHolidayTypeaheadFilters(
  events: Event[],
  browseFilters: BrowseFilters,
  pickedYmd: string | null,
  searchAnchor: BrowseSearchAnchor | null,
  coords: { lat: number; lng: number } | null,
): Event[] {
  const anchor = getAnchorDate()
  const now = new Date()
  const day = pickedYmd ? ('anytime' as const) : browseFilters.day
  const city = searchAnchor ? 'all' : browseFilters.city

  let next = events.filter((event) => {
    if (!matchesBrowseCityFilter(event.city, city)) return false
    if (!eventMatchesTimeFilter(event, browseFilters.time)) return false
    if (pickedYmd) return eventMatchesPickedYmd(event, pickedYmd)
    return (
      eventMatchesDayFilter(event, day, anchor, now) ||
      spannedScheduleMatchesWhen(event, day, anchor, now)
    )
  })

  if (searchAnchor) {
    next = filterEventsByRadius(next, searchAnchor, NEARBY_RADIUS_MILES)
  } else if (browseFilters.city === 'nearby' && coords) {
    next = filterEventsByRadius(next, coords, NEARBY_RADIUS_MILES)
  }

  return next
}

/** Soft night-sky sparkles for the Halloween collection page. */
const HALLOWEEN_SPARKLES = [
  { top: '8%', left: '6%', size: 2, delay: '0s', duration: '2.8s' },
  { top: '12%', left: '22%', size: 3, delay: '0.4s', duration: '3.4s' },
  { top: '5%', left: '41%', size: 2, delay: '1.1s', duration: '2.6s' },
  { top: '18%', left: '58%', size: 4, delay: '0.2s', duration: '3.8s' },
  { top: '9%', left: '74%', size: 2, delay: '1.6s', duration: '2.9s' },
  { top: '14%', left: '88%', size: 3, delay: '0.8s', duration: '3.2s' },
  { top: '28%', left: '12%', size: 2, delay: '1.3s', duration: '3.1s' },
  { top: '34%', left: '33%', size: 3, delay: '0.6s', duration: '2.7s' },
  { top: '26%', left: '49%', size: 2, delay: '2s', duration: '3.5s' },
  { top: '38%', left: '67%', size: 4, delay: '0.9s', duration: '4s' },
  { top: '31%', left: '84%', size: 2, delay: '1.8s', duration: '2.5s' },
  { top: '48%', left: '8%', size: 3, delay: '0.3s', duration: '3.3s' },
  { top: '52%', left: '27%', size: 2, delay: '1.4s', duration: '2.8s' },
  { top: '56%', left: '46%', size: 3, delay: '0.7s', duration: '3.6s' },
  { top: '44%', left: '71%', size: 2, delay: '1.9s', duration: '3s' },
  { top: '60%', left: '91%', size: 4, delay: '0.5s', duration: '3.9s' },
  { top: '72%', left: '15%', size: 2, delay: '1.2s', duration: '2.9s' },
  { top: '78%', left: '38%', size: 3, delay: '0.1s', duration: '3.4s' },
  { top: '68%', left: '55%', size: 2, delay: '1.7s', duration: '2.6s' },
  { top: '82%', left: '76%', size: 3, delay: '0.95s', duration: '3.7s' },
  { top: '88%', left: '4%', size: 2, delay: '1.5s', duration: '3.1s' },
  { top: '91%', left: '63%', size: 4, delay: '0.35s', duration: '4.1s' },
  { top: '86%', left: '94%', size: 2, delay: '2.1s', duration: '2.7s' },
  { top: '42%', left: '18%', size: 2, delay: '2.3s', duration: '3.2s' },
] as const

function SeasonalEventGrid({
  events,
  onEventClick,
  label,
}: {
  events: Event[]
  onEventClick: (event: Event) => void
  label: string
}) {
  if (events.length === 0) return null

  return (
    <div className="browse-content seasonal-collection-results" aria-label={label}>
      <div className="seasonal-collection-grid browse-event-grid">
        {events.map((event) => (
          <BrowseEventCard
            key={event.id}
            event={event}
            seasonalEditorial={false}
            venueResponsive
            onClick={() => onEventClick(event)}
          />
        ))}
      </div>
    </div>
  )
}

type GeoTab = 'close' | 'drive'

function TimingGroups({
  events,
  onEventClick,
  geoLabel,
  hideTimingLabels = false,
}: {
  events: Event[]
  onEventClick: (event: Event) => void
  geoLabel: string
  /** Skip This week / Later headings (flat list under the geo band). */
  hideTimingLabels?: boolean
}) {
  const { thisWeek, later } = useMemo(() => partitionSeasonalTiming(events), [events])

  if (events.length === 0) {
    return <p className="seasonal-density-empty">No activities in this section right now.</p>
  }

  if (hideTimingLabels) {
    return (
      <SeasonalEventGrid events={events} onEventClick={onEventClick} label={geoLabel} />
    )
  }

  return (
    <>
      {thisWeek.length > 0 ? (
        <section className="seasonal-density-group" aria-label={`${geoLabel} · This week`}>
          <h3 className="seasonal-density-group__title">This week</h3>
          <SeasonalEventGrid
            events={thisWeek}
            onEventClick={onEventClick}
            label={`${geoLabel} this week`}
          />
        </section>
      ) : null}
      {later.length > 0 ? (
        <section className="seasonal-density-group" aria-label={`${geoLabel} · Later`}>
          <h3 className="seasonal-density-group__title">Later</h3>
          <SeasonalEventGrid
            events={later}
            onEventClick={onEventClick}
            label={`${geoLabel} later`}
          />
        </section>
      ) : null}
    </>
  )
}

function CollectionGeoTabs({
  collection,
  closeToHomeEvents,
  driveEvents,
  onEventClick,
  id,
  afterTabs,
  hideTimingLabels = false,
  bandHeadingLevel = 'h2',
}: {
  collection: SeasonalCollection
  closeToHomeEvents: Event[]
  driveEvents: Event[]
  onEventClick: (event: Event) => void
  id?: string
  /** Mobile-only filter row rendered under the geo toggle. */
  afterTabs?: ReactNode
  hideTimingLabels?: boolean
  /** When a parent section already has the Explore h2, demote geo labels to h3. */
  bandHeadingLevel?: 'h2' | 'h3'
}) {
  const BandTitle = bandHeadingLevel
  const closeToHome = collection.closeToHome!
  const worthADrive = collection.worthADrive!
  const showDriveTab = driveEvents.length > 0
  const [tab, setTab] = useState<GeoTab>('close')
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)
  const activeTab = tab === 'drive' && showDriveTab ? 'drive' : 'close'
  const events = activeTab === 'drive' ? driveEvents : closeToHomeEvents
  const geoLabel = activeTab === 'drive' ? worthADrive.title : closeToHome.title
  const subtitle = activeTab === 'drive' ? worthADrive.subtitle : closeToHome.subtitle

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const rootPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    const offset = Math.round(rootPx * 3.75)
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { rootMargin: `-${offset}px 0px 0px 0px`, threshold: 0 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [showDriveTab])

  return (
    <div id={id} className="seasonal-collection-sections seasonal-collection-events">
      {showDriveTab ? (
        <>
          <div ref={sentinelRef} className="seasonal-density-tabs__sentinel" aria-hidden="true" />
          <div
            className={`seasonal-density-tabs seasonal-density-tabs--mobile seasonal-density-tabs--fall-frost${stuck ? ' is-stuck' : ''}`}
          >
            <div className="seasonal-density-tabs__list" role="tablist" aria-label="Seasonal areas">
              <button
                type="button"
                role="tab"
                id="seasonal-density-tab-close"
                aria-selected={activeTab === 'close'}
                aria-controls="seasonal-density-tab-panel"
                className="seasonal-density-tabs__tab"
                onClick={() => setTab('close')}
              >
                {closeToHome.title}
              </button>
              <button
                type="button"
                role="tab"
                id="seasonal-density-tab-drive"
                aria-selected={activeTab === 'drive'}
                aria-controls="seasonal-density-tab-panel"
                className="seasonal-density-tabs__tab"
                onClick={() => setTab('drive')}
              >
                {worthADrive.title}
              </button>
            </div>
          </div>
          {afterTabs}
        </>
      ) : afterTabs ? (
        <div className="seasonal-typeahead-filters seasonal-typeahead-filters--mobile-only">
          {afterTabs}
        </div>
      ) : null}

      <div
        className="seasonal-density-mobile-panel"
        id="seasonal-density-tab-panel"
        role="tabpanel"
        aria-labelledby={
          activeTab === 'drive' ? 'seasonal-density-tab-drive' : 'seasonal-density-tab-close'
        }
      >
        <header className="seasonal-collection-band__header">
          <BandTitle className="seasonal-collection-band__title">{geoLabel}</BandTitle>
          <p className="seasonal-collection-band__subtitle">{subtitle}</p>
        </header>
        <TimingGroups
          events={events}
          onEventClick={onEventClick}
          geoLabel={geoLabel}
          hideTimingLabels={hideTimingLabels}
        />
      </div>

      {showDriveTab ? (
        <div className="seasonal-density-desktop-stack">
          <section className="seasonal-collection-band" aria-labelledby="seasonal-close-to-home-heading">
            <header className="seasonal-collection-band__header">
              <BandTitle id="seasonal-close-to-home-heading" className="seasonal-collection-band__title">
                {closeToHome.title}
              </BandTitle>
              <p className="seasonal-collection-band__subtitle">{closeToHome.subtitle}</p>
            </header>
            <TimingGroups
              events={closeToHomeEvents}
              onEventClick={onEventClick}
              geoLabel={closeToHome.title}
              hideTimingLabels={hideTimingLabels}
            />
          </section>
          <section
            className="seasonal-collection-band seasonal-collection-band--secondary"
            aria-labelledby="seasonal-worth-a-drive-heading"
          >
            <header className="seasonal-collection-band__header">
              <BandTitle id="seasonal-worth-a-drive-heading" className="seasonal-collection-band__title">
                {worthADrive.title}
              </BandTitle>
              <p className="seasonal-collection-band__subtitle">{worthADrive.subtitle}</p>
            </header>
            <TimingGroups
              events={driveEvents}
              onEventClick={onEventClick}
              geoLabel={worthADrive.title}
              hideTimingLabels={hideTimingLabels}
            />
          </section>
        </div>
      ) : null}
    </div>
  )
}

export function SeasonalActivePage() {
  const active = getActiveSeasonalCollection()
  if (!active) return <Navigate to="/" replace />
  return <ExperimentSeasonalCollectionPage slug={active.slug} />
}

export type HolidayMagicSkin = 'reverse' | 'lighten'

export type HolidayEventsLayout = 'default' | 'outing-rows'

export function ExperimentSeasonalCollectionPage({
  slug: slugProp,
  typeaheadFilters: typeaheadFiltersProp = false,
  skin: skinProp = 'lighten',
  eventsHeading: eventsHeadingProp,
  eventsLayout: eventsLayoutProp = 'default',
}: {
  slug?: string
  /** Browse-style city/ZIP typeahead + pick-a-date (opt-in via prop; off for holiday-magic for now). */
  typeaheadFilters?: boolean
  /** Holiday Magic visual skin. Live hub uses `lighten`; pass `reverse` to compare the prior dark page. */
  skin?: HolidayMagicSkin
  /** Section title before the event list — same hierarchy as “Explore the guides”. */
  eventsHeading?: string
  /** Replace geo tabs / full grids with capped horizontal outing rows (mockup). */
  eventsLayout?: HolidayEventsLayout
} = {}) {
  const params = useParams()
  const location = useLocation()
  const seasonalReturn = useMemo(
    () => resolveSeasonalReturnTarget(location.state),
    [location.state],
  )
  const guideCardVariant = parseGuideCard(new URLSearchParams(location.search).get('card'))
  const slug = slugProp ?? params.slug
  const openEvent = useEventNavigation()
  const { getCatalog } = useLaunchStagingCatalog()
  const validSlug = isSeasonalCollectionSlug(slug) ? slug : null
  const collection = validSlug ? getSeasonalCollection(validSlug) : undefined
  const typeaheadFilters = typeaheadFiltersProp
  const eventsLayout = eventsLayoutProp
  /** Live Holiday Magic hub uses outing rows; filters mockup keeps the typed list. */
  const showOutingRows =
    slug === 'holiday-magic' &&
    (eventsLayout === 'outing-rows' || (eventsLayout === 'default' && !typeaheadFiltersProp))
  const eventsHeading =
    eventsHeadingProp ?? (typeaheadFiltersProp ? DEFAULT_EVENTS_HEADING : undefined)
  const { coords, requestLocation } = useUserLocation()
  const [browseFilters, setBrowseFilters] = useState<BrowseFilters>(DEFAULT_BROWSE_FILTERS)
  const [pickedYmd, setPickedYmd] = useState<string | null>(null)
  const [searchAnchor, setSearchAnchor] = useState<BrowseSearchAnchor | null>(null)
  const [openPopover, setOpenPopover] = useState<FilterPopoverType>(null)
  const [openSheet, setOpenSheet] = useState<FilterSheetType>(null)

  const closeToHomeEventsRaw = useMemo(() => {
    if (!collection) return []
    const driveIds = new Set(collection.driveEventIds ?? [])
    const closeIds = collection.collectionEventIds.filter((id) => !driveIds.has(id))
    return sortSeasonalDiscoveryEvents(resolveSeasonalEvents(closeIds, getCatalog()))
  }, [collection, getCatalog])

  const driveEventsRaw = useMemo(
    () =>
      collection?.driveEventIds?.length
        ? sortSeasonalDiscoveryEvents(
            resolveSeasonalEvents(collection.driveEventIds, getCatalog()),
          )
        : [],
    [collection, getCatalog],
  )

  const closeToHomeEvents = useMemo(() => {
    if (!typeaheadFilters) return closeToHomeEventsRaw
    return applyHolidayTypeaheadFilters(
      closeToHomeEventsRaw,
      browseFilters,
      pickedYmd,
      searchAnchor,
      coords,
    )
  }, [
    typeaheadFilters,
    closeToHomeEventsRaw,
    browseFilters,
    pickedYmd,
    searchAnchor,
    coords,
  ])

  const driveEvents = useMemo(() => {
    if (!typeaheadFilters) return driveEventsRaw
    return applyHolidayTypeaheadFilters(
      driveEventsRaw,
      browseFilters,
      pickedYmd,
      searchAnchor,
      coords,
    )
  }, [typeaheadFilters, driveEventsRaw, browseFilters, pickedYmd, searchAnchor, coords])

  const getFilterSheetResultCount = useCallback(
    (draft: BrowseFilters, draftPickedYmd: string | null) => {
      const pool = [...closeToHomeEventsRaw, ...driveEventsRaw]
      return applyHolidayTypeaheadFilters(
        pool,
        draft,
        draftPickedYmd,
        searchAnchor,
        coords,
      ).length
    },
    [closeToHomeEventsRaw, driveEventsRaw, searchAnchor, coords],
  )

  const filteredTotal = closeToHomeEvents.length + driveEvents.length

  useEffect(() => {
    const hash = location.hash || window.location.hash
    if (hash !== '#events') return
    document.getElementById('events')?.scrollIntoView({ block: 'start' })
  }, [location.hash, collection])

  const requestNearbyLocation = useCallback(async () => {
    const nextCoords = await requestLocation()
    return Boolean(nextCoords)
  }, [requestLocation])

  function handleSearchAnchor(anchor: BrowseSearchAnchor | null) {
    setSearchAnchor(anchor)
    if (anchor) {
      setBrowseFilters((prev) => ({ ...prev, city: 'all', cityLocked: false }))
    }
  }

  function openLocationFilter() {
    setOpenPopover(null)
    if (isDesktopViewport()) setOpenPopover('location')
    else setOpenSheet('location')
  }

  function openDayFilter() {
    setOpenPopover(null)
    if (isDesktopViewport()) setOpenPopover('day')
    else setOpenSheet('day')
  }

  function openTimeFilter() {
    setOpenPopover(null)
    if (isDesktopViewport()) setOpenPopover('time')
    else setOpenSheet('time')
  }

  function resetTypeaheadFilters() {
    setBrowseFilters(DEFAULT_BROWSE_FILTERS)
    setPickedYmd(null)
    setSearchAnchor(null)
  }

  if (!validSlug || !collection) {
    return <Navigate to="/" replace />
  }

  const todayPacific = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  const isExperimentPreview = location.pathname.startsWith('/experiment/')
  if (
    collection.slug === 'holiday-magic' &&
    todayPacific < collection.activeFrom &&
    !isExperimentPreview
  ) {
    return <Navigate to="/" replace />
  }

  const isHalloween = collection.slug === 'halloween-with-little-ones'
  const isHelloFall = collection.slug === 'hello-fall'
  const isHoliday = collection.slug === 'holiday-magic'
  const holidaySkin: HolidayMagicSkin = isHoliday ? skinProp : 'reverse'
  const holidayShellClass =
    holidaySkin === 'lighten'
      ? 'home-experiment-shell--holiday-magic home-experiment-shell--holiday-magic-lighten'
      : 'home-experiment-shell--holiday-magic home-experiment-shell--holiday-magic-reverse'
  const holidayPageClass =
    holidaySkin === 'lighten'
      ? 'seasonal-collection-page--holiday-magic seasonal-collection-page--holiday-magic-lighten'
      : 'seasonal-collection-page--holiday-magic seasonal-collection-page--holiday-magic-reverse'
  const hasGeographicSections = Boolean(collection.closeToHome && collection.worthADrive)
  const supportingLine =
    collection.slug === 'hello-fall' ||
    collection.slug === 'halloween-with-little-ones' ||
    collection.slug === 'holiday-magic'
      ? undefined
      : collection.title
  const showDescription = Boolean(collection.description)
  const showTypeahead = typeaheadFilters && isHoliday
  const locationLabel = searchAnchor
    ? formatSearchAnchorLocationLabel(searchAnchor)
    : getBrowseLocationLabel(browseFilters.city)
  const dayChipLabel = pickedYmd
    ? formatShortDate(new Date(`${pickedYmd}T12:00:00`))
    : browseFilters.day !== 'anytime'
      ? DAY_LABELS[browseFilters.day]
      : 'Upcoming'
  const timeChipLabel =
    browseFilters.time !== 'any' ? TIME_LABELS[browseFilters.time] : TIME_LABELS.any
  const showReset =
    showTypeahead &&
    (browseFilters.city !== 'all' ||
      browseFilters.day !== 'anytime' ||
      browseFilters.time !== 'any' ||
      Boolean(pickedYmd) ||
      Boolean(searchAnchor))
  const resultsSummary = getBrowseResultsSummary(
    filteredTotal,
    browseFilters.city,
    browseFilters.day,
    { pickedYmd },
  )

  const browseStyleFilters = showTypeahead ? (
    <div className="hmg-events-filters browse-controls relative">
      <div className="browse-controls-row" role="group" aria-label="Location, date, and time filters">
        <div className="browse-location-row">
          <BrowseLocationPill label={locationLabel} onClick={openLocationFilter} />
        </div>
        <div className="browse-secondary-controls">
          <div className="browse-secondary-controls-row">
            <div className="browse-filter-chips-scroll">
              <div className="browse-filter-chips">
                <FilterChipButton
                  label={dayChipLabel}
                  active={browseFilters.day !== 'anytime' || Boolean(pickedYmd)}
                  onClick={openDayFilter}
                />
                <FilterChipButton
                  label={timeChipLabel}
                  active={browseFilters.time !== 'any'}
                  onClick={openTimeFilter}
                />
                {showReset ? (
                  <button
                    type="button"
                    onClick={resetTypeaheadFilters}
                    className="browse-reset-link"
                  >
                    Reset
                  </button>
                ) : null}
              </div>
            </div>
            <p className="hmg-events-filters__count" aria-live="polite">
              {resultsSummary}
            </p>
          </div>
        </div>
      </div>
      <FilterPopover
        filters={browseFilters}
        onApply={(next) => {
          setBrowseFilters(next)
          trackCitySelected(next.city, 'browse')
        }}
        open={openPopover}
        onClose={() => setOpenPopover(null)}
        hasNearbyCoords={Boolean(coords)}
        onRequestNearby={requestNearbyLocation}
        filterEnhancements
        searchAnchorLabel={searchAnchor?.label ?? null}
        onSearchAnchor={handleSearchAnchor}
        pickedYmd={pickedYmd}
        onPickDate={setPickedYmd}
        onClearPickedDate={() => setPickedYmd(null)}
      />
    </div>
  ) : null

  return (
    <div
      className={[
        'home-experiment-shell',
        'home-experiment-shell--refined',
        isHelloFall ? 'home-experiment-shell--hello-fall-collection home-experiment-shell--seasonal-puddles-aligned' : '',
        isHalloween ? 'home-experiment-shell--halloween-night' : '',
        isHoliday ? holidayShellClass : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        isHelloFall
          ? ({
              '--seasonal-accent-bg': collection.accent.background,
              '--seasonal-accent-eyebrow': collection.accent.eyebrow,
              '--seasonal-accent-border': collection.accent.border,
              '--seasonal-accent-glow': collection.accent.glow,
              '--seasonal-accent-title': collection.accent.title,
              '--seasonal-accent-description': collection.accent.description,
              '--seasonal-accent-cta': collection.accent.cta,
            } as CSSProperties)
          : undefined
      }
    >
      {isHalloween ? (
        <div className="halloween-sparkles" aria-hidden>
          {HALLOWEEN_SPARKLES.map((sparkle, index) => (
            <span
              key={index}
              className="halloween-sparkles__star"
              style={
                {
                  top: sparkle.top,
                  left: sparkle.left,
                  width: sparkle.size,
                  height: sparkle.size,
                  '--sparkle-delay': sparkle.delay,
                  '--sparkle-duration': sparkle.duration,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ) : null}

      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />

      <PageContainer
        className={[
          'seasonal-collection-page',
          'home-experiment-page--refined',
          'layout-container',
          isHelloFall ? 'seasonal-collection-page--hello-fall' : '',
          isHalloween ? 'seasonal-collection-page--halloween' : '',
          isHoliday ? holidayPageClass : '',
          hasGeographicSections ? 'seasonal-collection-page--split' : '',
          showTypeahead ? 'seasonal-collection-page--typeahead-filters' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div
          className="seasonal-collection-page__inner"
          style={
            {
              '--seasonal-accent-eyebrow': isHalloween
                ? '#f0b27a'
                : collection.accent.eyebrow,
              '--seasonal-accent-bg': collection.accent.background,
              '--seasonal-accent-border': collection.accent.border,
              '--seasonal-accent-glow': collection.accent.glow,
            } as CSSProperties
          }
        >
          {isExperimentPreview && isHoliday ? (
            <p className="seasonal-mockup-banner">
              {holidaySkin === 'reverse'
                ? 'Mockup · Holiday Magic reverse — not live'
                : showOutingRows
                  ? 'Mockup · outing rows — not live'
                  : showTypeahead
                    ? 'Mockup · Explore the events + Browse filters — not live'
                    : 'Mockup · Holiday Magic preview'}
            </p>
          ) : null}
          <div className="seasonal-collection-nav">
            <Link to={seasonalReturn.to} className="seasonal-collection-back">
              ← Back to {seasonalReturn.label}
            </Link>
            <Link to="/guides" className="seasonal-collection-all-guides">
              View all guides →
            </Link>
          </div>

          <header className="seasonal-collection-hero">
            <p className="seasonal-collection-hero__eyebrow">{collection.timingLabel}</p>
            <div className="seasonal-collection-hero__title-row">
              <h1 className="seasonal-collection-hero__title">{collection.subtitle}</h1>
              <img
                src={collection.illustrationSrc}
                alt=""
                className="seasonal-collection-hero__illustration"
                width={52}
                height={52}
                decoding="async"
              />
            </div>
            {supportingLine ? (
              <p className="seasonal-collection-hero__subtitle">{supportingLine}</p>
            ) : null}
            {showDescription ? (
              <SeasonalEmDashTagline
                text={collection.description}
                className="seasonal-collection-hero__description"
              />
            ) : null}
          </header>

          {isHalloween ? (
            <LocalGuideCardVariant variant={guideCardVariant ?? 4} />
          ) : null}
          {isHoliday ? <HolidayMagicGuidesPanel /> : null}

          {showOutingRows ? (
            <HolidayOutingRowsSection
              collection={collection}
              closeToHomeEvents={closeToHomeEvents}
              driveEvents={driveEvents}
              city={
                searchAnchor
                  ? null
                  : browseFilters.city !== 'all' && browseFilters.city !== 'nearby'
                    ? browseFilters.city
                    : null
              }
              onEventClick={(event) => openEvent(event, 'home', { viewMode: 'list' })}
            />
          ) : showTypeahead && eventsHeading ? (
            <section
              id={isHoliday ? 'events' : undefined}
              className="hmg-events-section"
              aria-labelledby="hmg-events-heading"
            >
              <h2 id="hmg-events-heading" className="hmg-events-section__heading">
                {eventsHeading}
              </h2>
              {browseStyleFilters}
              {hasGeographicSections ? (
                <CollectionGeoTabs
                  collection={collection}
                  closeToHomeEvents={closeToHomeEvents}
                  driveEvents={driveEvents}
                  onEventClick={(event) => openEvent(event, 'home', { viewMode: 'list' })}
                  hideTimingLabels
                  bandHeadingLevel="h3"
                />
              ) : (
                <TimingGroups
                  events={closeToHomeEvents}
                  onEventClick={(event) => openEvent(event, 'home', { viewMode: 'list' })}
                  geoLabel={collection.subtitle}
                  hideTimingLabels
                />
              )}
            </section>
          ) : (
            <>
              {hasGeographicSections ? (
                <CollectionGeoTabs
                  id={isHalloween || isHoliday ? 'events' : undefined}
                  collection={collection}
                  closeToHomeEvents={closeToHomeEvents}
                  driveEvents={driveEvents}
                  onEventClick={(event) => openEvent(event, 'home', { viewMode: 'list' })}
                />
              ) : (
                <TimingGroups
                  events={closeToHomeEvents}
                  onEventClick={(event) => openEvent(event, 'home', { viewMode: 'list' })}
                  geoLabel={collection.subtitle}
                />
              )}
            </>
          )}
        </div>
      </PageContainer>

      {showTypeahead ? (
        <FilterSheet
          filters={browseFilters}
          onApply={(next) => {
            setBrowseFilters(next)
            trackCitySelected(next.city, 'browse')
          }}
          open={openSheet}
          onClose={() => setOpenSheet(null)}
          hasNearbyCoords={Boolean(coords)}
          onRequestNearby={requestNearbyLocation}
          filterEnhancements
          searchAnchorLabel={searchAnchor?.label ?? null}
          onSearchAnchor={handleSearchAnchor}
          pickedYmd={pickedYmd}
          onPickDate={setPickedYmd}
          onClearPickedDate={() => setPickedYmd(null)}
          getResultCount={getFilterSheetResultCount}
        />
      ) : null}

      <Footer fullBleed className="mt-0" />
    </div>
  )
}

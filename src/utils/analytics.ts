import type { Event } from '../types/event'
import type {
  ActivityEngagementAction,
  AnalyticsProps,
  EventOpenSource,
  FilterContext,
  ShareSubmissionType,
  ViewMode,
} from '../types/analytics'
import type { ActivityType, DayFilter, TimeFilter } from '../types/event'
import type { AgeFilter } from './ageRange'
import type { TemporalTab } from './dates'
import type { BrowseFilters } from './filters'
import { localCitySlugFromPath } from '../config/localRoutes'
import {
  activityTypeSlug,
  ageFilterSlug,
  bucketRequestedLocation,
  citySlug,
  dateFilterSlug,
  primaryEventCategory,
  sourceContextSlug,
  timeFilterSlug,
} from './analyticsMappers'

const PRODUCTION_HOSTNAME = 'puddlesmap.com'

export const ANALYTICS_EVENTS = {
  CITY_SELECTED: 'city_selected',
  DATE_FILTER_SELECTED: 'date_filter_selected',
  ACTIVITY_TYPE_SELECTED: 'activity_type_selected',
  TIME_FILTER_SELECTED: 'time_filter_selected',
  AGE_FILTER_SELECTED: 'age_filter_selected',
  VIEW_MODE_CHANGED: 'view_mode_changed',
  ACTIVITY_OPENED: 'activity_opened',
  VISIT_OFFICIAL_PAGE_CLICKED: 'visit_official_page_clicked',
  ADD_TO_CALENDAR_CLICKED: 'add_to_calendar_clicked',
  OPEN_ROUTE_CLICKED: 'open_route_clicked',
  ACTIVITY_SHARED: 'activity_shared',
  SHARE_FORM_OPENED: 'share_form_opened',
  SHARE_FORM_SUBMITTED: 'share_form_submitted',
  EXPANSION_WATCH_SUBMITTED: 'expansion_watch_submitted',
  OUTDATED_INFO_REPORTED: 'outdated_info_reported',
  WELCOME_SHOWN: 'welcome_shown',
  WELCOME_DISMISSED: 'welcome_dismissed',
  WELCOME_EXPLORE_CLICKED: 'welcome_explore_clicked',
  NEARBY_REQUEST_OPENED: 'nearby_request_opened',
  NEARBY_REQUEST_SUBMITTED: 'nearby_request_submitted',
  NEARBY_REQUEST_ERROR: 'nearby_request_error',
} as const

type PlausibleInitOptions = {
  autoCapturePageviews?: boolean
  outboundLinks?: boolean
  formSubmissions?: boolean
  captureOnLocalhost?: boolean
  transformRequest?: (payload: Record<string, unknown>) => Record<string, unknown> | null
}

type PlausibleFn = ((event: string, options?: { props?: AnalyticsProps }) => void) & {
  init?: (options?: PlausibleInitOptions) => void
  q?: unknown[]
  o?: PlausibleInitOptions
}

declare global {
  interface Window {
    plausible?: PlausibleFn
  }
}

let analyticsInitialized = false

const BLOCKED_PROP_KEYS = new Set([
  'email',
  'name',
  'firstname',
  'first_name',
  'lastname',
  'last_name',
  'title',
  'address',
  'phone',
  'message',
  'content',
  'note',
  'usernote',
  'description',
  'submission',
  'additionalinfo',
  'eventname',
  'event_name_text',
  'child',
  'childname',
  'child_name',
  'age',
  'birthday',
  'payload',
])

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin')
}

export function isProductionAnalyticsHost(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.hostname === PRODUCTION_HOSTNAME
}

export function isAnalyticsEnabled(): boolean {
  return isProductionAnalyticsHost()
}

function sanitizeProps(props?: AnalyticsProps): AnalyticsProps | undefined {
  if (!props) return undefined

  const clean: AnalyticsProps = {}
  for (const [key, value] of Object.entries(props)) {
    const normalized = key.trim().toLowerCase()
    if (BLOCKED_PROP_KEYS.has(normalized)) continue
    if (typeof value === 'string' && (value.includes('@') || value.length > 120)) continue
    clean[key] = value
  }
  return Object.keys(clean).length > 0 ? clean : undefined
}

function transformRequest(payload: Record<string, unknown>): Record<string, unknown> | null {
  if (typeof window !== 'undefined' && isAdminPath(window.location.pathname)) {
    return null
  }

  const props = payload.props
  if (props && typeof props === 'object' && !Array.isArray(props)) {
    const clean = sanitizeProps(props as AnalyticsProps)
    if (clean) {
      payload.props = clean
    } else {
      delete payload.props
    }
  }

  return payload
}

export function initAnalytics(): void {
  if (!isAnalyticsEnabled() || analyticsInitialized || typeof window === 'undefined') return

  window.plausible?.init?.({
    autoCapturePageviews: false,
    outboundLinks: true,
    formSubmissions: true,
    captureOnLocalhost: false,
    transformRequest,
  })

  analyticsInitialized = true
}

export interface PageViewInfo {
  page: string
  path: string
  city?: string
}

export function resolvePageView(pathname: string): PageViewInfo | null {
  if (isAdminPath(pathname)) return null

  const citySlug = localCitySlugFromPath(pathname)
  if (citySlug) {
    return { page: 'city_page', path: pathname, city: citySlug.replace(/-/g, '_') }
  }

  if (pathname === '/') return { page: 'home', path: pathname }
  if (pathname === '/browse') return { page: 'browse', path: pathname }
  if (pathname === '/map') return { page: 'map', path: pathname }
  if (pathname === '/share') return { page: 'share', path: pathname }
  if (pathname === '/about') return { page: 'about', path: pathname }
  if (pathname.startsWith('/event/')) return { page: 'event_detail', path: pathname }

  return null
}

/** @deprecated Use resolvePageView */
export function pageNameFromPath(pathname: string): string | null {
  return resolvePageView(pathname)?.page ?? null
}

export function trackPageView(pathname: string): void {
  if (!isAnalyticsEnabled() || isAdminPath(pathname)) return

  const info = resolvePageView(pathname)
  if (!info || !window.plausible) return

  const props = sanitizeProps({
    page: info.page,
    path: info.path,
    ...(info.city ? { city: info.city } : {}),
  })

  window.plausible('pageview', props ? { props } : undefined)
}

export function track(eventName: string, props?: AnalyticsProps): void {
  if (!isAnalyticsEnabled()) return
  if (typeof window !== 'undefined' && isAdminPath(window.location.pathname)) return

  const clean = sanitizeProps(props)
  window.plausible?.(eventName, clean ? { props: clean } : undefined)
}

export function trackEvent(eventName: string, props?: AnalyticsProps): void {
  track(eventName, props)
}

function activityProps(event: Event): AnalyticsProps {
  return {
    event_id: event.id,
    event_city: citySlug(event.city),
    event_category: primaryEventCategory(event),
  }
}

export function trackCitySelected(city: string, context: FilterContext): void {
  trackEvent(ANALYTICS_EVENTS.CITY_SELECTED, {
    city: citySlug(city),
    context,
  })
}

export function trackDateFilterSelected(
  dateFilter: DayFilter | TemporalTab,
  context: FilterContext,
): void {
  trackEvent(ANALYTICS_EVENTS.DATE_FILTER_SELECTED, {
    date_filter: dateFilterSlug(dateFilter),
    context,
  })
}

export function trackActivityTypeSelected(activityType: ActivityType): void {
  trackEvent(ANALYTICS_EVENTS.ACTIVITY_TYPE_SELECTED, {
    activity_type: activityTypeSlug(activityType),
  })
}

export function trackTimeFilterSelected(timeFilter: TimeFilter): void {
  trackEvent(ANALYTICS_EVENTS.TIME_FILTER_SELECTED, {
    time_filter: timeFilterSlug(timeFilter),
  })
}

export function trackAgeFilterSelected(ageFilter: AgeFilter): void {
  trackEvent(ANALYTICS_EVENTS.AGE_FILTER_SELECTED, {
    age_filter: ageFilterSlug(ageFilter),
  })
}

export function trackViewModeChanged(viewMode: ViewMode): void {
  trackEvent(ANALYTICS_EVENTS.VIEW_MODE_CHANGED, { view_mode: viewMode })
}

export function trackActivityOpened(event: Event, source: EventOpenSource): void {
  trackEvent(ANALYTICS_EVENTS.ACTIVITY_OPENED, {
    ...activityProps(event),
    source_context: sourceContextSlug(source),
  })
}

export function trackActivityEngagement(action: ActivityEngagementAction, event: Event): void {
  trackEvent(action, activityProps(event))
}

export function trackShareFormOpened(sourceContext: string): void {
  trackEvent(ANALYTICS_EVENTS.SHARE_FORM_OPENED, { source_context: sourceContext })
}

export function trackShareFormSubmitted(submissionType: ShareSubmissionType): void {
  trackEvent(ANALYTICS_EVENTS.SHARE_FORM_SUBMITTED, { submission_type: submissionType })
}

export function trackExpansionWatchSubmitted({
  requestedLocation,
  sourceContext,
}: {
  requestedLocation: string
  sourceContext: string
}): void {
  trackEvent(ANALYTICS_EVENTS.EXPANSION_WATCH_SUBMITTED, {
    requested_location: bucketRequestedLocation(requestedLocation),
    source_context: sourceContext,
  })
}

export function trackWelcomeShown(page: string): void {
  trackEvent(ANALYTICS_EVENTS.WELCOME_SHOWN, { page })
}

export function trackWelcomeDismissed(page: string): void {
  trackEvent(ANALYTICS_EVENTS.WELCOME_DISMISSED, { page })
}

export function trackWelcomeExploreClicked(page: string): void {
  trackEvent(ANALYTICS_EVENTS.WELCOME_EXPLORE_CLICKED, { page })
}

export function trackNearbyRequestOpened({
  source,
  page,
}: {
  source: string
  page: string
}): void {
  trackEvent(ANALYTICS_EVENTS.NEARBY_REQUEST_OPENED, { source, page })
}

export function trackNearbyRequestSubmitted({
  source,
  page,
  requestedLocation,
}: {
  source: string
  page: string
  requestedLocation: string
}): void {
  trackEvent(ANALYTICS_EVENTS.NEARBY_REQUEST_SUBMITTED, {
    source,
    page,
    requested_location: bucketRequestedLocation(requestedLocation),
  })
}

export function trackNearbyRequestError({
  source,
  page,
}: {
  source: string
  page: string
}): void {
  trackEvent(ANALYTICS_EVENTS.NEARBY_REQUEST_ERROR, { source, page })
}

export function trackOutdatedInfoReported(event: Event): void {
  trackEvent(ANALYTICS_EVENTS.OUTDATED_INFO_REPORTED, activityProps(event))
}

export function trackBrowseFiltersApplied(prev: BrowseFilters, next: BrowseFilters): void {
  if (prev.city !== next.city) {
    trackCitySelected(next.city, 'browse')
  }

  if (prev.day !== next.day) {
    trackDateFilterSelected(next.day, 'browse')
  }

  if (prev.time !== next.time) {
    trackTimeFilterSelected(next.time)
  }

  if (prev.age !== next.age) {
    trackAgeFilterSelected(next.age)
  }

  if (prev.types.join(',') !== next.types.join(',')) {
    const added = next.types.filter((type) => !prev.types.includes(type))
    for (const type of added) {
      trackActivityTypeSelected(type)
    }
  }
}

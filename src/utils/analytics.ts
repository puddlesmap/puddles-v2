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
import { isAdminPath, isPostHogDebugLocalhost, isProductionAnalyticsHost } from './analyticsHost'
import { PLAUSIBLE_SCRIPT_SRC } from './plausibleSnippet'

export { isProductionAnalyticsHost } from './analyticsHost'

const TRACKER_SCRIPT_ID = 'plausible-tracker'

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
  SEASONAL_BANNER_IMPRESSION: 'seasonal_banner_impression',
  SEASONAL_BANNER_CLICKED: 'seasonal_banner_clicked',
  SEASONAL_COLLECTION_EVENT_OPENED: 'seasonal_collection_event_opened',
  GUIDE_EVENT_LINK_CLICKED: 'guide_event_link_clicked',
  GUIDE_SECTION_VIEWED: 'guide_section_viewed',
  GUIDE_SHARED: 'guide_shared',
  NEWSLETTER_SUBSCRIBED: 'newsletter_subscribed',
  NEWSLETTER_UNSUBSCRIBED: 'newsletter_unsubscribed',
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
    posthog?: {
      __loaded?: boolean
      capture: (event: string, properties?: Record<string, unknown>) => void
      captureException: (error: unknown) => void
      identify: (distinctId: string, properties?: Record<string, unknown>) => void
      stopSessionRecording?: () => void
    }
  }
}

const INTERNAL_OWNER_DISTINCT_ID = 'schei_internal'

/** Wait until posthog-js finished init (or fail). Does not auto-identify anyone. */
function waitForPostHogReady(timeoutMs = 5000): Promise<NonNullable<Window['posthog']>> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('PostHog is only available in the browser.'))
      return
    }

    const started = Date.now()

    function tryResolve(): boolean {
      const ph = window.posthog
      if (!ph || typeof ph.identify !== 'function') return false
      // Wait while the SDK reports it is still loading.
      if (ph.__loaded === false) return false
      resolve(ph)
      return true
    }

    if (tryResolve()) return

    const timer = window.setInterval(() => {
      if (tryResolve()) {
        window.clearInterval(timer)
        return
      }
      if (Date.now() - started >= timeoutMs) {
        window.clearInterval(timer)
        reject(new Error('PostHog is not initialized in this browser.'))
      }
    }, 50)
  })
}

/**
 * Admin-only: mark this browser's PostHog person as internal owner.
 * Call only from an explicit admin UI action — never on public page load.
 */
export async function markBrowserAsInternalOwner(): Promise<void> {
  const ph = await waitForPostHogReady()
  ph.identify(INTERNAL_OWNER_DISTINCT_ID, {
    is_internal: true,
    user_type: 'owner',
  })
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

export function isAnalyticsEnabled(): boolean {
  return isProductionAnalyticsHost()
}

function isPostHogCaptureEnabled(): boolean {
  return isProductionAnalyticsHost() || isPostHogDebugLocalhost()
}

/** Use window.posthog from instrumentation-client — never import posthog-js here (Netlify SSR). */
function capturePostHog(eventName: string, props?: AnalyticsProps): void {
  if (typeof window === 'undefined' || !isPostHogCaptureEnabled()) return
  if (isAdminPath(window.location.pathname)) return

  window.posthog?.capture(eventName, props as Record<string, unknown> | undefined)
}

/** Ensure queue stub + tracker script exist before any track/init call. */
function ensurePlausibleLoaded(): void {
  if (typeof window === 'undefined' || !isAnalyticsEnabled()) return

  window.plausible =
    window.plausible ||
    function () {
      // eslint-disable-next-line prefer-rest-params
      ;(window.plausible!.q = window.plausible!.q || []).push(arguments)
    }
  window.plausible.init =
    window.plausible.init ||
    function (i) {
      window.plausible!.o = i || {}
    }

  const alreadyInjected =
    Boolean(document.getElementById(TRACKER_SCRIPT_ID)) ||
    Array.from(document.scripts).some((script) => script.src.includes('plausible.io/js/'))

  if (alreadyInjected) return

  const script = document.createElement('script')
  script.id = TRACKER_SCRIPT_ID
  script.async = true
  script.src = PLAUSIBLE_SCRIPT_SRC
  document.head.appendChild(script)
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

  ensurePlausibleLoaded()

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
  guideSlug?: string
  entryPoint?: string
}

const GUIDE_ENTRY_POINTS = new Set(['home', 'browse', 'collection', 'instagram', 'xiaohongshu', 'google'])

function guideEntryPoint(search: string): string {
  const query = search.startsWith('?') ? search.slice(1) : search
  const params = new URLSearchParams(query)
  const utm = params.get('utm_source')?.trim().toLowerCase() ?? ''
  const utmAlias =
    utm === 'ig' ? 'instagram' : utm === 'xhs' || utm === 'redbook' ? 'xiaohongshu' : utm
  if (GUIDE_ENTRY_POINTS.has(utmAlias)) return utmAlias

  const entry = params.get('entry')?.trim().toLowerCase() ?? ''
  if (entry === 'home' || entry === 'browse' || entry === 'collection') return entry

  if (typeof window !== 'undefined' && document.referrer) {
    try {
      const ref = new URL(document.referrer)
      if (ref.host === window.location.host) {
        if (ref.pathname === '/') return 'home'
        if (ref.pathname === '/browse') return 'browse'
        if (ref.pathname.includes('/experiment/seasonal-discovery/')) return 'collection'
      }
    } catch {
      // Ignore a referrer that is not a URL.
    }
  }

  return 'direct'
}

export function resolvePageView(pathname: string, search = ''): PageViewInfo | null {
  if (isAdminPath(pathname)) return null

  const guideMatch = pathname.match(/^\/guides\/([a-z0-9-]{1,80})$/)
  if (guideMatch) {
    return {
      page: 'guide',
      path: pathname,
      guideSlug: guideMatch[1],
      entryPoint: guideEntryPoint(search),
    }
  }

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
  if (isAdminPath(pathname)) {
    if (typeof window !== 'undefined') window.posthog?.stopSessionRecording?.()
    return
  }

  const search = typeof window !== 'undefined' ? window.location.search : ''
  const info = resolvePageView(pathname, search)
  if (!info) return

  const props = sanitizeProps({
    page: info.page,
    path: info.path,
    ...(info.city ? { city: info.city } : {}),
    ...(info.guideSlug ? { guide_slug: info.guideSlug } : {}),
    ...(info.entryPoint ? { entry_point: info.entryPoint } : {}),
  })

  if (isAnalyticsEnabled()) {
    initAnalytics()
    if (window.plausible) {
      window.plausible('pageview', props ? { props } : undefined)
    }
  }

  // PostHog SPA pageviews need $current_url for Pages / path breakdowns.
  const currentUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${pathname}${window.location.search}`
      : pathname
  capturePostHog('$pageview', {
    ...(props ?? {}),
    $current_url: currentUrl,
  })
}

export function track(eventName: string, props?: AnalyticsProps): void {
  if (typeof window !== 'undefined' && isAdminPath(window.location.pathname)) return

  const clean = sanitizeProps(props)

  if (isAnalyticsEnabled()) {
    initAnalytics()
    window.plausible?.(eventName, clean ? { props: clean } : undefined)
  }

  capturePostHog(eventName, clean)
}

export function trackEvent(eventName: string, props?: AnalyticsProps): void {
  track(eventName, props)
}

let lastOpenedEvent: { eventId: string; sourcePage: string; guideSlug?: string } | null = null

function activityProps(event: Event): AnalyticsProps {
  const props: AnalyticsProps = {
    event_id: event.id,
    event_city: citySlug(event.city),
    event_category: primaryEventCategory(event),
  }
  if (lastOpenedEvent?.eventId === event.id && lastOpenedEvent.guideSlug) {
    props.guide_slug = lastOpenedEvent.guideSlug
  }
  return props
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

export function guideSlugFromLocationSearch(search: string): string | undefined {
  const query = search.startsWith('?') ? search.slice(1) : search
  const value = new URLSearchParams(query).get('from_guide')?.trim() ?? ''
  if (!/^[a-z0-9-]{1,80}$/.test(value)) return undefined
  return value
}

export function trackGuideEventLinkClicked(guideSlug: string, eventId: string): void {
  if (!/^[a-z0-9-]{1,80}$/.test(guideSlug)) return
  if (!eventId.trim()) return
  trackEvent(ANALYTICS_EVENTS.GUIDE_EVENT_LINK_CLICKED, {
    guide_slug: guideSlug,
    event_id: eventId,
  })
}

export function trackGuideSectionViewed(guideSlug: string, sectionId: string): void {
  if (!/^[a-z0-9-]{1,80}$/.test(guideSlug)) return
  if (!/^[a-z0-9-]{1,80}$/.test(sectionId)) return
  trackEvent(ANALYTICS_EVENTS.GUIDE_SECTION_VIEWED, {
    guide_slug: guideSlug,
    section_id: sectionId,
  })
}

export function trackGuideShared(guideSlug: string): void {
  if (!/^[a-z0-9-]{1,80}$/.test(guideSlug)) return
  trackEvent(ANALYTICS_EVENTS.GUIDE_SHARED, { guide_slug: guideSlug })
}

export function trackActivityOpened(
  event: Event,
  source: EventOpenSource,
  extras?: { guide_slug?: string },
): void {
  const sourcePage = sourceContextSlug(source)
  lastOpenedEvent = {
    eventId: event.id,
    sourcePage,
    ...(extras?.guide_slug ? { guideSlug: extras.guide_slug } : {}),
  }
  trackEvent(ANALYTICS_EVENTS.ACTIVITY_OPENED, {
    ...activityProps(event),
    source_context: sourcePage,
    ...(extras?.guide_slug ? { guide_slug: extras.guide_slug } : {}),
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

function themeSlug(slug: string): string {
  return slug.trim().toLowerCase().replace(/-/g, '_')
}

/** Home / browse seasonal band became visible (once per mount). */
export function trackSeasonalBannerImpression({
  themeSlug: theme,
  placement = 'home',
  page = 'home',
}: {
  themeSlug: string
  placement?: string
  page?: string
}): void {
  trackEvent(ANALYTICS_EVENTS.SEASONAL_BANNER_IMPRESSION, {
    theme_slug: themeSlug(theme),
    placement,
    page,
  })
}

/** User clicked the seasonal banner CTA (e.g. See all → collection). */
export function trackSeasonalBannerClicked({
  themeSlug: theme,
  clickTarget = 'see_all',
  placement = 'home',
  page = 'home',
}: {
  themeSlug: string
  clickTarget?: string
  placement?: string
  page?: string
}): void {
  trackEvent(ANALYTICS_EVENTS.SEASONAL_BANNER_CLICKED, {
    theme_slug: themeSlug(theme),
    click_target: clickTarget,
    placement,
    page,
  })
}

/** User opened an activity from the seasonal banner carousel. */
export function trackSeasonalCollectionEventOpened({
  event,
  themeSlug: theme,
  placement = 'home',
  page = 'home',
}: {
  event: Event
  themeSlug: string
  placement?: string
  page?: string
}): void {
  trackEvent(ANALYTICS_EVENTS.SEASONAL_COLLECTION_EVENT_OPENED, {
    ...activityProps(event),
    theme_slug: themeSlug(theme),
    placement,
    page,
  })
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

export function trackNewsletterSubscribed(signupSource: string): void {
  trackEvent(ANALYTICS_EVENTS.NEWSLETTER_SUBSCRIBED, { signup_source: signupSource })
}

export function trackNewsletterUnsubscribed(): void {
  trackEvent(ANALYTICS_EVENTS.NEWSLETTER_UNSUBSCRIBED)
}

import type { Event } from '../types/event'
import type { BrowseFilterKind } from '../types/analytics'
import type { BrowseFilters } from './filters'

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number | boolean> }) => void
  }
}

const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined

let scriptInjected = false

const BLOCKED_PROP_KEYS = new Set([
  'email',
  'title',
  'address',
  'eventname',
  'event_name_text',
  'usernote',
  'note',
  'description',
  'submission',
  'additionalinfo',
])

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin')
}

export function isAnalyticsEnabled(): boolean {
  return Boolean(PLAUSIBLE_DOMAIN?.trim())
}

function sanitizeProps(props?: Record<string, string | number | boolean>): Record<string, string | number | boolean> | undefined {
  if (!props) return undefined

  const clean: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(props)) {
    const normalized = key.trim().toLowerCase()
    if (BLOCKED_PROP_KEYS.has(normalized)) continue
    if (typeof value === 'string' && value.includes('@')) continue
    clean[key] = value
  }
  return Object.keys(clean).length > 0 ? clean : undefined
}

export function initAnalytics(): void {
  if (!isAnalyticsEnabled() || scriptInjected || typeof document === 'undefined') return

  const script = document.createElement('script')
  script.defer = true
  script.dataset.domain = PLAUSIBLE_DOMAIN!.trim()
  script.src = 'https://plausible.io/js/script.js'
  document.head.appendChild(script)
  scriptInjected = true
}

export function trackPageView(pathname: string, pageName: string): void {
  if (!isAnalyticsEnabled() || isAdminPath(pathname)) return

  const props = sanitizeProps({ page: pageName, path: pathname })
  if (window.plausible) {
    window.plausible('pageview', props ? { props } : undefined)
  }
}

export function track(eventName: string, props?: Record<string, string | number | boolean>): void {
  if (!isAnalyticsEnabled()) return
  if (typeof window !== 'undefined' && isAdminPath(window.location.pathname)) return

  const clean = sanitizeProps(props)
  window.plausible?.(eventName, clean ? { props: clean } : undefined)
}

export function eventAnalyticsProps(
  event: Event,
  extra?: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> {
  return {
    event_id: event.id,
    city: event.city,
    ...extra,
  }
}

export function trackBrowseFilterApply(
  prev: BrowseFilters,
  next: BrowseFilters,
  filter: BrowseFilterKind,
): void {
  if (filter === 'day' && prev.day !== next.day) {
    track('browse_filter_apply', { filter: 'day', value: next.day })
    return
  }

  if (filter === 'time' && prev.time !== next.time) {
    track('browse_filter_apply', { filter: 'time', value: next.time })
    return
  }

  if (filter === 'age' && prev.age !== next.age) {
    track('browse_filter_apply', { filter: 'age', value: next.age })
    return
  }

  if (filter === 'type' && prev.types.join(',') !== next.types.join(',')) {
    track('browse_filter_apply', {
      filter: 'type',
      types_count: next.types.length,
    })
  }
}

export function trackBrowseCityChange(
  city: string,
  source: 'filter' | 'pill' | 'bridge',
  previousCity?: string,
): void {
  if (previousCity === city) return
  track('browse_city_change', { city, source })
}

export function trackBrowseNearbySelect(): void {
  track('browse_nearby_select')
}

export function trackBrowseNearbyDenied(): void {
  track('browse_nearby_denied')
}

export function trackHomeExperimentNearbySelect(): void {
  track('home_experiment_nearby_select')
}

export function trackHomeExperimentNearbyDenied(): void {
  track('home_experiment_nearby_denied')
}

export function pageNameFromPath(pathname: string): string | null {
  if (isAdminPath(pathname)) return null
  if (pathname === '/') return 'home'
  if (pathname === '/home-experiment') return 'home'
  if (pathname === '/home-ikea-experiment') return 'home'
  if (pathname === '/home-experiment-1') return 'home_experiment_1'
  if (pathname === '/home-experiment-2') return 'home_experiment_2'
  if (pathname === '/home-experiment-3') return 'home_experiment_3'
  if (pathname === '/home-experiment-4') return 'home_experiment_4'
  if (pathname === '/home-v1') return 'home_v1'
  if (pathname === '/experiment-home') return 'home'
  if (pathname === '/discovery') return 'discovery'
  if (pathname === '/browse') return 'browse'
  if (pathname === '/browse-v1') return 'browse_v1'
  if (pathname === '/experiment-browse') return 'experiment_browse'
  if (pathname === '/experiment-browse-map') return 'experiment_browse_map'
  if (pathname === '/experiment-browse-3') return 'browse'
  if (pathname === '/browse-experiment') return 'experiment_browse'
  if (pathname === '/share') return 'share'
  if (pathname === '/share-experiment') return 'share_experiment'
  if (pathname === '/about') return 'about'
  if (pathname === '/about-experiment' || pathname === '/experiment_about') return 'about_experiment'
  if (pathname === '/typography-experiment') return 'typography_experiments_index'
  if (pathname === '/typography-experiment/home') return 'typography_experiment_home'
  if (pathname === '/typography-experiment/about') return 'typography_experiment_about'
  if (pathname === '/typography-experiment/about-style/home') return 'typography_about_style_home'
  if (
    pathname === '/typography-experiment/about-style/share' ||
    pathname === '/typography-experiment/share'
  ) {
    return 'typography_about_style_share'
  }
  if (pathname === '/maintenance') return 'maintenance'
  return 'other'
}

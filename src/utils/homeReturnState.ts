import type { TemporalTab } from './dates'
import type { HomeWhereMode } from './homeMapPreview'

export interface HomeReturnSnapshot {
  temporalTab: TemporalTab
  whereMode: HomeWhereMode
  scrollY: number
}

const STORAGE_KEY = 'puddles:home-return'
const HOME_RETURN_EVENT = 'puddles:home-return'

const TEMPORAL_TABS: TemporalTab[] = ['today', 'tomorrow', 'weekend']
const CITY_VALUES = ['all', 'Palo Alto', 'Los Altos', 'Mountain View', 'Sunnyvale'] as const

/** Latest Home chips while Home is mounted — used when opening an event (including seasonal band). */
let liveHomeUi: Pick<HomeReturnSnapshot, 'temporalTab' | 'whereMode'> | null = null

export function rememberHomeUiState(state: Pick<HomeReturnSnapshot, 'temporalTab' | 'whereMode'>) {
  liveHomeUi = state
}

export function clearLiveHomeUiState() {
  liveHomeUi = null
}

function isTemporalTab(value: unknown): value is TemporalTab {
  return TEMPORAL_TABS.includes(value as TemporalTab)
}

function isWhereMode(value: unknown): value is HomeWhereMode {
  if (!value || typeof value !== 'object') return false
  const mode = value as { kind?: unknown; value?: unknown }
  if (mode.kind === 'nearby') return true
  return mode.kind === 'city' && CITY_VALUES.includes(mode.value as (typeof CITY_VALUES)[number])
}

function parseSnapshot(raw: string): HomeReturnSnapshot | null {
  try {
    const parsed = JSON.parse(raw) as Partial<HomeReturnSnapshot>
    if (!isTemporalTab(parsed.temporalTab) || !isWhereMode(parsed.whereMode)) return null
    const scrollY = typeof parsed.scrollY === 'number' && Number.isFinite(parsed.scrollY) ? parsed.scrollY : 0
    return {
      temporalTab: parsed.temporalTab,
      whereMode: parsed.whereMode,
      scrollY,
    }
  } catch {
    return null
  }
}

export function saveHomeReturnSnapshot(snapshot: HomeReturnSnapshot) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // sessionStorage unavailable — skip.
  }
}

/** Capture current Home chips + scroll when opening an event from Home. */
export function saveHomeReturnSnapshotFromLive(scrollY: number) {
  if (!liveHomeUi) return
  saveHomeReturnSnapshot({
    ...liveHomeUi,
    scrollY,
  })
}

export function readHomeReturnSnapshot(): HomeReturnSnapshot | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return parseSnapshot(raw)
  } catch {
    return null
  }
}

export function consumeHomeReturnSnapshot(): HomeReturnSnapshot | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    sessionStorage.removeItem(STORAGE_KEY)
    return parseSnapshot(raw)
  } catch {
    return null
  }
}

/** Consume after paint so a remount from overlay-close can still read the snapshot. */
export function scheduleConsumeHomeReturnSnapshot() {
  if (typeof window === 'undefined') return
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      consumeHomeReturnSnapshot()
    })
  })
}

export function dispatchHomeReturn() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(HOME_RETURN_EVENT))
}

export function subscribeHomeReturn(handler: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(HOME_RETURN_EVENT, handler)
  window.addEventListener('popstate', handler)
  window.addEventListener('pageshow', handler)
  return () => {
    window.removeEventListener(HOME_RETURN_EVENT, handler)
    window.removeEventListener('popstate', handler)
    window.removeEventListener('pageshow', handler)
  }
}

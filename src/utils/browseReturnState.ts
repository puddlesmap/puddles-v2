export interface BrowseReturnSnapshot {
  scrollY: number
  viewMode?: 'list' | 'map'
  selectedEventId?: string | null
  focusedLocationKey?: string | null
  carouselScrollLeft?: number
}

export type BrowseMapOpenSnapshot = Pick<
  BrowseReturnSnapshot,
  'selectedEventId' | 'focusedLocationKey' | 'carouselScrollLeft'
>

const STORAGE_KEY = 'puddles:browse-return'

export function saveBrowseReturnSnapshot(snapshot: BrowseReturnSnapshot) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // sessionStorage unavailable — skip.
  }
}

export function consumeBrowseReturnSnapshot(): BrowseReturnSnapshot | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    sessionStorage.removeItem(STORAGE_KEY)
    return JSON.parse(raw) as BrowseReturnSnapshot
  } catch {
    return null
  }
}

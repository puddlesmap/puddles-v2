/**
 * Same-visit discovery attribution for Guide vs Browse studies.
 * First qualifying discovery surface wins for `discovery_origin`.
 */

export type DiscoveryOrigin = 'guide' | 'browse'
export type SaveSurface =
  | 'guide_article'
  | 'guide_map'
  | 'browse_list'
  | 'browse_map'
  | 'event_detail'
export type GuideVersion = 'v1' | 'v2'

const STORAGE_KEY = 'puddles:discovery_visit_v1'
const VISIT_TTL_MS = 1000 * 60 * 60 * 6 // 6 hours

export type DiscoveryVisitState = {
  discovery_origin: DiscoveryOrigin
  guide_view_id?: string
  source_guide_slug?: string
  guide_version?: GuideVersion
  map_assisted?: boolean
  started_at: number
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined'
}

function readRaw(): DiscoveryVisitState | null {
  if (!canUseStorage()) return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DiscoveryVisitState
    if (!parsed || (parsed.discovery_origin !== 'guide' && parsed.discovery_origin !== 'browse')) {
      return null
    }
    if (!parsed.started_at || Date.now() - parsed.started_at > VISIT_TTL_MS) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeRaw(state: DiscoveryVisitState): void {
  if (!canUseStorage()) return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // quota / private mode
  }
}

export function getDiscoveryVisit(): DiscoveryVisitState | null {
  return readRaw()
}

/** First-touch: set origin only if no active visit. */
export function ensureDiscoveryOrigin(origin: DiscoveryOrigin): DiscoveryVisitState {
  const existing = readRaw()
  if (existing) return existing
  const next: DiscoveryVisitState = {
    discovery_origin: origin,
    started_at: Date.now(),
  }
  writeRaw(next)
  return next
}

export function beginGuideVisit(input: {
  guideSlug: string
  guideViewId: string
  guideVersion?: GuideVersion
}): DiscoveryVisitState {
  const existing = readRaw()
  if (existing?.discovery_origin === 'guide' && existing.guide_view_id === input.guideViewId) {
    return existing
  }
  // New Guide pageview starts (or refreshes) a Guide-attributed visit.
  const next: DiscoveryVisitState = {
    discovery_origin: 'guide',
    guide_view_id: input.guideViewId,
    source_guide_slug: input.guideSlug,
    guide_version: input.guideVersion ?? 'v2',
    map_assisted: false,
    started_at: Date.now(),
  }
  writeRaw(next)
  return next
}

export function beginBrowseVisit(): DiscoveryVisitState {
  return ensureDiscoveryOrigin('browse')
}

export function markGuideMapAssisted(): void {
  const existing = readRaw()
  if (!existing || existing.discovery_origin !== 'guide') return
  if (existing.map_assisted) return
  writeRaw({ ...existing, map_assisted: true })
}

export function bindGuideToEventDetail(guideSlug: string): void {
  const existing = readRaw()
  if (existing?.discovery_origin === 'guide' && existing.source_guide_slug) return
  const base = existing ?? {
    discovery_origin: 'guide' as const,
    started_at: Date.now(),
  }
  writeRaw({
    ...base,
    discovery_origin: 'guide',
    source_guide_slug: guideSlug,
    guide_version: base.guide_version ?? 'v2',
  })
}

/** Props safe to attach to save / engagement events. */
export function attributionProps(): Record<string, string> {
  const visit = readRaw()
  if (!visit) return {}
  const props: Record<string, string> = {
    discovery_origin: visit.discovery_origin,
  }
  if (visit.source_guide_slug) props.source_guide_slug = visit.source_guide_slug
  if (visit.guide_view_id) props.guide_view_id = visit.guide_view_id
  if (visit.guide_version) props.guide_version = visit.guide_version
  if (visit.map_assisted) props.map_assisted = 'true'
  return props
}

export function newGuideViewId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `gv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

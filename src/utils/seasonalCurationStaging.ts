import type { SeasonalCollectionSlug } from '../data/seasonalDiscovery'
import { getActiveSeasonalCollection, getSeasonalCollection } from '../data/seasonalDiscovery'

const STORAGE_KEY = 'puddles-admin-seasonal-curation-v1'
const LOCAL_PUBLISHED_KEY = 'puddles-admin-seasonal-curation-published-v1'

export type SeasonalCurationSection = 'closeToHome' | 'worthADrive'

export interface SeasonalSectionStaging {
  addIds: string[]
  removeIds: string[]
}

export interface SeasonalThemeStaging {
  themeSlug: SeasonalCollectionSlug
  closeToHome: SeasonalSectionStaging
  worthADrive: SeasonalSectionStaging
  updatedAt: string
}

type StagingStore = Record<string, SeasonalThemeStaging>

export interface SeasonalPublishedSnapshot {
  themeSlug: SeasonalCollectionSlug
  collectionEventIds: string[]
  driveEventIds: string[]
  updatedAt: string
}

type PublishedStore = Record<string, SeasonalPublishedSnapshot>

function emptySection(): SeasonalSectionStaging {
  return { addIds: [], removeIds: [] }
}

function emptyTheme(themeSlug: SeasonalCollectionSlug): SeasonalThemeStaging {
  return {
    themeSlug,
    closeToHome: emptySection(),
    worthADrive: emptySection(),
    updatedAt: new Date().toISOString(),
  }
}

function readStore(): StagingStore {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as StagingStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(store: StagingStore) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function readPublishedStore(): PublishedStore {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(LOCAL_PUBLISHED_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as PublishedStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writePublishedStore(store: PublishedStore) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCAL_PUBLISHED_KEY, JSON.stringify(store))
}

export function loadSeasonalThemeStaging(
  themeSlug: SeasonalCollectionSlug,
): SeasonalThemeStaging {
  const store = readStore()
  return store[themeSlug] ? { ...emptyTheme(themeSlug), ...store[themeSlug] } : emptyTheme(themeSlug)
}

export function saveSeasonalThemeStaging(staging: SeasonalThemeStaging) {
  const store = readStore()
  store[staging.themeSlug] = {
    ...staging,
    updatedAt: new Date().toISOString(),
  }
  writeStore(store)
}

function uniqueIds(ids: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of ids) {
    const trimmed = String(id || '').trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    out.push(trimmed)
  }
  return out
}

export function applySectionStaging(baseIds: string[], staging: SeasonalSectionStaging): string[] {
  const removed = new Set(staging.removeIds)
  const merged = [...baseIds.filter((id) => !removed.has(id)), ...staging.addIds]
  return uniqueIds(merged).filter((id) => !removed.has(id))
}

export function getActiveThemeSlugForAdmin(): SeasonalCollectionSlug {
  const active = getActiveSeasonalCollection()
  if (active?.slug) return active.slug
  return 'hello-fall'
}

function baseSectionIds(themeSlug: SeasonalCollectionSlug): {
  closeToHome: string[]
  worthADrive: string[]
} {
  const collection = getSeasonalCollection(themeSlug)
  const published = readPublishedStore()[themeSlug]
  return {
    closeToHome: published?.collectionEventIds ?? collection?.collectionEventIds ?? [],
    worthADrive: published?.driveEventIds ?? collection?.driveEventIds ?? [],
  }
}

export function getEffectiveSeasonalSectionIds(
  themeSlug: SeasonalCollectionSlug = getActiveThemeSlugForAdmin(),
): { closeToHome: string[]; worthADrive: string[]; staging: SeasonalThemeStaging } {
  const staging = loadSeasonalThemeStaging(themeSlug)
  const base = baseSectionIds(themeSlug)
  return {
    closeToHome: applySectionStaging(base.closeToHome, staging.closeToHome),
    worthADrive: applySectionStaging(base.worthADrive, staging.worthADrive),
    staging,
  }
}

function mutateSection(
  themeSlug: SeasonalCollectionSlug,
  section: SeasonalCurationSection,
  mutator: (current: SeasonalSectionStaging) => SeasonalSectionStaging,
): SeasonalThemeStaging {
  const staging = loadSeasonalThemeStaging(themeSlug)
  const next: SeasonalThemeStaging = {
    ...staging,
    [section]: mutator(staging[section]),
    updatedAt: new Date().toISOString(),
  }
  saveSeasonalThemeStaging(next)
  return next
}

export function addToSeasonalSection(
  eventId: string,
  section: SeasonalCurationSection,
  themeSlug: SeasonalCollectionSlug = getActiveThemeSlugForAdmin(),
): SeasonalThemeStaging {
  const id = eventId.trim()
  return mutateSection(themeSlug, section, (current) => ({
    addIds: uniqueIds([...current.addIds, id]),
    removeIds: current.removeIds.filter((row) => row !== id),
  }))
}

export function removeFromSeasonalSection(
  eventId: string,
  section: SeasonalCurationSection,
  themeSlug: SeasonalCollectionSlug = getActiveThemeSlugForAdmin(),
): SeasonalThemeStaging {
  const id = eventId.trim()
  const base = baseSectionIds(themeSlug)
  const baseIds = section === 'closeToHome' ? base.closeToHome : base.worthADrive
  return mutateSection(themeSlug, section, (current) => {
    const stillInBase = baseIds.includes(id)
    return {
      addIds: current.addIds.filter((row) => row !== id),
      removeIds: stillInBase ? uniqueIds([...current.removeIds, id]) : current.removeIds,
    }
  })
}

export function moveSeasonalSection(
  eventId: string,
  from: SeasonalCurationSection,
  to: SeasonalCurationSection,
  themeSlug: SeasonalCollectionSlug = getActiveThemeSlugForAdmin(),
): SeasonalThemeStaging {
  removeFromSeasonalSection(eventId, from, themeSlug)
  return addToSeasonalSection(eventId, to, themeSlug)
}

export function clearSeasonalThemeStaging(
  themeSlug: SeasonalCollectionSlug = getActiveThemeSlugForAdmin(),
) {
  const store = readStore()
  delete store[themeSlug]
  writeStore(store)
}

/** After Publish curation succeeds — keep Admin preview aligned until redeploy lands. */
export function commitSeasonalCurationPublish(
  themeSlug: SeasonalCollectionSlug,
  collectionEventIds: string[],
  driveEventIds: string[],
) {
  const store = readPublishedStore()
  store[themeSlug] = {
    themeSlug,
    collectionEventIds: uniqueIds(collectionEventIds),
    driveEventIds: uniqueIds(driveEventIds),
    updatedAt: new Date().toISOString(),
  }
  writePublishedStore(store)
  clearSeasonalThemeStaging(themeSlug)
}

export function stagingHasChanges(staging: SeasonalThemeStaging): boolean {
  return (
    staging.closeToHome.addIds.length > 0 ||
    staging.closeToHome.removeIds.length > 0 ||
    staging.worthADrive.addIds.length > 0 ||
    staging.worthADrive.removeIds.length > 0
  )
}

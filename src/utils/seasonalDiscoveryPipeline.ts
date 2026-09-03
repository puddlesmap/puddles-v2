import type { DiscoveryCandidate } from '../types/discovery'
import {
  SEASONAL_COLLECTIONS,
  type SeasonalCollectionSlug,
} from '../data/seasonalDiscovery'

export type SeasonalDiscoveryLayer = 'collection' | 'drive' | 'featured'

export interface SeasonalDiscoveryLink {
  /** Live / editorial event id used in seasonalDiscovery.ts */
  eventId: string
  theme: SeasonalCollectionSlug
  layer: SeasonalDiscoveryLayer
  /** Admin Discovery row id when it differs from eventId (e.g. BiblioCommons scrape id) */
  discoveryId?: string
}

/** When the sheet/seasonal id differs from the scraped Discovery queue id. */
export const SEASONAL_DISCOVERY_ID_ALIASES: Record<string, string> = {
  'disc-author-event-celebrate-the-mooncake-fest-2026-09-23-6a6cdceee30fe4845965ed72':
    '6a6cdceee30fe4845965ed72',
}

const THEME_LABEL: Record<SeasonalCollectionSlug, string> = {
  'hello-fall': 'Hello Fall',
  'halloween-with-little-ones': 'Halloween',
}

export function seasonalThemeLabel(slug: SeasonalCollectionSlug): string {
  return THEME_LABEL[slug]
}

function uniqueLinks(links: SeasonalDiscoveryLink[]): SeasonalDiscoveryLink[] {
  const seen = new Set<string>()
  const out: SeasonalDiscoveryLink[] = []
  for (const link of links) {
    if (seen.has(link.eventId)) continue
    seen.add(link.eventId)
    out.push(link)
  }
  return out
}

/** Every curated seasonal pick → Admin Discovery alignment. */
export function buildSeasonalDiscoveryPipeline(): SeasonalDiscoveryLink[] {
  const links: SeasonalDiscoveryLink[] = []

  for (const collection of SEASONAL_COLLECTIONS) {
    for (const eventId of collection.collectionEventIds ?? []) {
      links.push({
        eventId,
        theme: collection.slug,
        layer: 'collection',
        discoveryId: SEASONAL_DISCOVERY_ID_ALIASES[eventId],
      })
    }
    for (const eventId of collection.driveEventIds ?? []) {
      links.push({
        eventId,
        theme: collection.slug,
        layer: 'drive',
        discoveryId: SEASONAL_DISCOVERY_ID_ALIASES[eventId],
      })
    }
    for (const window of collection.featuredWindows) {
      links.push({
        eventId: window.eventId,
        theme: collection.slug,
        layer: 'featured',
        discoveryId: SEASONAL_DISCOVERY_ID_ALIASES[window.eventId],
      })
    }
  }

  return uniqueLinks(links)
}

export const SEASONAL_DISCOVERY_PIPELINE = buildSeasonalDiscoveryPipeline()

/** Discovery row ids that belong in Admin → Seasonal picks (one row per curated pick). */
export function getSeasonalPipelineDiscoveryIds(): Set<string> {
  const ids = new Set<string>()
  for (const link of SEASONAL_DISCOVERY_PIPELINE) {
    ids.add(discoveryIdForSeasonalEvent(link.eventId))
    if (link.discoveryId) ids.add(link.discoveryId)
  }
  return ids
}

export function getSeasonalDiscoveryLink(
  eventOrDiscoveryId: string,
): SeasonalDiscoveryLink | undefined {
  return SEASONAL_DISCOVERY_PIPELINE.find(
    (link) =>
      link.eventId === eventOrDiscoveryId ||
      link.discoveryId === eventOrDiscoveryId ||
      SEASONAL_DISCOVERY_ID_ALIASES[eventOrDiscoveryId] === link.discoveryId,
  )
}

export function discoveryIdForSeasonalEvent(eventId: string): string {
  return SEASONAL_DISCOVERY_ID_ALIASES[eventId] ?? eventId
}

export function isSeasonalDiscoveryCandidate(candidate: DiscoveryCandidate): boolean {
  return getSeasonalPipelineDiscoveryIds().has(candidate.id)
}

export function seasonalDiscoverySourceLabel(link: SeasonalDiscoveryLink): string {
  return `Seasonal · ${seasonalThemeLabel(link.theme)} · ${link.layer}`
}

export function seasonalDiscoveryCategoryTags(link: SeasonalDiscoveryLink): string[] {
  return ['Seasonal pick', `Seasonal · ${seasonalThemeLabel(link.theme)}`, link.layer]
}

#!/usr/bin/env node
/**
 * Align every seasonal pick (Hello Fall / Halloween) with a row in Admin Discovery.
 *
 * Usage: node scripts/sync-seasonal-discovery.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DISCOVERY_ADMIN_PATH,
  isUrlAlreadyOnPuddles,
  loadCatalogUrls,
  loadExistingDiscoveryCandidates,
  pacificTodayYmd,
  sortCandidates,
} from './discovery-shared.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

// Mirror src/utils/seasonalDiscoveryPipeline.ts (keep in sync)
const SEASONAL_DISCOVERY_ID_ALIASES = {
  'disc-author-event-celebrate-the-mooncake-fest-2026-09-23-6a6cdceee30fe4845965ed72':
    '6a6cdceee30fe4845965ed72',
}

const THEME_LABEL = {
  'hello-fall': 'Hello Fall',
  'halloween-with-little-ones': 'Halloween',
}

function loadSeasonalCollections() {
  const text = readFileSync(join(rootDir, 'src/data/seasonalDiscovery.ts'), 'utf8')
  const collections = []
  const slugMatches = [...text.matchAll(/slug: '(hello-fall|halloween-with-little-ones)'/g)]
  for (const slugMatch of slugMatches) {
    const slug = slugMatch[1]
    const start = slugMatch.index
    const slice = text.slice(start, start + 8000)
    const collectionIds = extractQuotedIds(
      slice.match(/collectionEventIds: \[([\s\S]*?)\],/)?.[1] ?? '',
    )
    const driveIds = extractQuotedIds(slice.match(/driveEventIds: \[([\s\S]*?)\],/)?.[1] ?? '')
    const featuredBlock = slice.match(/featuredWindows: \[([\s\S]*?)\],\s*\n\s*collectionEventIds/)?.[1] ?? ''
    const featuredIds = [...featuredBlock.matchAll(/eventId: '([^']+)'/g)].map((m) => m[1])
    collections.push({ slug, collectionIds, driveIds, featuredIds })
  }
  return collections
}

function extractQuotedIds(block) {
  return [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]).filter((id) => id.length > 8)
}

function buildPipeline(collections) {
  const links = []
  const seen = new Set()
  for (const col of collections) {
    for (const layer of [
      ['collection', col.collectionIds],
      ['drive', col.driveIds],
      ['featured', col.featuredIds],
    ]) {
      for (const eventId of layer[1]) {
        if (seen.has(eventId)) continue
        seen.add(eventId)
        links.push({
          eventId,
          theme: col.slug,
          layer: layer[0],
          discoveryId: SEASONAL_DISCOVERY_ID_ALIASES[eventId],
        })
      }
    }
  }
  return links
}

function loadJson(relativePath) {
  return JSON.parse(readFileSync(join(rootDir, relativePath), 'utf8'))
}

function loadDriveEvents() {
  const events = []
  for (const file of [
    'src/data/seasonalHelloFallDriveEvents.ts',
    'src/data/seasonalHalloweenDriveEvents.ts',
  ]) {
    const text = readFileSync(join(rootDir, file), 'utf8')
    const block = text.match(/export const \w+_DRIVE_EVENTS: Event\[\] = \[([\s\S]*?)\n\]/)?.[1]
    if (!block) continue
    for (const obj of block.split(/\n  \},\n/)) {
      const id = obj.match(/id: '([^']+)'/)?.[1]
      if (!id) continue
      events.push(parseDriveEventObject(obj, id))
    }
  }
  return events
}

function parseDriveEventObject(obj, id) {
  const pick = (key) => {
    const single = obj.match(new RegExp(`${key}: '([^']*)'`))
    if (single) return single[1]
    const double = obj.match(new RegExp(`${key}: "([^"]*)"`))
    return double?.[1] ?? ''
  }
  const pickNum = (key) => {
    const m = obj.match(new RegExp(`${key}: (-?[\\d.]+|null)`))
    if (!m || m[1] === 'null') return null
    return Number(m[1])
  }
  const typesBlock = obj.match(/types: \[([\s\S]*?)\]/)?.[1] ?? ''
  const types = [...typesBlock.matchAll(/'([^']+)'/g)].map((m) => m[1])
  const tagsBlock = obj.match(/categoryTags: \[([\s\S]*?)\]/)?.[1] ?? ''
  const categoryTags = [...tagsBlock.matchAll(/'([^']+)'/g)].map((m) => m[1])
  return {
    id,
    title: pick('title'),
    description: pick('description'),
    tips: pick('tips'),
    venue: pick('venue'),
    room: '',
    address: pick('address'),
    city: pick('city'),
    date: pick('date'),
    startTime: pick('startTime'),
    endTime: pick('endTime'),
    ageRange: pick('ageRange'),
    ageMin: pickNum('ageMin'),
    ageMax: pickNum('ageMax'),
    types,
    categoryTags,
    cost: pick('cost'),
    imageUrl: pick('imageUrl'),
    eventUrl: pick('eventUrl'),
    lat: pickNum('lat'),
    lng: pickNum('lng'),
    verifiedDate: pick('verifiedDate'),
    status: pick('status'),
  }
}

function findSheetEvent(sheetEvents, eventId) {
  return sheetEvents.find((event) => event.id === eventId)
}

function mergeCategoryTags(existing, required) {
  const dropLegacy = (existing ?? []).filter(
    (tag) =>
      tag !== 'Hello Fall' &&
      tag !== 'Halloween' &&
      tag !== 'Seasonal' &&
      tag !== 'Seasonal pick' &&
      !tag.startsWith('Seasonal ·') &&
      tag !== 'collection' &&
      tag !== 'drive' &&
      tag !== 'featured' &&
      !tag.startsWith('Seasonal event:'),
  )
  return [...new Set([...dropLegacy, ...required])]
}

function isSeasonalDiscoveryRowId(id, allowedIds) {
  return allowedIds.has(id)
}

function linkToDiscoveryRow(link, event, catalogUrls, existingById) {
  const themeLabel = THEME_LABEL[link.theme]
  const requiredTags = ['Seasonal pick', `Seasonal · ${themeLabel}`, link.layer]
  const source = `Seasonal · ${themeLabel} · ${link.layer}`
  const discoveryId = link.discoveryId ?? link.eventId
  const onPuddles = isUrlAlreadyOnPuddles(event.eventUrl, catalogUrls)

  const base = {
    id: discoveryId,
    title: event.title,
    date: event.date,
    startTime: event.startTime ?? '',
    endTime: event.endTime ?? '',
    venue: event.venue ?? '',
    room: event.room ?? '',
    address: event.address ?? '',
    city: event.city ?? '',
    lat: event.lat ?? null,
    lng: event.lng ?? null,
    ageRange: event.ageRange ?? '',
    ageMin: event.ageMin ?? null,
    ageMax: event.ageMax ?? null,
    audiences: event.audiences ?? '',
    types: Array.isArray(event.types) ? event.types : [],
    categoryTags: mergeCategoryTags(event.categoryTags, requiredTags),
    cost: event.cost ?? '',
    description: event.description ?? '',
    tips: event.tips ?? '',
    imageUrl: event.imageUrl ?? '',
    eventUrl: event.eventUrl ?? '',
    source,
    watchlistSourceId: '',
    isCancelled: false,
    isRecurring: false,
    alreadyOnPuddles: onPuddles,
    reviewStatus: onPuddles ? 'live' : 'approved',
    convertedEventId: link.discoveryId && link.eventId !== discoveryId ? link.eventId : '',
    lastChecked: event.verifiedDate || pacificTodayYmd(),
  }

  const existing = existingById.get(discoveryId)
  if (existing) {
    return {
      ...existing,
      ...base,
      categoryTags: mergeCategoryTags(existing.categoryTags, requiredTags),
      source,
      alreadyOnPuddles: existing.alreadyOnPuddles || onPuddles,
      reviewStatus:
        existing.reviewStatus === 'live' || existing.reviewStatus === 'approved'
          ? existing.reviewStatus
          : base.reviewStatus,
      convertedEventId: base.convertedEventId || existing.convertedEventId,
      lastChecked: existing.lastChecked || base.lastChecked,
    }
  }

  return base
}

const WATCHLIST_ROW_SOURCES = {
  'watchlist-linden-': 'Calendar Watchlist · Linden Tree Books',
  'watchlist-dtla-': 'Calendar Watchlist · Downtown Los Altos',
  'watchlist-pyt-': 'Calendar Watchlist · Peninsula Youth Theatre',
  'watchlist-gamble-': 'Calendar Watchlist · Gamble Garden',
  'watchlist-google-': 'Calendar Watchlist · Google Endless Summer',
  'watchlist-mini-yoga-': 'Calendar Watchlist · Marti Foster Yoga',
  'watchlist-sunnyvale-': 'Calendar Watchlist · Sunnyvale',
}

function restoreSourceAfterSeasonalStrip(row) {
  const source = String(row.source ?? '')
  if (!source.startsWith('Seasonal ·')) return row.source
  if (row.watchlistSourceId) return `Calendar Watchlist · ${row.watchlistSourceId}`
  for (const [prefix, label] of Object.entries(WATCHLIST_ROW_SOURCES)) {
    if (row.id.startsWith(prefix)) return label
  }
  if (row.id.startsWith('watchlist-')) return 'Calendar Watchlist · expansion'
  if (/^[a-f0-9]{24}$/i.test(row.id)) return 'Palo Alto Library · BiblioCommons'
  return 'Discovery · catalog'
}

function stripSeasonalMarkers(row) {
  const categoryTags = (row.categoryTags ?? []).filter(
    (tag) =>
      tag !== 'Seasonal pick' &&
      !tag.startsWith('Seasonal ·') &&
      tag !== 'collection' &&
      tag !== 'drive' &&
      tag !== 'featured' &&
      !tag.startsWith('Seasonal event:'),
  )
  return {
    ...row,
    categoryTags,
    source: restoreSourceAfterSeasonalStrip(row),
    convertedEventId: '',
  }
}

function main() {
  const collections = loadSeasonalCollections()
  const pipeline = buildPipeline(collections)
  const sheetEvents = loadJson('src/data/sheet-events.json')
  const driveEvents = loadDriveEvents()
  const eventsById = new Map([
    ...sheetEvents.map((event) => [event.id, event]),
    ...driveEvents.map((event) => [event.id, event]),
  ])

  const catalogUrls = loadCatalogUrls()
  const existing = loadExistingDiscoveryCandidates()
  const existingById = new Map(existing.map((row) => [row.id, row]))

  const allowedIds = new Set(
    pipeline.map((link) => link.discoveryId ?? SEASONAL_DISCOVERY_ID_ALIASES[link.eventId] ?? link.eventId),
  )

  const added = []
  const updated = []
  const stripped = []
  const missing = []

  for (const link of pipeline) {
    const event = eventsById.get(link.eventId)
    if (!event) {
      missing.push(link.eventId)
      continue
    }
    const row = linkToDiscoveryRow(link, event, catalogUrls, existingById)
    const prev = existingById.get(row.id)
    if (!prev) {
      added.push(row)
      existingById.set(row.id, row)
    } else if (JSON.stringify(prev) !== JSON.stringify(row)) {
      updated.push(row.id)
      existingById.set(row.id, row)
    }
  }

  for (const [id, row] of existingById) {
    if (isSeasonalDiscoveryRowId(id, allowedIds)) continue
    const hadSeasonal =
      row.categoryTags?.some((tag) => tag.startsWith('Seasonal ·') || tag === 'Seasonal pick') ||
      String(row.source ?? '').startsWith('Seasonal ·')
    if (!hadSeasonal) continue
    const cleaned = stripSeasonalMarkers(row)
    existingById.set(id, cleaned)
    stripped.push(id)
  }

  const candidates = sortCandidates([...existingById.values()])
  const raw = JSON.parse(readFileSync(DISCOVERY_ADMIN_PATH, 'utf8'))
  const sources = new Set([...(raw.sources ?? []), ...candidates.map((row) => row.source)])
  writeFileSync(
    DISCOVERY_ADMIN_PATH,
    `${JSON.stringify(
      {
        ...raw,
        generatedAt: new Date().toISOString(),
        sources: [...sources].sort(),
        candidates,
      },
      null,
      2,
    )}\n`,
  )

  console.log(`Seasonal discovery sync — ${pipeline.length} picks`)
  console.log(`  Allowed discovery ids: ${allowedIds.size}`)
  console.log(`  Added: ${added.length}`)
  console.log(`  Updated tags/source: ${updated.length}`)
  console.log(`  Stripped wrong seasonal tags: ${stripped.length}`)
  if (missing.length > 0) {
    console.warn(`  Missing event data for ${missing.length}:`)
    for (const id of missing) console.warn(`    - ${id}`)
  }
  if (added.length > 0) {
    console.log('\nNew rows:')
    for (const row of added) console.log(`  ${row.date}  ${row.title}  ·  ${row.source}`)
  }
}

main()

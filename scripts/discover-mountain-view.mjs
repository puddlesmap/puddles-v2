#!/usr/bin/env node
/**
 * Discovery: Mountain View Public Library (LibCal) events for ages ~0–5.
 *
 * Usage: node scripts/discover-mountain-view.mjs [--days=30] [--skip-admin]
 */
import { inferAgeRangeFromText } from './age-hints.mjs'
import {
  addDaysYmd,
  descriptionWithoutTips,
  extractTipsFromText,
  finalizeTips,
  isUrlAlreadyOnPuddles,
  loadCatalogUrls,
  loadVenueGeo,
  parseArgs,
  pacificTodayYmd,
  printDiscoverySummary,
  resolveVenueGeo,
  sortCandidates,
  stripHtml,
  writeDiscoveryOutputs,
} from './discovery-shared.mjs'

const CALENDAR_ID = 8800
const SOURCE = 'Mountain View Library · LibCal'
const LIST_URL = 'https://mountainview.libcal.com/ajax/calendar/list'

/** LibCal audience ids for ages roughly 0–5 */
const YOUNG_AUDIENCE_IDS = new Set([351, 10658, 352]) // Babies, Toddlers, Preschoolers
const AUDIENCE_QUERY = '351,10658,352'

const TYPE_HINTS = [
  [/storytime|story\s*time|stories|rhymes?/i, 'Stories'],
  [/lego|steam|tinker|build|maker|sleepover/i, 'Build & Explore'],
  [/music|movement|dance|song|puppet/i, 'Music & Movement'],
  [/craft|art|paint|draw/i, 'Arts & Crafts'],
  [/outdoor|park|hike|nature|picnic/i, 'Outdoor'],
]

function ymdFromLibCal(ymd, startdt) {
  if (startdt && /^\d{4}-\d{2}-\d{2}/.test(startdt)) return startdt.slice(0, 10)
  const raw = String(ymd || '')
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
  }
  return ''
}

function timeFromLibCal(dt) {
  if (!dt || dt.length < 16) return ''
  return dt.slice(11, 16)
}

function mapAgeRange(audiences) {
  const names = (audiences || []).map((a) => String(a.name || '').toLowerCase())
  const baby = names.some((n) => /bab(y|ies)/.test(n))
  const toddler = names.some((n) => /toddler/.test(n))
  const preschool = names.some((n) => /preschool|pre-school/.test(n))
  const children = names.some((n) => /^children$/.test(n) || /all ages|families/.test(n))

  const bands = []
  if (baby) bands.push('0–2')
  if (toddler && !bands.includes('0–2')) bands.push('0–2')
  if (toddler || preschool) bands.push('2–5')
  if (children && bands.length === 0) bands.push('0–2', '2–5')

  const unique = [...new Set(bands)]
  if (unique.length === 0) unique.push('0–2', '2–5')

  const ageMin = baby || toddler ? 0 : preschool ? 2 : 0
  const ageMax = preschool || children ? 5 : toddler ? 3 : baby ? 2 : 5
  return { ageRange: unique.join(', '), ageMin, ageMax }
}

function resolveAge(audiences, plainDescription, tipsText) {
  const inferred = inferAgeRangeFromText(`${plainDescription}\n${tipsText || ''}`)
  if (inferred) return inferred
  return mapAgeRange(audiences)
}

function mapActivityTypes(title, description) {
  const haystack = `${title}\n${description}`
  for (const [re, type] of TYPE_HINTS) {
    if (re.test(haystack)) return { types: [type], categoryTags: [] }
  }
  return { types: ['Other'], categoryTags: [] }
}

function isRoomish(name) {
  return /\b(floor|room|auditorium|lobby|gallery|plaza|studio|classroom|hall)\b/i.test(name || '')
}

function resolveVenue(locationName, title, geo) {
  const raw = String(locationName || '').trim()
  if (/magical bridge/i.test(title || '')) {
    const magical = resolveVenueGeo('Magical Bridge Playground at Rengstorff Park', geo)
    if (magical.address || magical.lat != null) {
      return {
        venue: magical.venue,
        room: '',
        address: magical.address,
        city: magical.city || 'Mountain View',
        lat: magical.lat,
        lng: magical.lng,
      }
    }
  }
  if (!raw || /^offsite$/i.test(raw) || isRoomish(raw)) {
    const library = resolveVenueGeo('Mountain View Library', geo)
    return {
      venue: library.venue || 'Mountain View Library',
      room: /^offsite$/i.test(raw) ? '' : raw,
      address: library.address,
      city: library.city || 'Mountain View',
      lat: library.lat,
      lng: library.lng,
    }
  }
  const known = resolveVenueGeo(raw, geo)
  if (known.address || known.lat != null) {
    return {
      venue: known.venue || raw,
      room: '',
      address: known.address,
      city: known.city || 'Mountain View',
      lat: known.lat,
      lng: known.lng,
    }
  }
  const library = resolveVenueGeo('Mountain View Library', geo)
  return {
    venue: raw,
    room: '',
    address: library.address,
    city: 'Mountain View',
    lat: library.lat,
    lng: library.lng,
  }
}

async function fetchDay(dateYmd) {
  const url = `${LIST_URL}?c=${CALENDAR_ID}&date=${dateYmd}&perpage=50&page=1&audience=${AUDIENCE_QUERY}&cats=&camps=&inc=0`
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error(`LibCal fetch failed (${response.status}) ${url}`)
  }
  return response.json()
}

function normalizeCandidate(ev, geo) {
  const date = ymdFromLibCal(ev.ymd, ev.startdt)
  const startTime = timeFromLibCal(ev.startdt)
  const endTime = timeFromLibCal(ev.enddt)
  const plainDescription = stripHtml(ev.description || ev.shortdesc || '')
  const tipsRaw = extractTipsFromText(plainDescription, [])
  const age = resolveAge(ev.audiences, plainDescription, tipsRaw)
  const tips = finalizeTips(tipsRaw)
  const description = descriptionWithoutTips(plainDescription, tipsRaw)
  const { types, categoryTags } = mapActivityTypes(ev.title || '', plainDescription)
  const place = resolveVenue(ev.location || (ev.locations?.[0]?.name ?? ''), ev.title || '', geo)
  const audienceNames = (ev.audiences || []).map((a) => a.name).filter(Boolean)
  const cost = String(ev.registration_cost || '').trim() || 'Free'

  return {
    id: String(ev.id),
    title: ev.title || '',
    date,
    startTime,
    endTime,
    venue: place.venue,
    room: place.room,
    address: place.address,
    city: place.city || 'Mountain View',
    lat: place.lat,
    lng: place.lng,
    ageRange: age.ageRange,
    ageMin: age.ageMin,
    ageMax: age.ageMax,
    audiences: audienceNames.join('; '),
    types,
    categoryTags,
    cost,
    description,
    tips,
    imageUrl: ev.featured_image || '',
    eventUrl: ev.url || `https://mountainview.libcal.com/event/${ev.id}`,
    source: SOURCE,
    isCancelled: false,
    isRecurring: false,
  }
}

function isYoungAudience(audiences) {
  return (audiences || []).some((a) => YOUNG_AUDIENCE_IDS.has(Number(a.id)))
}

export async function discoverMountainView({ days = 30, writeAdmin = true } = {}) {
  const startYmd = pacificTodayYmd()
  const endYmd = addDaysYmd(startYmd, days)
  const geo = loadVenueGeo()
  const catalogUrls = loadCatalogUrls()

  console.log(`Discovering Mountain View Library (LibCal) events ${startYmd} → ${endYmd} (${days} days)…`)

  const byUrl = new Map()
  let daysFetched = 0
  let apiResults = 0

  for (let offset = 0; offset <= days; offset++) {
    const dateYmd = addDaysYmd(startYmd, offset)
    const payload = await fetchDay(dateYmd)
    daysFetched++
    const results = payload.results || []
    apiResults += results.length
    for (const ev of results) {
      if (!isYoungAudience(ev.audiences)) continue
      const candidate = normalizeCandidate(ev, geo)
      if (!candidate.date || candidate.date < startYmd || candidate.date > endYmd) continue
      const key = candidate.eventUrl.replace(/\/$/, '')
      if (!byUrl.has(key)) byUrl.set(key, candidate)
    }
  }

  const candidates = sortCandidates([...byUrl.values()])
  for (const candidate of candidates) {
    candidate.alreadyOnPuddles = isUrlAlreadyOnPuddles(candidate.eventUrl, catalogUrls)
  }

  const newOnly = candidates.filter((c) => !c.alreadyOnPuddles)
  const already = candidates.filter((c) => c.alreadyOnPuddles)

  const payload = {
    generatedAt: new Date().toISOString(),
    library: 'mountainview-libcal',
    source: SOURCE,
    window: { start: startYmd, end: endYmd, days },
    stats: {
      daysFetched,
      apiResults,
      candidates: candidates.length,
      alreadyOnPuddles: already.length,
      newForReview: newOnly.length,
    },
    candidates,
  }

  const paths = writeDiscoveryOutputs({
    fileStem: 'mountain-view',
    payload,
    writeAdmin,
    sourcesToReplace: [SOURCE],
  })

  printDiscoverySummary({
    label: 'Mountain View',
    days,
    stats: payload.stats,
    candidates,
    newOnly,
    paths,
  })

  return payload
}

async function main() {
  const { days, writeAdmin } = parseArgs(process.argv.slice(2), { days: 30 })
  await discoverMountainView({ days, writeAdmin })
}

const isDirectRun = process.argv[1]?.endsWith('discover-mountain-view.mjs')
if (isDirectRun) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}

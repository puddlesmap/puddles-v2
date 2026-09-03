#!/usr/bin/env node
/**
 * Discovery: Santa Clara County Library District events at Los Altos branches
 * (LA + Woodland / WO) for ages ~0–5.
 *
 * Usage: node scripts/discover-los-altos.mjs [--days=30] [--skip-admin]
 */
import { inferAgeRangeFromText } from './age-hints.mjs'
import {
  addDaysYmd,
  descriptionWithoutTips,
  extractTipsFromText,
  finalizeTips,
  isUrlAlreadyOnPuddles,
  loadCatalogUrls,
  parseArgs,
  pacificTodayYmd,
  printDiscoverySummary,
  sortCandidates,
  stripHtml,
  writeDiscoveryOutputs,
  isLibraryClosureNotice,
} from './discovery-shared.mjs'

const LIBRARY = 'sccl'
const GATEWAY = `https://gateway.bibliocommons.com/v2/libraries/${LIBRARY}/events`
const EVENT_URL_PREFIX = `https://${LIBRARY}.bibliocommons.com/events/`
const PAGE_LIMIT = 50
const SOURCE = 'SCCL · Los Altos'
const BRANCH_IDS = new Set(['LA', 'WO'])

/** SCCL audience ids for ages roughly 0–5 */
const YOUNG_AUDIENCE_IDS = new Set([
  '5b28181c4727c7344c796675', // Kids: Babies
  '5b28181c4727c7344c796676', // Kids: Toddlers
  '5b28181c4727c7344c796677', // Kids: Preschoolers
])

const AUDIENCE_BABY = '5b28181c4727c7344c796675'
const AUDIENCE_TODDLER = '5b28181c4727c7344c796676'
const AUDIENCE_PRESCHOOL = '5b28181c4727c7344c796677'
const AUDIENCE_KIDS_K8 = '5b28181c4727c7344c796678'

const TYPE_MAP = {
  Storytimes: 'Stories',
  'Movies & Music': 'Music & Movement',
  Workshops: 'Build & Explore',
  Performance: 'Social & Play',
  Celebrations: 'Festivals & Community',
  SRP: 'Other',
}

async function fetchPage(page) {
  const url = `${GATEWAY}?limit=${PAGE_LIMIT}&page=${page}`
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error(`BiblioCommons fetch failed (${response.status}) ${url}`)
  }
  return response.json()
}

async function fetchAllEvents() {
  const first = await fetchPage(1)
  const pages = first.events?.pagination?.pages ?? 1
  const entities = { ...(first.entities || {}) }
  const items = [...(first.events?.items || [])]

  for (let page = 2; page <= pages; page++) {
    const next = await fetchPage(page)
    items.push(...(next.events?.items || []))
    for (const [bucket, map] of Object.entries(next.entities || {})) {
      entities[bucket] = { ...(entities[bucket] || {}), ...map }
    }
    if (page % 10 === 0) console.log(`  … fetched page ${page}/${pages}`)
  }

  return { items, entities, totalListed: first.events?.pagination?.count ?? items.length }
}

function isYoungAudience(audienceIds) {
  return (audienceIds || []).some((id) => YOUNG_AUDIENCE_IDS.has(id))
}

function mapAgeRange(audienceIds) {
  const ids = new Set(audienceIds || [])
  const baby = ids.has(AUDIENCE_BABY)
  const toddler = ids.has(AUDIENCE_TODDLER)
  const preschool = ids.has(AUDIENCE_PRESCHOOL)
  const kids = ids.has(AUDIENCE_KIDS_K8)

  const bands = []
  if (baby) bands.push('0–2')
  if (toddler && !bands.includes('0–2')) bands.push('0–2')
  if (toddler || preschool) bands.push('2–5')
  if (kids) bands.push('5+')

  const unique = [...new Set(bands)]
  if (unique.length === 0) unique.push('0–2', '2–5')

  let ageMin = baby || toddler ? 0 : preschool ? 2 : 0
  let ageMax = kids || preschool ? 5 : toddler ? 3 : baby ? 2 : 5

  return { ageRange: unique.join(', '), ageMin, ageMax }
}

function resolveAge(audienceIds, plainDescription, tipsText) {
  const inferred = inferAgeRangeFromText(`${plainDescription}\n${tipsText || ''}`)
  if (inferred) return inferred
  return mapAgeRange(audienceIds)
}

function mapActivityTypes(def, entities) {
  const typeNames = (def.typeIds || [])
    .map((id) => entities.eventTypes?.[id]?.name)
    .filter(Boolean)
  const programName = def.programId ? entities.eventPrograms?.[def.programId]?.name : ''
  const title = def.title || ''
  const haystack = `${title} ${programName} ${typeNames.join(' ')}`.toLowerCase()

  if (/storytime|story\s*time/.test(haystack)) {
    return { types: ['Stories'], categoryTags: [...new Set([...typeNames, programName].filter(Boolean))] }
  }
  if (/lego|steam|tinker|build|maker/.test(haystack)) {
    return { types: ['Build & Explore'], categoryTags: [...new Set([...typeNames, programName].filter(Boolean))] }
  }
  if (/music|movement|dance|song|puppet/.test(haystack)) {
    return { types: ['Music & Movement'], categoryTags: [...new Set([...typeNames, programName].filter(Boolean))] }
  }
  if (/craft|art|paint|draw/.test(haystack)) {
    return { types: ['Arts & Crafts'], categoryTags: [...new Set([...typeNames, programName].filter(Boolean))] }
  }
  if (/outdoor|park|hike|nature/.test(haystack)) {
    return { types: ['Outdoor'], categoryTags: [...new Set([...typeNames, programName].filter(Boolean))] }
  }

  const mapped = new Set()
  for (const name of typeNames) {
    if (TYPE_MAP[name]) mapped.add(TYPE_MAP[name])
  }
  const types = [...mapped]
  if (types.length === 0) types.push('Other')
  const categoryTags = [...new Set([...typeNames, programName].filter(Boolean))]
  return { types, categoryTags }
}

function formatBranchAddress(location) {
  const a = location?.address
  if (!a) return ''
  const street = [a.number, a.street].filter(Boolean).join(' ').trim()
  if (street && a.city && a.state && a.zip) {
    return `${street}, ${a.city}, ${a.state} ${a.zip}`
  }
  const cityLine = [a.city, a.state, a.zip].filter(Boolean).join(', ').replace(', ,', ',')
  return [street, cityLine].filter(Boolean).join(', ')
}

function extractTips(def, plainDescription) {
  const reg = def.registrationInfo || {}
  const registrationTips = []
  for (const field of ['instructions', 'onlineInstructions', 'instructionsToAttend']) {
    const text = stripHtml(reg[field])
    if (text) registrationTips.push(text)
  }
  if (reg.isFull) registrationTips.push('This session is currently full')
  if (reg.waitlistEnabled) registrationTips.push('A waitlist may be available')
  if (reg.loginToRegister) registrationTips.push('Library login is required to register')
  if (Array.isArray(reg.enabledMethods) && reg.enabledMethods.length > 0) {
    registrationTips.push('Registration is required')
  } else if (
    reg.cap ||
    reg.maxSeats ||
    (reg.registrationStart?.windowType === 'RELATIVE' && (reg.registrationStart?.ordinal ?? 0) > 0)
  ) {
    registrationTips.push(
      reg.cap
        ? `Space is limited (${reg.cap} seats) — check the official page for registration`
        : 'Check the official page for registration or capacity limits',
    )
  }
  return extractTipsFromText(plainDescription, registrationTips)
}

function resolveImageUrl(def, entities) {
  const image = entities.images?.[def.featuredImageId]
  if (!image) return ''
  const full = image.sizes?.find((s) => s.key === 'full')
  return full?.url || image.url || ''
}

function normalizeCandidate(event, entities) {
  const def = event.definition || {}
  const startLocal = def.start || ''
  const endLocal = def.end || ''
  const date = startLocal.slice(0, 10)
  const startTime = startLocal.length >= 16 ? startLocal.slice(11, 16) : ''
  const endTime = endLocal.length >= 16 ? endLocal.slice(11, 16) : ''
  const audienceNames = (def.audienceIds || [])
    .map((id) => entities.eventAudiences?.[id]?.name)
    .filter(Boolean)
  const branchId = def.branchLocationId
  const location = entities.locations?.[branchId]
  const venue = location?.name || branchId || ''
  const room = def.locationDetails || ''
  const eventUrl = `${EVENT_URL_PREFIX}${event.id}`
  const plainDescription = stripHtml(def.description)
  const tipsRaw = extractTips(def, plainDescription)
  const age = resolveAge(def.audienceIds, plainDescription, tipsRaw)
  const tips = finalizeTips(tipsRaw)
  const description = descriptionWithoutTips(plainDescription, tipsRaw)
  const { types, categoryTags } = mapActivityTypes(def, entities)
  const address = formatBranchAddress(location)
  const lat = location?.mapLocation?.centrePoint?.lat ?? null
  const lng = location?.mapLocation?.centrePoint?.lng ?? null

  return {
    id: event.id,
    title: def.title || '',
    date,
    startTime,
    endTime,
    venue,
    room,
    address,
    city: location?.address?.city || 'Los Altos',
    lat,
    lng,
    ageRange: age.ageRange,
    ageMin: age.ageMin,
    ageMax: age.ageMax,
    audiences: audienceNames.join('; '),
    types,
    categoryTags,
    cost: 'Free',
    description,
    tips,
    imageUrl: resolveImageUrl(def, entities),
    eventUrl,
    source: SOURCE,
    isCancelled: Boolean(def.isCancelled),
    isRecurring: Boolean(event.isRecurring),
  }
}

export async function discoverLosAltos({ days = 30, writeAdmin = true } = {}) {
  const startYmd = pacificTodayYmd()
  const endYmd = addDaysYmd(startYmd, days)

  console.log(`Discovering Los Altos (SCCL LA+WO) events ${startYmd} → ${endYmd} (${days} days)…`)

  const { items, entities, totalListed } = await fetchAllEvents()
  const catalogUrls = loadCatalogUrls()

  let inWindow = 0
  let atBranch = 0
  let young = 0
  let cancelled = 0
  const candidates = []

  for (const id of items) {
    const event = entities.events?.[id]
    if (!event) continue
    const def = event.definition || {}
    if (def.isCancelled) {
      cancelled++
      continue
    }
    const date = (def.start || '').slice(0, 10)
    if (!date || date < startYmd || date > endYmd) continue
    inWindow++
    if (!BRANCH_IDS.has(def.branchLocationId)) continue
    atBranch++
    if (!isYoungAudience(def.audienceIds)) continue
    young++

    const candidate = normalizeCandidate(event, entities)
    if (isLibraryClosureNotice(candidate)) continue
    candidate.alreadyOnPuddles = isUrlAlreadyOnPuddles(candidate.eventUrl, catalogUrls)
    candidates.push(candidate)
  }

  sortCandidates(candidates)
  const newOnly = candidates.filter((c) => !c.alreadyOnPuddles)
  const already = candidates.filter((c) => c.alreadyOnPuddles)

  const payload = {
    generatedAt: new Date().toISOString(),
    library: LIBRARY,
    source: SOURCE,
    window: { start: startYmd, end: endYmd, days },
    stats: {
      apiListed: totalListed,
      fetchedIds: items.length,
      inWindow,
      losAltosBranchesInWindow: atBranch,
      youngAudienceInWindow: young,
      cancelledSkipped: cancelled,
      candidates: candidates.length,
      alreadyOnPuddles: already.length,
      newForReview: newOnly.length,
    },
    candidates,
  }

  const paths = writeDiscoveryOutputs({
    fileStem: 'los-altos',
    payload,
    writeAdmin,
    sourcesToReplace: [SOURCE],
  })

  printDiscoverySummary({
    label: 'Los Altos',
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
  await discoverLosAltos({ days, writeAdmin })
}

const isDirectRun = process.argv[1]?.endsWith('discover-los-altos.mjs')
if (isDirectRun) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}

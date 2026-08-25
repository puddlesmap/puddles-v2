#!/usr/bin/env node
/**
 * Phase 0/1 discovery: pull Palo Alto Library (BiblioCommons) events for the next
 * N days, keep ages 0–5 audiences, dedupe against the committed catalog, write
 * review files under data/discovery/ and Admin queue at
 * src/data/discovery-candidates.json.
 *
 * Usage: node scripts/discover-palo-alto.mjs [--days=14]
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inferAgeRangeFromText } from './age-hints.mjs'
import { finalizeTips, isUrlAlreadyOnPuddles, loadCatalogUrls } from './discovery-shared.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

const LIBRARY = 'paloalto'
const GATEWAY = `https://gateway.bibliocommons.com/v2/libraries/${LIBRARY}/events`
const EVENT_URL_PREFIX = `https://${LIBRARY}.bibliocommons.com/events/`
const PAGE_LIMIT = 50
const DEFAULT_DAYS = 14

/** BiblioCommons audience ids for ages roughly 0–5 */
const YOUNG_AUDIENCE_IDS = new Set([
  '59a6e0705e7f62711a36e6ae', // Babies (under 2)
  '59a6e0705e7f62711a36e6ad', // Toddlers (18 mos. to 3 yrs)
  '59a6e0705e7f62711a36e6ac', // Pre-schoolers (3-5)
])

const AUDIENCE_BABY = '59a6e0705e7f62711a36e6ae'
const AUDIENCE_TODDLER = '59a6e0705e7f62711a36e6ad'
const AUDIENCE_PRESCHOOL = '59a6e0705e7f62711a36e6ac'
const AUDIENCE_KIDS_6_11 = '59a6e0705e7f62711a36e6ab'

/** Map BiblioCommons event type names → Puddles activity types */
const TYPE_MAP = {
  Storytimes: 'Stories',
  'Movies & Music': 'Music & Movement',
  Workshops: 'Build & Explore',
  Performance: 'Social & Play',
  Celebrations: 'Social & Play',
  SRP: 'Other',
}

/** Practical / parent-prep sentences → Good to know (tips) */
const TIP_SENTENCE_RE =
  /\b(bring (a |your )?(small )?blanket|lawn\s*chairs?|yoga\s*mats?|meditation cushions?|regist(?:er|ration)|sign[\s-]?up|rsvp|tickets?|weather dependent|indoors? or outdoors?|indoor\/outdoor|accompanied by|caregivers?|first[\s-]come|space is limited|no registration|walk[\s-]?ins|pre[\s-]?register|costumes?(?: and accessories)? encouraged|legos? will stay|must be accompanied|children under \d+|recommended age)\b/i

const TIP_EXCLUDE_RE =
  /\b(imagination|steam|early childhood development|problem solving|self-confidence|oceans of possibilities|earn badges)\b/i

function parseArgs(argv) {
  let days = DEFAULT_DAYS
  let writeAdmin = true
  for (const arg of argv) {
    const match = arg.match(/^--days=(\d+)$/)
    if (match) days = Number(match[1])
    if (arg === '--skip-admin') writeAdmin = false
  }
  return { days, writeAdmin }
}

function pacificTodayYmd() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function addDaysYmd(ymd, days) {
  const [y, m, d] = ymd.split('-').map(Number)
  const utc = new Date(Date.UTC(y, m - 1, d))
  utc.setUTCDate(utc.getUTCDate() + days)
  return utc.toISOString().slice(0, 10)
}

function stripHtml(html) {
  return String(html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function splitSentences(text) {
  return String(text ?? '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12)
}

function csvEscape(value) {
  const text = String(value ?? '')
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
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
  const kids = ids.has(AUDIENCE_KIDS_6_11)

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

  // Prefer title/program cues so "Workshops" alone doesn't mis-tag ballet/puppets as Build & Explore.
  if (/storytime|story\s*time/.test(haystack)) return { types: ['Stories'], categoryTags: [...new Set([...typeNames, programName].filter(Boolean))] }
  if (/lego|steam|tinker|build/.test(haystack)) return { types: ['Build & Explore'], categoryTags: [...new Set([...typeNames, programName].filter(Boolean))] }
  if (/music|movement|dance|song|puppet/.test(haystack)) return { types: ['Music & Movement'], categoryTags: [...new Set([...typeNames, programName].filter(Boolean))] }
  if (/craft|art|paint|draw/.test(haystack)) return { types: ['Arts & Crafts'], categoryTags: [...new Set([...typeNames, programName].filter(Boolean))] }
  if (/outdoor|park|hike|nature/.test(haystack)) return { types: ['Outdoor'], categoryTags: [...new Set([...typeNames, programName].filter(Boolean))] }

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
  const cityLine = [a.city, a.state, a.zip].filter(Boolean).join(', ').replace(', ,', ',')
  // Prefer "1213 Newell Rd., Palo Alto, CA 94303"
  if (street && a.city && a.state && a.zip) {
    return `${street}, ${a.city}, ${a.state} ${a.zip}`
  }
  return [street, cityLine].filter(Boolean).join(', ')
}

/**
 * Pull practical parent notes into tips ("Good to know"): registration,
 * bring-a-blanket, weather/indoor-outdoor, age accompaniment, space limits, etc.
 */
function extractTips(def, plainDescription) {
  const tips = []
  const seen = new Set()

  function addTip(raw) {
    const tip = String(raw ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\.$/, '')
    if (tip.length < 8) return
    const key = tip.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    tips.push(/[.!?]$/.test(tip) ? tip : `${tip}.`)
  }

  const reg = def.registrationInfo || {}
  for (const field of ['instructions', 'onlineInstructions', 'instructionsToAttend']) {
    const text = stripHtml(reg[field])
    if (text) addTip(text.slice(0, 280))
  }
  if (reg.isFull) addTip('This session is currently full')
  if (reg.waitlistEnabled) addTip('A waitlist may be available')
  if (reg.loginToRegister) addTip('Library login is required to register')
  if (Array.isArray(reg.enabledMethods) && reg.enabledMethods.length > 0) {
    addTip('Registration is required')
  } else if (
    reg.cap ||
    reg.maxSeats ||
    (reg.registrationStart?.windowType === 'RELATIVE' && (reg.registrationStart?.ordinal ?? 0) > 0)
  ) {
    addTip(
      reg.cap
        ? `Space is limited (${reg.cap} seats) — check the official page for registration`
        : 'Check the official page for registration or capacity limits',
    )
  }

  for (const sentence of splitSentences(plainDescription)) {
    if (TIP_EXCLUDE_RE.test(sentence)) continue
    if (TIP_SENTENCE_RE.test(sentence)) addTip(sentence.slice(0, 280))
  }

  return tips.join('\n')
}

/** Keep description as the activity pitch; drop sentences already used as tips. */
function descriptionWithoutTips(plainDescription, tipsText) {
  if (!tipsText) return plainDescription
  const tipKeys = tipsText
    .split('\n')
    .map((t) => t.toLowerCase().replace(/\.$/, '').slice(0, 40))
  const kept = splitSentences(plainDescription).filter((sentence) => {
    const key = sentence.toLowerCase().slice(0, 40)
    return !tipKeys.some((tip) => key.includes(tip.slice(0, 30)) || tip.includes(key.slice(0, 30)))
  })
  return kept.length ? kept.join(' ') : plainDescription
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
    city: location?.address?.city || 'Palo Alto',
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
    source: 'Palo Alto Library · BiblioCommons',
    isCancelled: Boolean(def.isCancelled),
    isRecurring: Boolean(event.isRecurring),
  }
}

function toCsv(rows) {
  const headers = [
    'date',
    'startTime',
    'endTime',
    'title',
    'venue',
    'room',
    'address',
    'ageRange',
    'types',
    'cost',
    'tips',
    'audiences',
    'eventUrl',
    'alreadyOnPuddles',
    'description',
  ]
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(
      headers
        .map((key) => {
          if (key === 'alreadyOnPuddles') return csvEscape(row.alreadyOnPuddles ? 'yes' : 'no')
          if (key === 'types') return csvEscape((row.types || []).join('; '))
          return csvEscape(row[key])
        })
        .join(','),
    )
  }
  return `${lines.join('\n')}\n`
}

async function main() {
  const { days, writeAdmin } = parseArgs(process.argv.slice(2))
  const startYmd = pacificTodayYmd()
  const endYmd = addDaysYmd(startYmd, days)

  console.log(`Discovering Palo Alto Library events ${startYmd} → ${endYmd} (${days} days)…`)

  const { items, entities, totalListed } = await fetchAllEvents()
  const catalogUrls = loadCatalogUrls()

  let inWindow = 0
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
    if (!isYoungAudience(def.audienceIds)) continue
    young++

    const candidate = normalizeCandidate(event, entities)
    candidate.alreadyOnPuddles = isUrlAlreadyOnPuddles(candidate.eventUrl, catalogUrls)
    candidates.push(candidate)
  }

  candidates.sort(
    (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime) || a.title.localeCompare(b.title),
  )

  const newOnly = candidates.filter((c) => !c.alreadyOnPuddles)
  const already = candidates.filter((c) => c.alreadyOnPuddles)

  const outDir = join(rootDir, 'data/discovery')
  mkdirSync(outDir, { recursive: true })
  const stamp = startYmd
  const jsonPath = join(outDir, `palo-alto-${stamp}.json`)
  const csvPath = join(outDir, `palo-alto-${stamp}.csv`)
  const newCsvPath = join(outDir, `palo-alto-${stamp}-new-only.csv`)

  const payload = {
    generatedAt: new Date().toISOString(),
    library: LIBRARY,
    window: { start: startYmd, end: endYmd, days },
    stats: {
      apiListed: totalListed,
      fetchedIds: items.length,
      inWindow,
      youngAudienceInWindow: young,
      cancelledSkipped: cancelled,
      candidates: candidates.length,
      alreadyOnPuddles: already.length,
      newForReview: newOnly.length,
    },
    candidates,
  }

  writeFileSync(jsonPath, JSON.stringify(payload, null, 2))
  writeFileSync(csvPath, toCsv(candidates))
  writeFileSync(newCsvPath, toCsv(newOnly))

  const adminPath = join(rootDir, 'src/data/discovery-candidates.json')
  if (writeAdmin) {
    const adminPayload = {
      ...payload,
      candidates: candidates.map((c) => ({
        ...c,
        reviewStatus: 'pending',
        convertedEventId: '',
        lastChecked: '',
      })),
    }
    writeFileSync(adminPath, `${JSON.stringify(adminPayload, null, 2)}\n`)
  }

  console.log('')
  console.log('Stats')
  console.log(`  API listed:              ${totalListed}`)
  console.log(`  In ${days}-day window:   ${inWindow}`)
  console.log(`  Ages 0–5 audiences:      ${young}`)
  console.log(`  Candidates:              ${candidates.length}`)
  console.log(`  Already on Puddles:      ${already.length}`)
  console.log(`  New for review:          ${newOnly.length}`)
  console.log(`  With Good-to-know tips:  ${candidates.filter((c) => c.tips).length}`)
  console.log('')
  console.log('Wrote')
  console.log(`  ${jsonPath}`)
  console.log(`  ${csvPath}`)
  console.log(`  ${newCsvPath}`)
  if (writeAdmin) console.log(`  ${adminPath}`)
  else console.log('  (admin queue skipped — --skip-admin)')
  console.log('')
  console.log('Sample enriched rows (tips = Good to know):')
  for (const row of candidates.slice(0, 8)) {
    console.log(`  ${row.date} ${row.startTime}  ${row.title}`)
    console.log(`    cost=${row.cost}  ages=${row.ageRange}  types=${(row.types || []).join(', ')}`)
    console.log(`    ${row.venue}${row.room ? ` · ${row.room}` : ''}  |  ${row.address}`)
    console.log(`    tips: ${row.tips ? row.tips.replace(/\n/g, ' · ') : '(none)'}`)
  }
  if (newOnly.length > 0) {
    console.log('')
    console.log('New for review:')
    for (const row of newOnly.slice(0, 25)) {
      console.log(`  ${row.date} ${row.startTime}  ${row.title}  ·  ${row.venue}`)
    }
    if (newOnly.length > 25) console.log(`  … +${newOnly.length - 25} more`)
  } else {
    console.log('')
    console.log('No brand-new URLs this window (all candidates already on Puddles).')
  }
  console.log('')
  console.log('Review in Admin → Discovery (/admin/discovery)')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

/**
 * Shared helpers for library discovery scripts (Palo Alto / Los Altos / Mountain View).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  inferAgeRangeFromText,
  isAgeTargetingSentence,
  isOutsidePuddlesAgeScope,
} from './age-hints.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const rootDir = join(__dirname, '..')

export const DEFAULT_DAYS = 14

/** Practical / parent-prep sentences → Good to know (tips) */
export const TIP_SENTENCE_RE =
  /\b(bring (a |your )?(small )?blanket|lawn\s*chairs?|yoga\s*mats?|meditation cushions?|regist(?:er|ration)|sign[\s-]?up|rsvp|tickets?|weather dependent|inclement weather|weather permitting|no performances during|events? are weather|rain or shine|cancelled due to weather|canceled due to weather|indoors? or outdoors?|indoor\/outdoor|accompanied by|caregivers?|first[\s-]come|space is limited|no registration|walk[\s-]?ins|pre[\s-]?register|costumes?(?: and accessories)? encouraged|legos? will stay|must be accompanied|children under \d+|recommended age)\b/i

export const TIP_EXCLUDE_RE =
  /\b(imagination|steam|early childhood development|problem solving|self-confidence|oceans of possibilities|earn badges)\b/i

export function parseArgs(argv, defaults = {}) {
  let days = defaults.days ?? DEFAULT_DAYS
  let writeAdmin = defaults.writeAdmin !== false
  for (const arg of argv) {
    const match = arg.match(/^--days=(\d+)$/)
    if (match) days = Number(match[1])
    if (arg === '--skip-admin') writeAdmin = false
    if (arg === '--write-admin') writeAdmin = true
  }
  return { days, writeAdmin }
}

export function pacificTodayYmd() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function addDaysYmd(ymd, days) {
  const [y, m, d] = ymd.split('-').map(Number)
  const utc = new Date(Date.UTC(y, m - 1, d))
  utc.setUTCDate(utc.getUTCDate() + days)
  return utc.toISOString().slice(0, 10)
}

export function stripHtml(html) {
  return String(html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rdquo;/g, '”')
    .replace(/&ldquo;/g, '“')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

export function splitSentences(text) {
  return String(text ?? '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12)
}

export function csvEscape(value) {
  const text = String(value ?? '')
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function loadCatalogUrls() {
  const path = join(rootDir, 'src/data/sheet-events.json')
  const events = JSON.parse(readFileSync(path, 'utf8'))
  const urls = new Set()
  for (const event of events) {
    const url = event.eventUrl?.trim()
    if (url) urls.add(url.replace(/\/$/, ''))
  }
  return urls
}

export function loadVenueGeo() {
  try {
    return JSON.parse(readFileSync(join(rootDir, 'data/venue-geo.json'), 'utf8'))
  } catch {
    return { venueAliases: {}, venueGeo: {}, venueAddresses: {} }
  }
}

export function resolveVenueGeo(venueName, geo) {
  const aliases = geo.venueAliases || {}
  const venues = geo.venueGeo || {}
  const addresses = geo.venueAddresses || {}
  const canonical = aliases[venueName] || venueName
  const coords = venues[canonical] || venues[venueName] || null
  const address = addresses[canonical] || addresses[venueName] || ''
  return {
    venue: canonical || venueName || '',
    address,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    city: coords?.city || '',
  }
}

export function extractTipsFromText(plainDescription, registrationTips = []) {
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

  for (const raw of registrationTips) addTip(String(raw).slice(0, 280))

  for (const sentence of splitSentences(plainDescription)) {
    if (TIP_EXCLUDE_RE.test(sentence)) continue
    if (TIP_SENTENCE_RE.test(sentence)) addTip(sentence.slice(0, 280))
  }

  return tips.join('\n')
}

export function descriptionWithoutTips(plainDescription, tipsText) {
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

/**
 * Soft-imperative Puddles voice for Good-to-know tips.
 * Keep friendly prep lines (“Bring a blanket”); drop library “we/our” and hype.
 */
export function voiceTipLine(raw) {
  let tip = String(raw ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!tip) return ''

  // Never surface Admin/ops notes as parent tips.
  if (
    /\b(approve this|retire\/?update|duplicate(?:d)? row|events row|convertedEventId|refresh from sheet)\b/i.test(
      tip,
    )
  ) {
    return ''
  }

  tip = tip
    // Limited space / tickets (library “we”)
    .replace(
      /\bDue to limited space,\s*we will begin handing out free tickets\b/gi,
      'Space is limited — free tickets are handed out',
    )
    .replace(/\bwe will begin handing out free tickets\b/gi, 'Free tickets are handed out')
    .replace(/\bwe will (begin|start) handing out\b/gi, 'Tickets are handed out')
    // Invitations / library narrator
    .replace(/\bWe invite all\b/gi, 'For')
    .replace(/\bWe invite\b/gi, 'For')
    .replace(/\band their amazing caregivers\b/gi, 'and caregivers')
    .replace(
      /\bStick around afterward for our popular\s*["“]?Stay\s*&\s*Play["”]?\s*session\b[^.!?]*[.!]?/gi,
      'Stay & Play follows afterward.',
    )
    .replace(/\bour popular\s*["“]?Stay\s*&\s*Play["”]?\b/gi, 'Stay & Play')
    .replace(/\bour Children's Librarians\b/gi, "children's librarians")
    .replace(/\bwith our Children's Librarians\b/gi, "with children's librarians")
    .replace(/\bhelp celebrate\b/gi, 'celebrate')
    .replace(/\bPlease feel free to bring\b/gi, 'Bring')
    .replace(/\bfeel free to bring\b/gi, 'Bring')
    .replace(/\bfor your baby['’]?s? comfort\b/gi, 'for comfort')
    // Encouragement → soft imperative
    .replace(/\bParticipants are encouraged to bring their own\b/gi, 'Bring')
    .replace(/\bare encouraged to bring their own\b/gi, 'Bring')
    .replace(/\bare encouraged to bring (a|an|the)\b/gi, 'Bring $1')
    .replace(/\bare encouraged to\b/gi, '')
    .replace(/\bPlease be sure to\b/gi, '')
    .replace(
      /\bLEGOs? will stay at the library,?\s*so (be sure to |please )?snap a pic of your creation!?\b/gi,
      'LEGOs stay at the library — snap a pic of creations.',
    )
    .replace(/\bbe sure to\b/gi, '')
    .replace(/\bsnap a pic of your creation\b/gi, 'snap a pic of creations')
    // Registration / drop-in phrasing (keep mid-sentence lowercase)
    .replace(/\bno registration is required\b/gi, 'no registration required')
    .replace(/\bNo sign-up, just show up!\b/gi, 'No sign-up — just show up.')
    // Accompaniment
    .replace(
      /\bChildren under (\d+) years? old must be accompanied by an adult\b/gi,
      'Kids under $1 need an adult with them',
    )
    .replace(
      /\bYoung children must be accompanied by an adult crafting buddy\b/gi,
      'Young kids need an adult crafting buddy',
    )
    .replace(/\bmust be accompanied by an adult\b/gi, 'need an adult with them')
    // LEGO stay-behind (fallback if not caught above)
    .replace(/\bLEGOs? will stay at the library\b/gi, 'LEGOs stay at the library')
    // Cleanup leftover narrator crumbs
    .replace(/\bto jump into an interactive\b/gi, '—')
    .replace(/\bjump into an interactive\b/gi, '')
    .replace(/\b(\d+)\s*minutes of:\.?/gi, 'about $1 minutes')
    .replace(/\band caregivers to enjoy\b/gi, 'and caregivers —')

  tip = tip
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,;:])/g, '$1')
    .replace(/\s+\./g, '.')
    .replace(/\.\s*\./g, '.')
    .replace(/!\./g, '!')
    .replace(/\.\s*!/g, '!')
    .replace(/follows\.,/gi, 'follows.')
    .replace(/^[,;:\s—-]+/, '')
    .replace(/\s+—\s+—/g, ' — ')
    .replace(/\s+—\s*\./g, '.')
    .trim()

  if (tip.length < 8) return ''
  if (!/[.!?]$/.test(tip)) tip = `${tip}.`
  // Capitalize first letter after rewrites that may have lowercased a mid-sentence fragment.
  tip = tip.charAt(0).toUpperCase() + tip.slice(1)
  return tip
}

/** Filter age-only lines and apply Puddles tip voice. */
export function finalizeTips(tipsRaw) {
  return String(tipsRaw || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !(inferAgeRangeFromText(line) && isAgeTargetingSentence(line)))
    .map(voiceTipLine)
    .filter(Boolean)
    .filter((line, index, all) => {
      const key = line.toLowerCase()
      return all.findIndex((other) => other.toLowerCase() === key) === index
    })
    .join('\n')
}

export function toCsv(rows) {
  const headers = [
    'date',
    'startTime',
    'endTime',
    'title',
    'venue',
    'room',
    'address',
    'city',
    'ageRange',
    'types',
    'cost',
    'tips',
    'audiences',
    'eventUrl',
    'alreadyOnPuddles',
    'source',
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

export function sortCandidates(candidates) {
  candidates.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.startTime.localeCompare(b.startTime) ||
      a.title.localeCompare(b.title),
  )
  return candidates
}

export const DISCOVERY_ADMIN_PATH = join(rootDir, 'src/data/discovery-candidates.json')

export function normalizeDiscoveryEventUrl(url) {
  return String(url || '').trim().replace(/\/$/, '')
}

export function indexDiscoveryCandidatesByIdentity(candidates) {
  const byId = new Map()
  const byUrl = new Map()
  for (const candidate of candidates) {
    if (candidate?.id) byId.set(candidate.id, candidate)
    const normalizedUrl = normalizeDiscoveryEventUrl(candidate?.eventUrl)
    if (normalizedUrl) byUrl.set(normalizedUrl, candidate)
  }
  return { byId, byUrl }
}

export function findPreviousDiscoveryCandidate(candidate, index) {
  if (!candidate) return null
  return (
    index.byId.get(candidate.id) ||
    index.byUrl.get(normalizeDiscoveryEventUrl(candidate.eventUrl)) ||
    null
  )
}

/** Keep Admin review fields when re-scraping the same library event. */
export function mergeDiscoveryCandidateReviewFields(fresh, previous) {
  if (!previous) {
    return {
      ...fresh,
      reviewStatus: fresh.reviewStatus ?? 'pending',
      convertedEventId: fresh.convertedEventId ?? '',
      lastChecked: fresh.lastChecked ?? '',
    }
  }
  return {
    ...fresh,
    reviewStatus: previous.reviewStatus ?? fresh.reviewStatus ?? 'pending',
    convertedEventId: previous.convertedEventId ?? fresh.convertedEventId ?? '',
    lastChecked: previous.lastChecked ?? fresh.lastChecked ?? '',
  }
}

export function mergeDiscoveryCandidatesPreservingReview(freshCandidates, existingCandidates = []) {
  const index = indexDiscoveryCandidatesByIdentity(existingCandidates)
  return freshCandidates.map((candidate) =>
    mergeDiscoveryCandidateReviewFields(
      candidate,
      findPreviousDiscoveryCandidate(candidate, index),
    ),
  )
}

export function loadExistingDiscoveryCandidates(adminPath = DISCOVERY_ADMIN_PATH) {
  try {
    const prev = JSON.parse(readFileSync(adminPath, 'utf8'))
    return Array.isArray(prev.candidates) ? prev.candidates : []
  } catch {
    return []
  }
}

export function summarizeDiscoveryCandidateStats(candidates) {
  return {
    candidates: candidates.length,
    alreadyOnPuddles: candidates.filter((c) => c.alreadyOnPuddles).length,
    newForReview: candidates.filter((c) => !c.alreadyOnPuddles).length,
    bySource: Object.fromEntries(
      [...new Set(candidates.map((c) => c.source))].map((source) => [
        source,
        candidates.filter((c) => c.source === source).length,
      ]),
    ),
  }
}

/**
 * Write dated review files under data/discovery/ and optionally merge into
 * src/data/discovery-candidates.json (replacing candidates with the same source).
 */
export function writeDiscoveryOutputs({
  fileStem,
  payload,
  writeAdmin = true,
  sourcesToReplace = [],
}) {
  const outDir = join(rootDir, 'data/discovery')
  mkdirSync(outDir, { recursive: true })
  const stamp = payload.window?.start || pacificTodayYmd()
  const jsonPath = join(outDir, `${fileStem}-${stamp}.json`)
  const csvPath = join(outDir, `${fileStem}-${stamp}.csv`)
  const newCsvPath = join(outDir, `${fileStem}-${stamp}-new-only.csv`)
  const rawCandidates = payload.candidates || []
  const skippedOutOfAge = rawCandidates.filter((c) => isOutsidePuddlesAgeScope(c))
  const candidates = rawCandidates.filter((c) => !isOutsidePuddlesAgeScope(c))
  if (skippedOutOfAge.length > 0) {
    console.log(
      `  Skipped ${skippedOutOfAge.length} candidate(s) outside Puddles ages 0–5`,
    )
  }
  const newOnly = candidates.filter((c) => !c.alreadyOnPuddles)

  const filteredPayload = { ...payload, candidates }

  writeFileSync(jsonPath, JSON.stringify(filteredPayload, null, 2))
  writeFileSync(csvPath, toCsv(candidates))
  writeFileSync(newCsvPath, toCsv(newOnly))

  let adminPath = ''
  if (writeAdmin) {
    adminPath = join(rootDir, 'src/data/discovery-candidates.json')
    const replaceSet = new Set(
      sourcesToReplace.length
        ? sourcesToReplace
        : [...new Set(rawCandidates.map((c) => c.source))],
    )
    let existing = []
    try {
      const prev = JSON.parse(readFileSync(adminPath, 'utf8'))
      existing = Array.isArray(prev.candidates) ? prev.candidates : []
    } catch {
      existing = []
    }
    const kept = existing
      .filter((c) => !replaceSet.has(c.source))
      .filter((c) => !isOutsidePuddlesAgeScope(c))
    const previousForSource = existing.filter((c) => replaceSet.has(c.source))
    const mergedCandidates = [
      ...kept,
      ...mergeDiscoveryCandidatesPreservingReview(candidates, previousForSource),
    ]
    mergedCandidates.sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.startTime.localeCompare(b.startTime) ||
        a.title.localeCompare(b.title),
    )
    const adminPayload = {
      generatedAt: new Date().toISOString(),
      libraries: payload.libraries || [payload.library].filter(Boolean),
      window: payload.window,
      stats: {
        ...(payload.stats || {}),
        candidates: mergedCandidates.length,
        alreadyOnPuddles: mergedCandidates.filter((c) => c.alreadyOnPuddles).length,
        newForReview: mergedCandidates.filter((c) => !c.alreadyOnPuddles).length,
        bySource: Object.fromEntries(
          [...new Set(mergedCandidates.map((c) => c.source))].map((source) => [
            source,
            mergedCandidates.filter((c) => c.source === source).length,
          ]),
        ),
      },
      candidates: mergedCandidates,
    }
    writeFileSync(adminPath, `${JSON.stringify(adminPayload, null, 2)}\n`)
  }

  return { jsonPath, csvPath, newCsvPath, adminPath, newOnly }
}

export function printDiscoverySummary({ label, days, stats, candidates, newOnly, paths }) {
  console.log('')
  console.log(`${label} stats`)
  for (const [key, value] of Object.entries(stats || {})) {
    console.log(`  ${key}: ${value}`)
  }
  console.log(`  With Good-to-know tips:  ${candidates.filter((c) => c.tips).length}`)
  console.log('')
  console.log('Wrote')
  for (const path of [paths?.jsonPath, paths?.csvPath, paths?.newCsvPath, paths?.adminPath].filter(
    Boolean,
  )) {
    console.log(`  ${path}`)
  }
  console.log('')
  console.log('Sample enriched rows:')
  for (const row of candidates.slice(0, 8)) {
    console.log(`  ${row.date} ${row.startTime}  ${row.title}`)
    console.log(`    cost=${row.cost}  ages=${row.ageRange}  types=${(row.types || []).join(', ')}`)
    console.log(`    ${row.venue}${row.room ? ` · ${row.room}` : ''}  |  ${row.city}`)
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
    console.log(`No brand-new URLs in this ${days}-day window (all candidates already on Puddles).`)
  }
  console.log('')
  console.log('Review in Admin → Discovery (/admin/discovery)')
}

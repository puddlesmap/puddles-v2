/**
 * Shared helpers for library discovery scripts (Palo Alto / Los Altos / Mountain View).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  inferAgeRangeFromText,
  isAgeTargetingSentence,
} from './age-hints.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const rootDir = join(__dirname, '..')

export const DEFAULT_DAYS = 14

/** Practical / parent-prep sentences → Good to know (tips) */
export const TIP_SENTENCE_RE =
  /\b(bring (a |your )?(small )?blanket|lawn\s*chairs?|yoga\s*mats?|meditation cushions?|regist(?:er|ration)|sign[\s-]?up|rsvp|tickets?|weather dependent|indoors? or outdoors?|indoor\/outdoor|accompanied by|caregivers?|first[\s-]come|space is limited|no registration|walk[\s-]?ins|pre[\s-]?register|costumes?(?: and accessories)? encouraged|legos? will stay|must be accompanied|children under \d+|recommended age)\b/i

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
  if (!tipsText) return plainDescription.slice(0, 500)
  const tipKeys = tipsText
    .split('\n')
    .map((t) => t.toLowerCase().replace(/\.$/, '').slice(0, 40))
  const kept = splitSentences(plainDescription).filter((sentence) => {
    const key = sentence.toLowerCase().slice(0, 40)
    return !tipKeys.some((tip) => key.includes(tip.slice(0, 30)) || tip.includes(key.slice(0, 30)))
  })
  return (kept.length ? kept.join(' ') : plainDescription).slice(0, 500)
}

export function finalizeTips(tipsRaw) {
  return tipsRaw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !(inferAgeRangeFromText(line) && isAgeTargetingSentence(line)))
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
  const candidates = payload.candidates || []
  const newOnly = candidates.filter((c) => !c.alreadyOnPuddles)

  writeFileSync(jsonPath, JSON.stringify(payload, null, 2))
  writeFileSync(csvPath, toCsv(candidates))
  writeFileSync(newCsvPath, toCsv(newOnly))

  let adminPath = ''
  if (writeAdmin) {
    adminPath = join(rootDir, 'src/data/discovery-candidates.json')
    const replaceSet = new Set(sourcesToReplace.length ? sourcesToReplace : [...new Set(candidates.map((c) => c.source))])
    let existing = []
    try {
      const prev = JSON.parse(readFileSync(adminPath, 'utf8'))
      existing = Array.isArray(prev.candidates) ? prev.candidates : []
    } catch {
      existing = []
    }
    const kept = existing.filter((c) => !replaceSet.has(c.source))
    const mergedCandidates = [
      ...kept,
      ...candidates.map((c) => ({
        ...c,
        reviewStatus: c.reviewStatus ?? 'pending',
        convertedEventId: c.convertedEventId ?? '',
        lastChecked: c.lastChecked ?? '',
      })),
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

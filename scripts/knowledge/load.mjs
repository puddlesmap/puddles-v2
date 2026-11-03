import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(root, relativePath), 'utf8'))
}

export const KNOWLEDGE_VENUES = readJson('data/knowledge/venues.json')
export const KNOWLEDGE_PROGRAMS = readJson('data/knowledge/programs.json')
export const KNOWLEDGE_FACTS = readJson('data/knowledge/facts.json')

function normalizeKey(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, "'")
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

export function normalizeProgramTitle(title) {
  return normalizeKey(title)
    .replace(/\b20\d{2}\b/g, ' ')
    .replace(
      /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/g,
      ' ',
    )
    .replace(/\b\d{1,2}(st|nd|rd|th)?\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function matchKnowledgeVenue(venueName, city, venues = KNOWLEDGE_VENUES) {
  const raw = String(venueName ?? '').trim()
  if (!raw) return null
  const keys = new Set([normalizeKey(raw)])
  const cityKey = city ? normalizeKey(city) : ''
  let best = null
  for (const venue of venues) {
    const names = [venue.id, ...(venue.names || []), ...(venue.aliases || []), venue.geoRef || '']
      .filter(Boolean)
      .map(normalizeKey)
    const nameHit = names.some(
      (name) => keys.has(name) || [...keys].some((k) => k.includes(name) || name.includes(k)),
    )
    if (!nameHit) continue
    if (cityKey && normalizeKey(venue.city) !== cityKey) {
      if (!best) best = venue
      continue
    }
    return venue
  }
  return best
}

export function matchKnowledgeProgram(title, { venueId, eventUrl, programs = KNOWLEDGE_PROGRAMS } = {}) {
  const stem = normalizeProgramTitle(title)
  if (!stem) return null
  let urlHost = ''
  try {
    urlHost = eventUrl ? new URL(eventUrl).hostname.toLowerCase() : ''
  } catch {
    urlHost = ''
  }
  const scored = []
  for (const program of programs) {
    let score = 0
    const patternHit = (program.titlePatterns || []).some((pattern) => {
      const p = normalizeKey(pattern)
      if (!p) return false
      return stem === p || stem.startsWith(`${p} `) || stem.includes(` ${p} `) || p.startsWith(`${stem} `)
    })
    if (!patternHit) continue
    const venueOk = !program.venueId || !venueId || venueId === program.venueId
    const organizerOk =
      !urlHost ||
      !program.organizerKey ||
      urlHost.includes(String(program.organizerKey).replace(/^www\./, ''))
    if (!venueOk && !organizerOk) continue
    if (program.venueId && venueId && venueId !== program.venueId && !organizerOk) continue
    score += 10
    if (venueId && program.venueId && venueId === program.venueId) score += 5
    if (organizerOk && urlHost) score += 4
    scored.push({ program, score })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.program ?? null
}

export function inferSituationTags({ title = '', description = '', venue = '' } = {}) {
  const hay = `${title} ${description} ${venue}`.toLowerCase()
  const tags = new Set()
  const isLibraryVenue = /\blibrary\b/.test(hay)
  if (
    !isLibraryVenue &&
    /\boutdoor|pioneer park|cuesta park|las palmas park|\bmitchell park\b|weather permitting\b/.test(hay)
  ) {
    tags.add('outdoor')
  }
  if (isLibraryVenue || /\bindoor|storytime room\b/.test(hay)) tags.add('indoor')
  if (/\bstorytime|story time\b/.test(hay)) tags.add('storytime')
  if (/\bclass|stroller strides|barre|yoga|fit4mom\b/.test(hay)) tags.add('class')
  if (/\bfestival|bazaar|tree lighting|celebration\b/.test(hay)) tags.add('festival')
  if (/\bpark\b/.test(hay) && !isLibraryVenue) tags.add('park')
  if (tags.size === 0) tags.add('indoor')
  return [...tags]
}

/**
 * Shared copy enrichment for sheet sync scripts (mirrors src/utils/*).
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

export const GUNN_SPANGENBERG_VENUE = 'Henry M. Gunn High School — Spangenberg Theatre'
export const GUNN_SPANGENBERG_ADDRESS = '780 Arastradero Rd, Palo Alto, CA 94306'

export const ACTIVITY_TYPES = [
  'Stories',
  'Music & Movement',
  'Arts & Crafts',
  'Build & Explore',
  'Outdoor',
  'Social & Play',
  'Classes',
  'Festivals & Community',
  'Parent & Me',
  'Other',
]

export const TIP_SENTENCE_RE =
  /\b(bring (a |your )?(small )?blanket|lawn\s*chairs?|yoga\s*mats?|meditation cushions?|regist(?:er|ration)|sign[\s-]?up|rsvp|tickets?|weather dependent|inclement weather|weather permitting|no performances during|events? are weather|rain or shine|cancelled due to weather|canceled due to weather|indoors? or outdoors?|indoor\/outdoor|accompanied by|caregivers?|first[\s-]come|space is limited|no registration|walk[\s-]?ins|pre[\s-]?register|costumes?(?: and accessories)? encouraged|legos? will stay|must be accompanied|children under \d+|recommended age)\b/i

const TIP_EXCLUDE_RE =
  /\b(imagination|steam|early childhood development|problem solving|self-confidence|oceans of possibilities|earn badges)\b/i

let discoveryDescriptionIndex = null

function loadDiscoveryDescriptionIndex() {
  if (discoveryDescriptionIndex) return discoveryDescriptionIndex
  discoveryDescriptionIndex = new Map()
  try {
    const catalog = JSON.parse(
      readFileSync(join(rootDir, 'src/data/discovery-candidates.json'), 'utf8'),
    )
    for (const candidate of catalog.candidates ?? []) {
      const description = candidate.description?.trim()
      if (!description || description.length < 20) continue
      if (candidate.id) discoveryDescriptionIndex.set(`id:${candidate.id}`, description)
      const url = candidate.eventUrl?.trim()
      if (url && url !== '#') {
        const slug = url.replace(/\/$/, '').split('/').filter(Boolean).pop()?.toLowerCase()
        if (slug) discoveryDescriptionIndex.set(`url:${slug}`, description)
      }
      if (candidate.title && candidate.date && candidate.venue) {
        const matchKey = `${candidate.title}|${candidate.date}|${candidate.venue}`.toLowerCase()
        discoveryDescriptionIndex.set(`match:${matchKey}`, description)
      }
    }
  } catch {
    // Discovery catalog optional during sync.
  }
  return discoveryDescriptionIndex
}

export function splitSentences(text) {
  return String(text ?? '')
    .replace(/\*+/g, '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12)
}

function normalizeTip(raw) {
  const tip = String(raw ?? '')
    .replace(/\*+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.$/, '')
  if (tip.length < 8) return ''
  return /[.!?]$/.test(tip) ? tip : `${tip}.`
}

export function extractTipsFromText(plainDescription, existingTips = '') {
  const tips = []
  const seen = new Set()

  function addTip(raw) {
    const tip = normalizeTip(raw)
    if (!tip) return
    const key = tip.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    tips.push(tip)
  }

  const existing = Array.isArray(existingTips)
    ? existingTips
    : String(existingTips).split('\n').filter(Boolean)
  for (const raw of existing) addTip(raw)

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

/** Library ops / accessibility form boilerplate — discard, do not move to tips. */
export const LOGISTICS_SENTENCE_RE =
  /\b(accessibility accommodations|sccld\.org\/accessibility|ask@lib\.sccgov\.org|need assistance with the form|speak with a staff member at your local library)\b/i

const TRAILING_ACCESSIBILITY_BLOCK_RE =
  /\s*For accessibility accommodations[\s\S]*$/i

export function stripLogisticsFromDescription(text) {
  const plain = String(text ?? '')
  if (!plain.trim()) return plain

  const withoutTrailing = plain.replace(TRAILING_ACCESSIBILITY_BLOCK_RE, '').trim()
  const source = withoutTrailing || plain
  const kept = splitSentences(source).filter((sentence) => !LOGISTICS_SENTENCE_RE.test(sentence))

  if (kept.length === 0) {
    if (LOGISTICS_SENTENCE_RE.test(plain) || TRAILING_ACCESSIBILITY_BLOCK_RE.test(plain)) {
      return withoutTrailing
    }
    return plain
  }

  return kept
    .join(' ')
    .replace(TRAILING_ACCESSIBILITY_BLOCK_RE, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isTruncatedDescription(description) {
  return /\.\.\.\s*$/.test(String(description ?? '').trim())
}

export function restoreDescriptionFromDiscovery(event, description) {
  if (!isTruncatedDescription(description)) return description

  const index = loadDiscoveryDescriptionIndex()
  const candidates = []

  if (event.id) {
    const byId = index.get(`id:${event.id}`)
    if (byId) candidates.push(byId)
  }

  const url = event.eventUrl?.trim()
  if (url && url !== '#') {
    const slug = url.replace(/\/$/, '').split('/').filter(Boolean).pop()?.toLowerCase()
    if (slug) {
      const byUrl = index.get(`url:${slug}`)
      if (byUrl) candidates.push(byUrl)
    }
  }

  if (event.title && event.date && event.venue) {
    const byMatch = index.get(`match:${event.title}|${event.date}|${event.venue}`.toLowerCase())
    if (byMatch) candidates.push(byMatch)
  }

  const best = candidates
    .filter((candidate) => candidate.length > description.length && !isTruncatedDescription(candidate))
    .sort((a, b) => b.length - a.length)[0]

  return best ?? description
}

export function normalizeVenueFromCopy(venue, description) {
  const combined = `${venue} ${description}`.toLowerCase()

  if (/gunn high school/.test(combined) && /spangenberg/.test(combined)) {
    return {
      venue: GUNN_SPANGENBERG_VENUE,
      address: GUNN_SPANGENBERG_ADDRESS,
    }
  }

  if (/spangenberg theater/i.test(venue) && !/gunn/i.test(venue)) {
    return {
      venue: GUNN_SPANGENBERG_VENUE,
      address: GUNN_SPANGENBERG_ADDRESS,
    }
  }

  return {}
}

export function inferActivityTypesFromText(...parts) {
  const lower = parts.filter(Boolean).join(' ').toLowerCase()
  if (!lower) return []

  const matched = []
  if (lower.includes('story')) matched.push('Stories')
  if (
    lower.includes('music') ||
    lower.includes('movement') ||
    lower.includes('concert') ||
    lower.includes('song')
  ) {
    matched.push('Music & Movement')
  }
  if (/\b(art|arts|craft|crafts)\b/.test(lower)) matched.push('Arts & Crafts')
  if (lower.includes('outdoor') || lower.includes('park')) matched.push('Outdoor')
  if (lower.includes('lego') || lower.includes('steam') || lower.includes('build')) {
    matched.push('Build & Explore')
  }
  if (lower.includes('play') || lower.includes('social')) matched.push('Social & Play')
  if (
    /\b(festival|fair|carnival|parade|open\s+house|community\s+day|kids\s+zone|farmers?\s+market)\b/.test(
      lower,
    ) ||
    (/\b(farm|barn|livestock|ponies?|horses?|petting\s+zoo)\b/.test(lower) &&
      /\b(festival|celebrate|celebration|annual|invite you and your family)\b/.test(lower))
  ) {
    if (!matched.includes('Festivals & Community')) matched.push('Festivals & Community')
  }
  if (lower.includes('class')) matched.push('Classes')
  if (
    /\b(parent\s*&\s*me|parent\s+and\s+me|mommy\s*&\s*me|mommy\s+and\s+me|dad\s*&\s*me|baby\s+yoga|parent\s*&\s*baby|parent\s+and\s+baby|stroller\s+(strides|barre|fitness)|family\s+yoga|caregiver\s*\+\s*child)\b/.test(
      lower,
    )
  ) {
    if (!matched.includes('Parent & Me')) matched.push('Parent & Me')
  }

  return matched
}

function parseSheetActivityTypes(raw) {
  const parts = String(raw)
    .split(/[,|/]/)
    .map((part) => part.trim())
    .filter(Boolean)

  const matched = []
  for (const part of parts) {
    const found = ACTIVITY_TYPES.find((type) => type.toLowerCase() === part.toLowerCase())
    if (found && !matched.includes(found)) matched.push(found)
  }
  return matched
}

function normalizeCategoryTags(categoryTags) {
  if (Array.isArray(categoryTags)) return categoryTags
  return String(categoryTags)
    .split(/[,|/]/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function isAnimalCommunityGathering(title, description, categoryTags) {
  const text = `${title} ${description}`.toLowerCase()
  const seasonal = categoryTags.some((tag) => /^seasonal$/i.test(tag))
  const animalOrFarm =
    /\b(farm|barn|livestock|sheep|goats?|chickens?|rabbits?|pigs?|cows?|ponies?|horses?|petting\s+zoo)\b/.test(
      text,
    )
  const halloween = /\b(halloween|spooky|haunted)\b/.test(text)
  const gathering =
    /\b(festival|celebrate|celebration|invite you and your family|annual)\b/.test(text)
  return (
    (seasonal && (animalOrFarm || halloween)) ||
    (animalOrFarm && gathering) ||
    (animalOrFarm && halloween && gathering)
  )
}

export function resolveActivityTypes(sheetTypesRaw, title, description, categoryTags = '') {
  const tags = normalizeCategoryTags(categoryTags)
  const sheetTypes = parseSheetActivityTypes(sheetTypesRaw)
  const combinedRaw = [sheetTypesRaw, ...tags].filter(Boolean).join(', ')

  if (isAnimalCommunityGathering(title, description, tags)) {
    return ['Festivals & Community']
  }

  const onlyOther = sheetTypes.length === 1 && sheetTypes[0] === 'Other'
  const inferred = inferActivityTypesFromText(title, description, combinedRaw)

  if (sheetTypes.length === 0 || onlyOther) {
    return inferred.length > 0 ? inferred : ['Other']
  }

  return sheetTypes
}

export function applyEventCopyEnrichment(event) {
  let description = event.description ?? ''
  let tips = event.tips ?? ''
  let venue = event.venue ?? ''
  let address = event.address ?? ''

  description = restoreDescriptionFromDiscovery(event, description)
  description = stripLogisticsFromDescription(description)

  const venueNorm = normalizeVenueFromCopy(venue, description)
  if (venueNorm.venue) venue = venueNorm.venue
  if (venueNorm.address) address = venueNorm.address

  const extractedTips = extractTipsFromText(description, tips)
  if (extractedTips) {
    description = descriptionWithoutTips(description, extractedTips)
    tips = extractedTips
  }

  const types = resolveActivityTypes(
    event.sheetTypesRaw ?? event.types?.join(', ') ?? '',
    event.title,
    description,
    event.categoryTags ?? [],
  )

  const changed =
    description !== event.description ||
    tips !== (event.tips ?? '') ||
    venue !== event.venue ||
    address !== event.address ||
    types.join('|') !== (event.types ?? []).join('|')

  if (!changed) return event

  return {
    ...event,
    description,
    venue,
    address,
    types,
    ...(tips ? { tips } : {}),
  }
}

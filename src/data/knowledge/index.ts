import venuesJson from '../../../data/knowledge/venues.json'
import programsJson from '../../../data/knowledge/programs.json'
import factsJson from '../../../data/knowledge/facts.json'
import { canonicalVenue } from '../venueGeo'
import type {
  KnowledgeProgram,
  KnowledgeVenue,
  TipAppliesWhen,
  TipFact,
} from '../../types/tipKnowledge'

export const KNOWLEDGE_VENUES = venuesJson as KnowledgeVenue[]
export const KNOWLEDGE_PROGRAMS = programsJson as KnowledgeProgram[]
export const KNOWLEDGE_FACTS = factsJson as TipFact[]

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, "'")
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

/** Strip dates / ordinal noise so weekly sessions share a title stem. */
export function normalizeProgramTitle(title: string): string {
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

function venueNameKeys(venue: KnowledgeVenue): string[] {
  return [venue.id, ...venue.names, ...(venue.aliases ?? []), venue.geoRef ?? '']
    .filter(Boolean)
    .map(normalizeKey)
}

export function matchKnowledgeVenue(
  venueName: string | undefined | null,
  city?: string | null,
  venues: KnowledgeVenue[] = KNOWLEDGE_VENUES,
): KnowledgeVenue | null {
  const raw = String(venueName ?? '').trim()
  if (!raw) return null
  const canonical = canonicalVenue(raw)
  const keys = new Set([normalizeKey(raw), normalizeKey(canonical)])
  const cityKey = city ? normalizeKey(city) : ''

  let best: KnowledgeVenue | null = null
  for (const venue of venues) {
    const names = venueNameKeys(venue)
    const nameHit = names.some((name) => keys.has(name) || [...keys].some((k) => k.includes(name) || name.includes(k)))
    if (!nameHit) continue
    if (cityKey && normalizeKey(venue.city) !== cityKey) {
      // Prefer city match but allow if only one name hit so far
      if (!best) best = venue
      continue
    }
    return venue
  }
  return best
}

export function matchKnowledgeProgram(
  title: string,
  opts: {
    venueId?: string | null
    eventUrl?: string | null
    programs?: KnowledgeProgram[]
  } = {},
): KnowledgeProgram | null {
  const programs = opts.programs ?? KNOWLEDGE_PROGRAMS
  const stem = normalizeProgramTitle(title)
  if (!stem) return null

  const urlHost = (() => {
    try {
      return opts.eventUrl ? new URL(opts.eventUrl).hostname.toLowerCase() : ''
    } catch {
      return ''
    }
  })()

  const scored: { program: KnowledgeProgram; score: number }[] = []
  for (const program of programs) {
    let score = 0
    const patternHit = program.titlePatterns.some((pattern) => {
      const p = normalizeKey(pattern)
      if (!p) return false
      // Exact, prefix, or mid-phrase ("fit4mom stroller strides at…").
      // Avoid suffix-only ("bilingual family storytime" ⇏ "family storytime").
      return stem === p || stem.startsWith(`${p} `) || stem.includes(` ${p} `) || p.startsWith(`${stem} `)
    })
    if (!patternHit) continue
    const venueOk = !program.venueId || !opts.venueId || opts.venueId === program.venueId
    const organizerOk =
      !urlHost ||
      !program.organizerKey ||
      urlHost.includes(program.organizerKey.replace(/^www\./, ''))
    // Require venue or organizer identity — title alone is not enough.
    if (!venueOk && !organizerOk) continue
    if (program.venueId && opts.venueId && opts.venueId !== program.venueId && !organizerOk) continue
    score += 10
    if (opts.venueId && program.venueId && opts.venueId === program.venueId) score += 5
    if (organizerOk && urlHost) score += 4
    scored.push({ program, score })
  }

  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.program ?? null
}

export function factsForVenue(venueId: string, facts: TipFact[] = KNOWLEDGE_FACTS): TipFact[] {
  return facts.filter((f) => f.scope === 'venue' && f.venueId === venueId)
}

export function factsForProgram(programId: string, facts: TipFact[] = KNOWLEDGE_FACTS): TipFact[] {
  return facts.filter((f) => f.scope === 'program' && f.programId === programId)
}

export function factsForEvent(eventId: string, facts: TipFact[] = KNOWLEDGE_FACTS): TipFact[] {
  return facts.filter((f) => f.scope === 'event' && f.eventId === eventId)
}

export function inferSituationTags(input: {
  title?: string
  description?: string
  venue?: string
}): TipAppliesWhen[] {
  const hay = `${input.title ?? ''} ${input.description ?? ''} ${input.venue ?? ''}`.toLowerCase()
  const tags = new Set<TipAppliesWhen>()
  const isLibraryVenue = /\blibrary\b/.test(hay)
  // Parks used for outdoor classes — but "Mitchell Park Library" is indoor.
  if (
    !isLibraryVenue &&
    /\boutdoor|pioneer park|cuesta park|las palmas park|\bmitchell park\b|weather permitting\b/.test(hay)
  ) {
    tags.add('outdoor')
  }
  if (isLibraryVenue || /\bindoor|storytime room\b/.test(hay)) {
    tags.add('indoor')
  }
  if (/\bstorytime|story time\b/.test(hay)) tags.add('storytime')
  if (/\bclass|stroller strides|barre|yoga|fit4mom\b/.test(hay)) tags.add('class')
  if (/\bfestival|bazaar|tree lighting|celebration\b/.test(hay)) tags.add('festival')
  if (/\bpark\b/.test(hay) && !isLibraryVenue) tags.add('park')
  if (tags.size === 0) tags.add('indoor')
  return [...tags]
}

export function getFactById(id: string, facts: TipFact[] = KNOWLEDGE_FACTS): TipFact | null {
  return facts.find((f) => f.id === id) ?? null
}

export function eventsDependingOnFact(
  factId: string,
  facts: TipFact[] = KNOWLEDGE_FACTS,
): string[] {
  return getFactById(factId, facts)?.usedByEventIds ?? []
}

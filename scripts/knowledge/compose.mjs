import {
  inferSituationTags,
  KNOWLEDGE_FACTS,
  KNOWLEDGE_PROGRAMS,
  KNOWLEDGE_VENUES,
  matchKnowledgeProgram,
  matchKnowledgeVenue,
} from './load.mjs'

const SCOPE_RANK = { venue: 1, program: 2, event: 3 }
const CATEGORY_PRIORITY = [
  'registration',
  'tickets',
  'weather',
  'bring',
  'stroller',
  'ages',
  'accessibility',
  'restroom',
  'parking',
  'food',
  'sensory',
  'indoorOutdoor',
  'shadeSeating',
  'duration',
  'transit',
  'other',
]
const VOLATILITY_DAYS = { stable: 180, semi: 90, dynamic: 14 }
const DROP_IN_RE = /\b(no registration|drop[\s-]?in|walk[\s-]?ins?\b)/i
const REG_REQUIRED_RE = /\b(registration required|register|rsvp|tickets? required|advance tickets)\b/i

function isStale(fact, now = new Date()) {
  const raw = String(fact.verifiedAt || '').trim()
  if (!raw) return true
  const then = new Date(raw.includes('T') ? raw : `${raw}T12:00:00`)
  if (Number.isNaN(then.getTime())) return true
  const age = Math.floor((now.getTime() - then.getTime()) / 86400000)
  return age > (VOLATILITY_DAYS[fact.volatility] ?? 90)
}

function factApplies(fact, tags) {
  if (!fact.appliesWhen?.length) return true
  if (!tags.length) return true
  return fact.appliesWhen.some((tag) => tags.includes(tag))
}

function contradicts(fact, listingText) {
  const hay = String(listingText || '').toLowerCase()
  if (!hay.trim()) return null
  if (DROP_IN_RE.test(fact.text) && REG_REQUIRED_RE.test(hay) && !DROP_IN_RE.test(hay)) {
    return 'Listing looks registration-required; drop-in tip may not apply.'
  }
  if (REG_REQUIRED_RE.test(fact.text) && DROP_IN_RE.test(hay) && !REG_REQUIRED_RE.test(hay)) {
    return 'Listing looks drop-in; registration tip may not apply.'
  }
  return null
}

function mergeByCategory(facts) {
  const byCategory = new Map()
  for (const fact of facts) {
    const existing = byCategory.get(fact.category)
    if (!existing || SCOPE_RANK[fact.scope] >= SCOPE_RANK[existing.scope]) {
      byCategory.set(fact.category, fact)
    }
  }
  return [...byCategory.values()]
}

function toSuggestion(fact, now, reviewNote) {
  const stale = isStale(fact, now)
  const notes = []
  if (reviewNote) notes.push(reviewNote)
  if (stale) notes.push('Past refresh window — re-verify before relying on this.')
  if (!fact.reuseSafe) notes.push('Confirm against the current official listing.')
  return {
    factId: fact.id,
    scope: fact.scope,
    category: fact.category,
    icon: fact.icon,
    text: fact.text,
    sourceUrl: fact.sourceUrl,
    sourceType: fact.sourceType,
    verifiedAt: fact.verifiedAt,
    status: fact.status,
    reuseSafe: fact.reuseSafe,
    volatility: fact.volatility,
    stale,
    reviewNote: notes.length ? notes.join(' ') : undefined,
    prefixedLine: `${fact.icon}|${fact.text}`,
  }
}

/**
 * Compose venue → program → event tip suggestions for a discovery/catalog row.
 */
export function composeTipSuggestions(context, opts = {}) {
  const venues = opts.venues ?? KNOWLEDGE_VENUES
  const programs = opts.programs ?? KNOWLEDGE_PROGRAMS
  const allFacts = opts.facts ?? KNOWLEDGE_FACTS
  const maxTips = opts.maxTips ?? 4
  const now = opts.now ?? new Date()

  const tags =
    context.situationTags ??
    inferSituationTags({
      title: context.title,
      description: context.description,
      venue: context.venue,
    })

  const venue = matchKnowledgeVenue(context.venue, context.city, venues)
  const program = matchKnowledgeProgram(context.title, {
    venueId: venue?.id,
    eventUrl: context.eventUrl,
    programs,
  })

  const listingText = [context.description, context.tips, context.title].filter(Boolean).join('\n')
  const layered = []
  if (venue) layered.push(...allFacts.filter((f) => f.scope === 'venue' && f.venueId === venue.id))
  if (program) {
    layered.push(...allFacts.filter((f) => f.scope === 'program' && f.programId === program.id))
  }
  if (context.eventId) {
    layered.push(...allFacts.filter((f) => f.scope === 'event' && f.eventId === context.eventId))
  }
  if (context.eventFacts?.length) layered.push(...context.eventFacts)

  const merged = mergeByCategory(layered.filter((fact) => factApplies(fact, tags)))
  merged.sort((a, b) => {
    const pa = CATEGORY_PRIORITY.indexOf(a.category)
    const pb = CATEGORY_PRIORITY.indexOf(b.category)
    return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb)
  })

  const suggestions = []
  const needsReview = []
  for (const fact of merged) {
    const contradiction = contradicts(fact, listingText)
    const suggestion = toSuggestion(fact, now, contradiction || undefined)
    const hold =
      Boolean(contradiction) ||
      fact.status === 'needs_review' ||
      fact.status === 'conflict' ||
      fact.status === 'inferred'
    if (hold) needsReview.push(suggestion)
    else suggestions.push(suggestion)
  }

  const deduped = []
  const seen = new Set()
  for (const item of suggestions) {
    if (item.status !== 'verified') continue
    if (seen.has(item.factId)) continue
    seen.add(item.factId)
    deduped.push(item)
    if (deduped.length >= maxTips) break
  }

  return {
    venueId: venue?.id ?? null,
    programId: program?.id ?? null,
    suggestions: deduped,
    needsReview,
  }
}

/** Prefixed tip lines from reuseSafe, non-stale verified suggestions (for soft ingest). */
export function safePrefixedTipsFromKnowledge(context, opts = {}) {
  const { suggestions } = composeTipSuggestions(context, opts)
  return suggestions
    .filter((s) => s.reuseSafe && !s.stale && s.status === 'verified')
    .map((s) => s.prefixedLine)
    .join('\n')
}

export function tipsFromProgramId(programId, { maxTips = 4, facts = KNOWLEDGE_FACTS } = {}) {
  return facts
    .filter((f) => f.scope === 'program' && f.programId === programId && f.status === 'verified')
    .slice(0, maxTips)
    .map((f) => `${f.icon}|${f.text}`)
    .join('\n')
}

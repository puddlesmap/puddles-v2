import {
  factsForEvent,
  factsForProgram,
  factsForVenue,
  inferSituationTags,
  KNOWLEDGE_FACTS,
  KNOWLEDGE_PROGRAMS,
  KNOWLEDGE_VENUES,
  matchKnowledgeProgram,
  matchKnowledgeVenue,
} from '../data/knowledge'
import type {
  ComposeContext,
  ComposeResult,
  TipAppliesWhen,
  TipFact,
  TipFactCategory,
  TipSuggestion,
  KnowledgeProgram,
  KnowledgeVenue,
} from '../types/tipKnowledge'
import { isFactStale } from './tipKnowledgeFreshness'

const SCOPE_RANK = { venue: 1, program: 2, event: 3 } as const

/** Prefer decision-critical categories when capping at 2–4 tips. */
const CATEGORY_PRIORITY: TipFactCategory[] = [
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

const DROP_IN_RE = /\b(no registration|drop[\s-]?in|walk[\s-]?ins?\b)/i
const REG_REQUIRED_RE = /\b(registration required|register|rsvp|tickets? required|advance tickets)\b/i

function factApplies(fact: TipFact, tags: TipAppliesWhen[]): boolean {
  if (!fact.appliesWhen?.length) return true
  if (tags.length === 0) return true
  return fact.appliesWhen.some((tag) => tags.includes(tag))
}

function contradictsListing(fact: TipFact, listingText: string): string | null {
  const hay = listingText.toLowerCase()
  if (!hay.trim()) return null
  if (DROP_IN_RE.test(fact.text) && REG_REQUIRED_RE.test(hay) && !DROP_IN_RE.test(hay)) {
    return 'Listing looks registration-required; library drop-in tip may not apply.'
  }
  if (REG_REQUIRED_RE.test(fact.text) && DROP_IN_RE.test(hay) && !REG_REQUIRED_RE.test(hay)) {
    return 'Listing looks drop-in; registration tip may not apply.'
  }
  return null
}

function toSuggestion(fact: TipFact, now: Date, reviewNote?: string): TipSuggestion {
  const stale = isFactStale(fact, now)
  const notes: string[] = []
  if (reviewNote) notes.push(reviewNote)
  if (stale) notes.push('Past refresh window — re-verify before relying on this.')
  if (!fact.reuseSafe) notes.push('Confirm against the current official listing.')
  if (fact.status === 'needs_review' || fact.status === 'conflict') {
    notes.push(`Status: ${fact.status}.`)
  }
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

function mergeByCategory(facts: TipFact[]): TipFact[] {
  const byCategory = new Map<TipFactCategory, TipFact>()
  for (const fact of facts) {
    const existing = byCategory.get(fact.category)
    if (!existing || SCOPE_RANK[fact.scope] >= SCOPE_RANK[existing.scope]) {
      byCategory.set(fact.category, fact)
    }
  }
  return [...byCategory.values()]
}

function sortForParent(facts: TipFact[]): TipFact[] {
  return [...facts].sort((a, b) => {
    const pa = CATEGORY_PRIORITY.indexOf(a.category)
    const pb = CATEGORY_PRIORITY.indexOf(b.category)
    return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb)
  })
}

export function composeTipSuggestions(
  context: ComposeContext,
  opts: {
    venues?: KnowledgeVenue[]
    programs?: KnowledgeProgram[]
    facts?: TipFact[]
    maxTips?: number
    now?: Date
  } = {},
): ComposeResult {
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

  const layered: TipFact[] = []
  if (venue) layered.push(...factsForVenue(venue.id, allFacts))
  if (program) layered.push(...factsForProgram(program.id, allFacts))
  if (context.eventId) layered.push(...factsForEvent(context.eventId, allFacts))
  if (context.eventFacts?.length) layered.push(...context.eventFacts)

  const applicable = layered.filter((fact) => factApplies(fact, tags))
  const merged = mergeByCategory(applicable)

  const suggestions: TipSuggestion[] = []
  const needsReview: TipSuggestion[] = []

  for (const fact of sortForParent(merged)) {
    const contradiction = contradictsListing(fact, listingText)
    const suggestion = toSuggestion(fact, now, contradiction ?? undefined)
    const hold =
      Boolean(contradiction) ||
      fact.status === 'needs_review' ||
      fact.status === 'conflict' ||
      fact.status === 'inferred'

    if (hold) {
      needsReview.push(suggestion)
      continue
    }
    suggestions.push(suggestion)
  }

  // Dynamic / not reuseSafe still appear as suggestions but tagged for Admin confirm
  const parentFacing = suggestions.filter((s) => s.status === 'verified').slice(0, maxTips)
  const overflow = suggestions.slice(maxTips)
  needsReview.push(...overflow.filter((s) => !needsReview.some((n) => n.factId === s.factId)))

  // Include non-reuseSafe verified tips in suggestions (Admin must confirm) up to cap
  const confirmedPool = [
    ...parentFacing,
    ...suggestions.filter((s) => !s.reuseSafe && s.status === 'verified'),
  ]
  const deduped: TipSuggestion[] = []
  const seen = new Set<string>()
  for (const item of confirmedPool) {
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

/** Flatten accepted suggestions into the Event.tips string (newline + prefixes). */
export function tipsStringFromSuggestions(suggestions: TipSuggestion[]): string {
  return suggestions.map((s) => s.prefixedLine).join('\n')
}

/** Append one prefixed tip line if not already present (by text). */
export function appendTipLine(existingTips: string, prefixedLine: string): string {
  const next = prefixedLine.trim()
  if (!next) return existingTips
  const parsedNext = next.includes('|') ? next.slice(next.indexOf('|') + 1).trim() : next
  const lines = existingTips
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  const already = lines.some((line) => {
    const text = line.includes('|') ? line.slice(line.indexOf('|') + 1).trim() : line
    return text.toLowerCase() === parsedNext.toLowerCase()
  })
  if (already) return lines.join('\n')
  return [...lines, next].join('\n')
}

export function removeTipLineByText(existingTips: string, tipText: string): string {
  const target = tipText.trim().toLowerCase()
  return existingTips
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((line) => {
      const text = line.includes('|') ? line.slice(line.indexOf('|') + 1).trim() : line
      return text.toLowerCase() !== target
    })
    .join('\n')
}

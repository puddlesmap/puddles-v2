import type { TipIconKind } from '../utils/eventTips'

/** Where a reusable tip fact lives in the inheritance stack. */
export type TipFactScope = 'venue' | 'program' | 'event'

export type TipFactCategory =
  | 'parking'
  | 'transit'
  | 'stroller'
  | 'restroom'
  | 'indoorOutdoor'
  | 'shadeSeating'
  | 'food'
  | 'accessibility'
  | 'registration'
  | 'ages'
  | 'duration'
  | 'bring'
  | 'sensory'
  | 'tickets'
  | 'weather'
  | 'other'

export type TipFactSourceType = 'event' | 'organizer' | 'venue' | 'review'

export type TipFactStatus = 'verified' | 'inferred' | 'needs_review' | 'conflict'

export type TipFactVolatility = 'stable' | 'semi' | 'dynamic'

/** Situation tags — venue facts only apply when the event matches. */
export type TipAppliesWhen =
  | 'indoor'
  | 'outdoor'
  | 'storytime'
  | 'class'
  | 'festival'
  | 'park'

export interface KnowledgeVenue {
  id: string
  names: string[]
  aliases?: string[]
  city: string
  officialUrl?: string
  /** Canonical name key in venue-geo.json when known. */
  geoRef?: string
}

export interface KnowledgeProgram {
  id: string
  venueId?: string
  /** Host domain or org slug, e.g. mountainview.libcal.com */
  organizerKey: string
  /** Case-insensitive title stems; dates are stripped before match. */
  titlePatterns: string[]
  officialUrl?: string
  label: string
}

export interface TipFact {
  id: string
  scope: TipFactScope
  venueId?: string
  programId?: string
  eventId?: string
  category: TipFactCategory
  icon: TipIconKind
  text: string
  sourceUrl?: string
  sourceType: TipFactSourceType
  verifiedAt: string
  status: TipFactStatus
  /** If false, suggest only with a check-listing flag; never treat as auto-safe. */
  reuseSafe: boolean
  volatility: TipFactVolatility
  appliesWhen?: TipAppliesWhen[]
  /** Events that accepted this fact into published tips. */
  usedByEventIds?: string[]
}

export interface TipSuggestion {
  factId: string
  scope: TipFactScope
  category: TipFactCategory
  icon: TipIconKind
  text: string
  sourceUrl?: string
  sourceType: TipFactSourceType
  verifiedAt: string
  status: TipFactStatus
  reuseSafe: boolean
  volatility: TipFactVolatility
  /** True when past the refresh window for this volatility. */
  stale: boolean
  /** Why Admin should look twice (contradiction, dynamic, etc.). */
  reviewNote?: string
  /** Prefixed parent-facing line ready for tips. */
  prefixedLine: string
}

export interface ComposeContext {
  title: string
  venue?: string
  city?: string
  description?: string
  tips?: string
  eventUrl?: string
  eventId?: string
  /** Tags inferred for appliesWhen filtering. */
  situationTags?: TipAppliesWhen[]
  /** Extra event-scoped facts (listing extract / overrides) not yet in the library. */
  eventFacts?: TipFact[]
}

export interface ComposeResult {
  venueId: string | null
  programId: string | null
  suggestions: TipSuggestion[]
  needsReview: TipSuggestion[]
}

import catalog from './discovery-candidates.json'
import type {
  DiscoveryCandidate,
  DiscoveryCatalog,
  DiscoveryViewFilter,
} from '../types/discovery'
import { inferAgeRangeFromText, isAgeTargetingSentence } from '../utils/discoveryAgeHints'

export const DISCOVERY_CATALOG = catalog as DiscoveryCatalog

function withInferredAges(candidate: DiscoveryCandidate): DiscoveryCandidate {
  const inferred = inferAgeRangeFromText(
    [candidate.description, candidate.tips, candidate.title].filter(Boolean).join('\n'),
  )
  if (!inferred) return candidate

  const tips = (candidate.tips || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      const fromLine = inferAgeRangeFromText(line)
      return !(fromLine && isAgeTargetingSentence(line))
    })
    .join('\n')

  return {
    ...candidate,
    ageRange: inferred.ageRange,
    ageMin: inferred.ageMin,
    ageMax: inferred.ageMax,
    tips,
  }
}

export const ALL_DISCOVERY_CANDIDATES: DiscoveryCandidate[] = DISCOVERY_CATALOG.candidates.map(
  (candidate) =>
    withInferredAges({
      ...candidate,
      types: Array.isArray(candidate.types) ? candidate.types : [],
      categoryTags: Array.isArray(candidate.categoryTags) ? candidate.categoryTags : [],
      reviewStatus: candidate.reviewStatus ?? 'pending',
      convertedEventId: candidate.convertedEventId ?? '',
      lastChecked: candidate.lastChecked ?? '',
      alreadyOnPuddles: Boolean(candidate.alreadyOnPuddles),
    }),
)

export function summarizeDiscoveryCounts(candidates: DiscoveryCandidate[]) {
  return {
    total: candidates.length,
    pending: candidates.filter((c) => c.reviewStatus === 'pending').length,
    newPending: candidates.filter((c) => c.reviewStatus === 'pending' && !c.alreadyOnPuddles).length,
    alreadyPending: candidates.filter((c) => c.reviewStatus === 'pending' && c.alreadyOnPuddles)
      .length,
    approved: candidates.filter((c) => c.reviewStatus === 'approved').length,
    dismissed: candidates.filter((c) => c.reviewStatus === 'dismissed').length,
  }
}

export function filterDiscoveryCandidates(
  candidates: DiscoveryCandidate[],
  opts: { view: DiscoveryViewFilter; search: string },
): DiscoveryCandidate[] {
  const q = opts.search.trim().toLowerCase()
  return candidates.filter((candidate) => {
    if (opts.view === 'pending' && candidate.reviewStatus !== 'pending') return false
    if (opts.view === 'new' && !(candidate.reviewStatus === 'pending' && !candidate.alreadyOnPuddles)) {
      return false
    }
    if (
      opts.view === 'already' &&
      !(candidate.reviewStatus === 'pending' && candidate.alreadyOnPuddles)
    ) {
      return false
    }
    if (opts.view === 'approved' && candidate.reviewStatus !== 'approved') return false
    if (opts.view === 'dismissed' && candidate.reviewStatus !== 'dismissed') return false

    if (!q) return true
    const haystack = [
      candidate.title,
      candidate.venue,
      candidate.room,
      candidate.city,
      candidate.ageRange,
      candidate.tips,
      candidate.description,
      candidate.eventUrl,
      ...(candidate.types || []),
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}

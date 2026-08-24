import catalog from './discovery-candidates.json'
import type {
  DiscoveryCandidate,
  DiscoveryCatalog,
  DiscoveryViewFilter,
} from '../types/discovery'
import { inferAgeRangeFromText, isAgeTargetingSentence } from '../utils/discoveryAgeHints'
import { isOutsidePuddlesAgeScope } from '../utils/eventAudienceAge'
import { pacificTodayYmd } from '../utils/discoveryReview'
import { computeIsPast } from '../utils/publishing'

export const DISCOVERY_CATALOG = catalog as DiscoveryCatalog

/** True when the candidate’s session has already ended (Pacific calendar + end time). */
export function isDiscoveryCandidateExpired(
  candidate: Pick<DiscoveryCandidate, 'date' | 'startTime' | 'endTime'>,
  now: Date = new Date(),
): boolean {
  const date = String(candidate.date || '').trim()
  if (!date) return false

  const today = pacificTodayYmd()
  if (date < today) return true
  if (date > today) return false

  const start = candidate.startTime || '00:00'
  const end = candidate.endTime || start
  return computeIsPast(date, start, end, now)
}

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

/** Pending candidates outside ages 0–5 are auto-dismissed so they are not approveable. */
function withAgeScopeGate(candidate: DiscoveryCandidate): DiscoveryCandidate {
  const withAges = withInferredAges(candidate)
  if (withAges.reviewStatus !== 'pending') return withAges
  if (!isOutsidePuddlesAgeScope(withAges)) return withAges
  return { ...withAges, reviewStatus: 'dismissed' }
}

/** Upcoming discovery queue only — past sessions are dropped automatically. */
export const ALL_DISCOVERY_CANDIDATES: DiscoveryCandidate[] = DISCOVERY_CATALOG.candidates
  .map((candidate) =>
    withAgeScopeGate({
      ...candidate,
      types: Array.isArray(candidate.types) ? candidate.types : [],
      categoryTags: Array.isArray(candidate.categoryTags) ? candidate.categoryTags : [],
      reviewStatus: candidate.reviewStatus ?? 'pending',
      convertedEventId: candidate.convertedEventId ?? '',
      lastChecked: candidate.lastChecked ?? '',
      alreadyOnPuddles: Boolean(candidate.alreadyOnPuddles),
    }),
  )
  .filter((candidate) => !isDiscoveryCandidateExpired(candidate))

export function summarizeDiscoveryCounts(candidates: DiscoveryCandidate[]) {
  return {
    total: candidates.length,
    pending: candidates.filter((c) => c.reviewStatus === 'pending').length,
    newPending: candidates.filter((c) => c.reviewStatus === 'pending' && !c.alreadyOnPuddles).length,
    alreadyPending: candidates.filter((c) => c.reviewStatus === 'pending' && c.alreadyOnPuddles)
      .length,
    approved: candidates.filter((c) => c.reviewStatus === 'approved').length,
    live: candidates.filter((c) => c.reviewStatus === 'live').length,
    dismissed: candidates.filter((c) => c.reviewStatus === 'dismissed').length,
  }
}

export function filterDiscoveryCandidates(
  candidates: DiscoveryCandidate[],
  opts: { view: DiscoveryViewFilter; search: string },
): DiscoveryCandidate[] {
  const q = opts.search.trim().toLowerCase()
  return candidates.filter((candidate) => {
    if (isDiscoveryCandidateExpired(candidate)) return false

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
    if (opts.view === 'live' && candidate.reviewStatus !== 'live') return false
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

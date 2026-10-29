export function pacificTodayYmd(reference?: Date): string
export function isCancelledNotice(row: object): boolean
export function publishedTitleForUpdate(nextTitle: string, currentTitle: string): string
export function plainText(value: unknown, max: number): string
export function normalizeCopy(value: unknown): string
export function normalizeUrl(url: unknown): string
export function emptyInbox(): DiscoveryInboxFile
export function candidateIdentityKey(candidate: object): string
export function diffParentFields(event: object, candidate: object): string[]
export function findIdentityMatches(candidate: object, events: readonly object[]): object[]
export function labelCandidate(candidate: object, events: readonly object[]): InboxLabel
export function needsDecision(label: InboxLabel): boolean
export function candidateReviewTiming(candidate: object, today?: string): 'review' | 'later'
export function approveBlocked(candidate: object, label: InboxLabel): boolean
export function sanitizeCandidate(raw: object): {
  ok: boolean
  error?: string
  skip?: string
  candidate?: InboxCandidate
}
export function pruneInbox(inbox: DiscoveryInboxFile, catalog: readonly object[], today?: string): DiscoveryInboxFile
export function applyAgentPost(
  inbox: DiscoveryInboxFile,
  body: object,
  catalog: readonly object[],
  today?: string,
): { inbox: DiscoveryInboxFile; received: number; upserted: number; dropped: number; errors: string[] }
export function enqueueUrl(
  inbox: DiscoveryInboxFile,
  sourceUrl: string,
  requestedAt?: string,
): { ok: boolean; error?: string; inbox?: DiscoveryInboxFile }
export function applyDecision(
  inbox: DiscoveryInboxFile,
  input: object,
): { ok: boolean; error?: string; inbox?: DiscoveryInboxFile; candidate?: InboxCandidate }

export interface InboxCandidateLike {
  [key: string]: unknown
}

export interface InboxCandidate {
  id: string
  identityKey: string
  title: string
  date: string
  startTime: string
  endTime: string
  city: string
  venue: string
  cost: string
  ageRange: string
  bestFor: string
  placement?: 'browse' | 'seasonal' | 'drive'
  /** Extra listing on the active seasonal collection. Home & Browse stays on either way. */
  includeInSeasonal?: boolean
  description: string
  tips: string
  types: string[]
  imageUrl: string
  eventUrl: string
  sourceUrl: string
  sourceName: string
  sourceExcerpt: string
  sourceSnapshot: {
    titleText: string
    dateText: string
    timeText: string
    locationText: string
    costText: string
    ageText: string
  }
  providerEventId: string
  isCancelled: boolean
  needsReview: boolean
  reviewReasons: string[]
  discoveredAt: string
  decision?: 'pending' | 'ignored' | 'ready' | 'live'
  occurrenceChoice?: '' | 'replace' | 'new'
  updatedAt?: string
}

export interface InboxLabel {
  status: 'New' | 'Updated' | 'Existing'
  flags: string[]
  reviewReasons: string[]
  detectedChanges: string[]
  matchedEventId: string | null
  needsChoice: boolean
}

export interface DiscoveryRunHealth {
  runId: string
  startedAt: string
  completedAt: string
  agent: string
  sourcesChecked: number
  sourcesSucceeded: number
  sourcesUnreadable: number
  sourcesFailed: number
}

export interface DiscoveryInboxFile {
  latestRun: DiscoveryRunHealth | null
  candidates: InboxCandidate[]
  pendingUrls: { url: string; requestedAt: string; sourceName: string }[]
}

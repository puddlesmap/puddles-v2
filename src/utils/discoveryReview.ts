import type { DiscoveryCandidate, DiscoveryEditableFields, DiscoveryReviewStatus } from '../types/discovery'

const STORAGE_KEY = 'puddles-admin-discovery-review-v1'

export interface DiscoveryReviewRecord {
  reviewStatus: DiscoveryReviewStatus
  edits?: Partial<DiscoveryEditableFields>
  convertedEventId?: string
  updatedAt: string
}

type ReviewStore = Record<string, DiscoveryReviewRecord>

function readStore(): ReviewStore {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as ReviewStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(store: ReviewStore) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function loadDiscoveryReviewStore(): ReviewStore {
  return readStore()
}

export function saveDiscoveryReviewRecord(id: string, record: DiscoveryReviewRecord) {
  const store = readStore()
  store[id] = record
  writeStore(store)
}

export function clearDiscoveryEdits(id: string) {
  const store = readStore()
  const existing = store[id]
  if (!existing) return
  const next = { ...existing }
  delete next.edits
  store[id] = next
  writeStore(store)
}

export function applyDiscoveryReviewOverrides(
  candidates: DiscoveryCandidate[],
  store: ReviewStore = readStore(),
): DiscoveryCandidate[] {
  return candidates.map((candidate) => {
    const override = store[candidate.id]
    if (!override) return candidate
    const edits = override.edits ?? {}
    return {
      ...candidate,
      ...edits,
      types: edits.types ?? candidate.types,
      reviewStatus: override.reviewStatus ?? candidate.reviewStatus,
      convertedEventId: override.convertedEventId ?? candidate.convertedEventId,
      lastChecked: edits.lastChecked ?? candidate.lastChecked,
    }
  })
}

export function editableFieldsFromCandidate(candidate: DiscoveryCandidate): DiscoveryEditableFields {
  return {
    title: candidate.title,
    description: candidate.description,
    tips: candidate.tips,
    venue: candidate.venue,
    room: candidate.room,
    address: candidate.address,
    city: candidate.city,
    date: candidate.date,
    startTime: candidate.startTime,
    endTime: candidate.endTime,
    ageRange: candidate.ageRange,
    types: [...(candidate.types || [])],
    cost: candidate.cost,
    eventUrl: candidate.eventUrl,
    imageUrl: candidate.imageUrl,
    lastChecked: candidate.lastChecked,
  }
}

export function pacificTodayYmd(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

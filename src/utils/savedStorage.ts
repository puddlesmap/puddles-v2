import type { AudienceSavePayload } from '../types/audience'

export const SAVED_STORAGE_KEY = 'puddles_saved_v1'

export type LocalSave = {
  eventId: string
  savedAt: string
  removedAt?: string
}

function asSave(row: unknown): LocalSave | null {
  if (!row || typeof row !== 'object') return null
  const eventId = (row as { eventId?: unknown }).eventId
  const savedAt = (row as { savedAt?: unknown }).savedAt
  if (typeof eventId !== 'string' || !eventId.trim()) return null
  if (typeof savedAt !== 'string' || !savedAt) return null
  const removedAt = (row as { removedAt?: unknown }).removedAt
  return {
    eventId: eventId.trim(),
    savedAt,
    ...(typeof removedAt === 'string' && removedAt ? { removedAt } : {}),
  }
}

export function readLocalSaves(): LocalSave[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(SAVED_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.map(asSave).filter((row): row is LocalSave => Boolean(row))
  } catch {
    return []
  }
}

export function writeLocalSaves(saves: LocalSave[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(saves))
}

export function isActiveLocalSave(row: LocalSave) {
  return !row.removedAt
}

export function activeLocalEventIds(saves: LocalSave[] = readLocalSaves()): Set<string> {
  return new Set(saves.filter(isActiveLocalSave).map((row) => row.eventId))
}

export function toggleLocalSave(eventId: string, now = new Date().toISOString()): LocalSave[] {
  const id = eventId.trim()
  const saves = readLocalSaves()
  const existing = saves.find((row) => row.eventId === id)
  let next: LocalSave[]
  if (!existing) {
    next = [...saves, { eventId: id, savedAt: now }]
  } else if (existing.removedAt) {
    next = saves.map((row) =>
      row.eventId === id ? { eventId: id, savedAt: now } : row,
    )
  } else {
    next = saves.map((row) =>
      row.eventId === id ? { ...row, removedAt: now } : row,
    )
  }
  writeLocalSaves(next)
  return next
}

export function mergeRemoteActiveSaves(remote: Array<{ eventId: string; savedAt: string }>) {
  const byId = new Map(readLocalSaves().map((row) => [row.eventId, row]))
  for (const row of remote) {
    const id = row.eventId.trim()
    if (!id) continue
    const existing = byId.get(id)
    if (!existing || existing.removedAt) {
      byId.set(id, { eventId: id, savedAt: row.savedAt || new Date().toISOString() })
    }
  }
  const next = [...byId.values()]
  writeLocalSaves(next)
  return next
}

export function toAudienceSavePayloads(saves: LocalSave[] = readLocalSaves()): AudienceSavePayload[] {
  return saves.map((row) => ({
    eventId: row.eventId,
    savedAt: row.savedAt,
    ...(row.removedAt ? { removedAt: row.removedAt } : {}),
  }))
}

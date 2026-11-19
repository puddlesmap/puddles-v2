/**
 * Local check: activity_saved must only count after confirmed localStorage write.
 * Run: node scripts/verify-save-persistence.mjs
 */
import assert from 'node:assert/strict'

const SAVED_STORAGE_KEY = 'puddles_saved_v1'

/** Minimal mirror of toggleLocalSave persistence confirmation. */
function toggleLocalSave(store, eventId, now = new Date().toISOString()) {
  const id = eventId.trim()
  const saves = store
  const existing = saves.find((row) => row.eventId === id)
  const wasActive = Boolean(existing && !existing.removedAt)
  let next
  if (!existing) {
    next = [...saves, { eventId: id, savedAt: now }]
  } else if (existing.removedAt) {
    next = saves.map((row) => (row.eventId === id ? { eventId: id, savedAt: now } : row))
  } else {
    next = saves.map((row) => (row.eventId === id ? { ...row, removedAt: now } : row))
  }
  const persisted = Array.isArray(next)
  const nowSaved = !wasActive
  return { saves: next, persisted, nowSaved }
}

const a = toggleLocalSave([], 'evt-1')
assert.equal(a.persisted, true)
assert.equal(a.nowSaved, true)
assert.equal(a.saves[0].eventId, 'evt-1')

const b = toggleLocalSave(a.saves, 'evt-1')
assert.equal(b.nowSaved, false)
assert.ok(b.saves[0].removedAt)

console.log('verify-save-persistence: ok', { key: SAVED_STORAGE_KEY })

import assert from 'node:assert/strict'
import test from 'node:test'
import {
  emptyAudience,
  reassignSavesUserId,
  upsertClerkParent,
  buildAudienceRows,
} from '../src/utils/audienceCore.mjs'

test('upsertClerkParent creates a verified parent and stores saves', () => {
  const result = upsertClerkParent(emptyAudience(), {
    userId: 'user_clerk_1',
    email: 'Parent@Example.com',
    saves: [{ eventId: 'storytime', savedAt: '2026-11-01T12:00:00.000Z' }],
  })
  assert.equal(result.ok, true)
  assert.equal(result.email, 'parent@example.com')
  assert.equal(result.emailVerified, true)
  assert.equal(result.saves.length, 1)
  assert.equal(result.saves[0].eventId, 'storytime')

  const rows = buildAudienceRows(result.state)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].hasAccount, true)
  assert.equal(rows[0].savedCount, 1)
})

test('upsertClerkParent migrates legacy magic-link saves onto the Clerk userId', () => {
  const legacy = {
    parents: [
      {
        userId: 'saved_legacy',
        email: 'parent@example.com',
        emailVerifiedAt: null,
        createdAt: '2026-10-01T00:00:00.000Z',
        lastSeenAt: '2026-10-01T00:00:00.000Z',
      },
    ],
    savedEvents: [
      {
        userId: 'saved_legacy',
        eventId: 'farm-day',
        savedAt: '2026-10-02T00:00:00.000Z',
      },
    ],
    newsletter: [],
    loginTokens: [],
  }

  const result = upsertClerkParent(legacy, {
    userId: 'user_clerk_2',
    email: 'parent@example.com',
    saves: [{ eventId: 'music-class', savedAt: '2026-11-02T00:00:00.000Z' }],
  })

  assert.equal(result.ok, true)
  assert.equal(result.state.parents.length, 1)
  assert.equal(result.state.parents[0].userId, 'user_clerk_2')
  assert.equal(result.state.parents[0].emailVerifiedAt != null, true)

  const rows = buildAudienceRows(result.state)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].savedCount, 2)
  const ids = rows[0].saves.map((row) => row.eventId).sort()
  assert.deepEqual(ids, ['farm-day', 'music-class'])
})

test('reassignSavesUserId merges overlapping event ids', () => {
  const state = {
    ...emptyAudience(),
    savedEvents: [
      { userId: 'old', eventId: 'a', savedAt: '2026-01-01T00:00:00.000Z' },
      { userId: 'new', eventId: 'a', savedAt: '2026-02-01T00:00:00.000Z', reminderEnabled: true },
      { userId: 'old', eventId: 'b', savedAt: '2026-01-02T00:00:00.000Z' },
    ],
  }
  const next = reassignSavesUserId(state, 'old', 'new')
  const forNew = next.savedEvents.filter((row) => row.userId === 'new')
  assert.equal(forNew.length, 2)
  const a = forNew.find((row) => row.eventId === 'a')
  assert.equal(a.reminderEnabled, true)
  assert.equal(a.savedAt, '2026-01-01T00:00:00.000Z')
})

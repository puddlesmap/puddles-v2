import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'audience-store-'))
process.env.AUDIENCE_STORE = 'file'
process.env.AUDIENCE_PATH = path.join(dir, 'audience.json')

const {
  applyClerkParent,
  applyContinue,
  applySubscribeNewsletter,
  audienceConsistency,
  readAudienceView,
} = await import('../netlify/lib/audience-store.mjs')

test('edge-only blob context does not request a strong read', () => {
  assert.equal(audienceConsistency({ edgeURL: 'https://edge.example', siteID: 's', token: 't' }), 'eventual')
  assert.equal(
    audienceConsistency({
      edgeURL: 'https://edge.example',
      uncachedEdgeURL: 'https://uncached.example',
      siteID: 's',
      token: 't',
    }),
    'strong',
  )
  assert.equal(audienceConsistency({ apiURL: 'https://api.netlify.com', siteID: 's', token: 't' }), 'strong')
})

test('file store keeps a parent and a newsletter signup', async () => {
  const parent = await applyContinue({
    email: 'parent@example.com',
    userId: 'saved_store_test',
    saves: [{ eventId: 'storytime', savedAt: '2026-10-22T18:00:00.000Z' }],
  })
  assert.equal(parent.ok, true)

  const subscribed = await applySubscribeNewsletter({
    email: 'list@example.com',
    signupSource: 'puddles_picks',
  })
  assert.equal(subscribed.ok, true)

  const view = await readAudienceView()
  const emails = view.rows.map((row) => row.email).sort()
  assert.deepEqual(emails, ['list@example.com', 'parent@example.com'])
})

test('file store keeps a Clerk account signup and saved events for admin', async () => {
  const synced = await applyClerkParent({
    userId: 'user_clerk_admin',
    email: 'clerk.parent@example.com',
    saves: [
      { eventId: 'pumpkin-patch', savedAt: '2026-11-18T16:00:00.000Z' },
      { eventId: 'storytime', savedAt: '2026-11-19T16:00:00.000Z' },
    ],
  })
  assert.equal(synced.ok, true)
  assert.equal(synced.emailVerified, true)
  assert.equal(synced.saves.length, 2)

  const view = await readAudienceView()
  const row = view.rows.find((item) => item.email === 'clerk.parent@example.com')
  assert.ok(row)
  assert.equal(row.hasAccount, true)
  assert.equal(row.savedCount, 2)
  assert.equal(view.summary.parents >= 1, true)
})

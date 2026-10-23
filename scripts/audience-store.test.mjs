import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'audience-store-'))
process.env.AUDIENCE_STORE = 'file'
process.env.AUDIENCE_PATH = path.join(dir, 'audience.json')

const { applyContinue, applySubscribeNewsletter, readAudienceView } = await import(
  '../netlify/lib/audience-store.mjs'
)

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

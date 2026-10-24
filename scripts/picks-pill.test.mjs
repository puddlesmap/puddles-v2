import assert from 'node:assert/strict'
import test from 'node:test'
import { subscribeNewsletter, emptyAudience } from '../src/utils/audienceCore.mjs'
import {
  isPicksPillDismissed,
  picksPillDismissUntil,
  picksPillPage,
  picksPillSignupSource,
} from '../src/utils/picksPill.mjs'

const NOW = Date.parse('2026-10-24T16:00:00.000Z')

test('guide, browse, seasonal, and home share one pill surface', () => {
  assert.equal(picksPillPage('/guides/halloween-with-little-ones'), 'guide')
  assert.equal(picksPillPage('/guides'), 'guide')
  assert.equal(picksPillPage('/browse'), 'browse')
  assert.equal(picksPillPage('/map'), 'browse')
  assert.equal(picksPillPage('/seasonal/halloween-with-little-ones'), 'seasonal')
  assert.equal(picksPillPage('/'), 'home')
  assert.equal(picksPillPage('/about'), null)
})

test('dismiss lasts 30 days and does not depend on the page', () => {
  const until = picksPillDismissUntil(NOW)
  assert.equal(isPicksPillDismissed(until, NOW), true)
  assert.equal(isPicksPillDismissed(until, NOW + 29 * 24 * 60 * 60 * 1000), true)
  assert.equal(isPicksPillDismissed(until, NOW + 31 * 24 * 60 * 60 * 1000), false)
  assert.equal(isPicksPillDismissed(null, NOW), false)
})

test('a guide pill signup keeps its page source', () => {
  const source = picksPillSignupSource('guide')
  const listed = subscribeNewsletter(emptyAudience(), {
    email: 'guide@example.com',
    signupSource: source,
  })
  assert.equal(listed.state.newsletter[0].signupSource, 'puddles_picks_pill_guide')
})

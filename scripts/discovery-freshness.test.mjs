import assert from 'node:assert/strict'
import test from 'node:test'
import { commitDiscoveryRun, selectDiscoveryHorizon } from '../src/utils/discoveryCadence.mjs'
import {
  applyVerificationOverlay,
  assessEvent,
} from '../src/utils/verificationMaintenance.mjs'
import { intervalDays, isCheckDue } from '../src/utils/verificationSchedule.mjs'
import { buildWeeklySummary } from '../src/utils/weeklyDiscoverySummary.mjs'

const TODAY = '2026-10-24'
const config = {
  intervals: [
    { maxDaysUntil: 7, everyDays: 7 },
    { maxDaysUntil: 30, everyDays: 14 },
    { maxDaysUntil: 90, everyDays: 30 },
  ],
  beyondHorizonEveryDays: 30,
  registrationTightensWithinDays: 30,
  registrationIntervalDays: 7,
  escalateAfterFailures: 3,
  escalateFailuresWithinDays: 30,
  retryDays: 3,
  soonRetryDays: 1,
  soonRetryWithinDays: 7,
}

const cadenceConfig = {
  maxHorizonDays: 90,
  windows: [
    { id: '0-30', from: 0, to: 30, everyDays: 7 },
    { id: '31-60', from: 31, to: 60, everyDays: 14 },
    { id: '61-90', from: 61, to: 90, everyDays: 30 },
  ],
}

function event(overrides = {}) {
  return {
    id: 'story',
    title: 'Storytime',
    description: 'Stories and songs.',
    tips: '',
    venue: 'Library',
    city: 'Palo Alto',
    date: '2026-11-10',
    startTime: '10:30',
    endTime: '11:00',
    cost: 'Free',
    eventUrl: 'https://library.example/story',
    status: 'Published',
    verifiedDate: '2026-09-01',
    ...overrides,
  }
}

function candidate(overrides = {}) {
  return {
    id: 'cand-story',
    title: 'Storytime',
    description: 'Stories and songs.',
    venue: 'Library',
    city: 'Palo Alto',
    date: '2026-11-10',
    startTime: '10:30',
    endTime: '11:00',
    cost: 'Free',
    eventUrl: 'https://library.example/story',
    source: 'Palo Alto Library · BiblioCommons',
    reviewStatus: 'pending',
    alreadyOnPuddles: true,
    lastChecked: '',
    ...overrides,
  }
}

const context = {
  today: TODAY,
  config,
  catalogGeneratedAt: '2026-10-20T12:00:00.000Z',
  freshIds: new Set(),
  freshOn: '',
}

test('soon events are checked weekly and mid-range events every two weeks', () => {
  assert.equal(intervalDays(event({ date: '2026-10-28' }), TODAY, config), 7)
  assert.equal(intervalDays(event({ date: '2026-11-10' }), TODAY, config), 14)
  assert.equal(intervalDays(event({ date: '2026-12-20' }), TODAY, config), 30)
})

test('registration tightens the 8–30 day interval to 7 days', () => {
  const registered = event({ date: '2026-11-10', tips: 'Registration required.' })
  assert.equal(intervalDays(registered, TODAY, config), 7)
})

test('a recent check is not due again', () => {
  const soon = event({ date: '2026-11-10', verifiedDate: '2026-10-20' })
  assert.equal(isCheckDue(soon, null, TODAY, config), false)
  assert.equal(isCheckDue(event({ verifiedDate: '' }), null, TODAY, config), true)
})

test('a matching fresh reading verifies without a review item', () => {
  const decision = assessEvent(event(), [candidate()], context, null)
  assert.equal(decision.kind, 'verified')
  assert.equal(decision.record.lastChecked, TODAY)
  assert.equal(decision.record.attention, '')
})

test('a time correction is applied and a free-to-paid change is not', () => {
  const timed = assessEvent(event(), [candidate({ startTime: '11:00', endTime: '11:30' })], context, null)
  assert.equal(timed.kind, 'updated')
  assert.equal(timed.record.applied.startTime, '11:00')

  const priced = assessEvent(event(), [candidate({ cost: '$12' })], context, null)
  assert.equal(priced.kind, 'escalated')
  assert.equal(priced.record.applied, null)
  assert.match(priced.record.attention, /price:/)
})

test('a location notice whose new place is already the venue does not escalate', () => {
  const listing = event({
    title: 'Mindfulness Meditation',
    venue: 'Palo Alto Art Center',
    date: '2026-12-05',
    startTime: '13:00',
    endTime: '14:00',
    description: 'The December 5th meditation session will be at the Palo Alto Art Center.',
  })
  const notice = candidate({
    title: 'LOCATION CHANGE: Mindfulness Meditation',
    venue: '',
    date: '2026-12-05',
    startTime: '13:00',
    endTime: '14:00',
    description: 'The December 5th meditation session will be at the Palo Alto Art Center.',
    eventUrl: 'https://library.example/story',
  })
  const decision = assessEvent(listing, [notice], context, null)
  assert.equal(decision.kind, 'verified')
  assert.equal(decision.record.attention, '')
})

test('cancellation stays on the listing and is flagged', () => {
  const decision = assessEvent(
    event(),
    [candidate({ title: 'Canceled--Storytime', isCancelled: true })],
    context,
    null,
  )
  assert.equal(decision.kind, 'escalated')
  assert.match(decision.reason, /cancelled or postponed/)
  assert.equal(decision.record.lastChecked, '')
})

test('a stale official reading is a failure, not a success', () => {
  const decision = assessEvent(
    event(),
    [candidate({ lastChecked: '2026-08-01', source: 'Calendar Watchlist · Example' })],
    context,
    null,
  )
  assert.equal(decision.kind, 'failed')
  assert.equal(decision.record.lastChecked, '')
  assert.equal(decision.record.nextCheckDue, '2026-10-27')
})

test('the same failure on the same day does not increment twice', () => {
  const listing = event({ eventUrl: 'https://missing.example/nope', title: 'Unmatched' })
  const first = assessEvent(listing, [], context, null)
  const second = assessEvent(listing, [], context, first.record)
  assert.equal(first.record.failureCount, 1)
  assert.equal(second.repeated, true)
  assert.equal(second.record.failureCount, 1)
})

test('a recurring row is not moved to a different occurrence', () => {
  const series = event({
    scheduleKind: 'seasonal-run',
    openingDate: '2026-10-01',
    closingDate: '2026-11-30',
    date: '2026-10-01',
  })
  const decision = assessEvent(series, [candidate({ date: '2026-11-02', startTime: '15:00' })], context, null)
  assert.equal(decision.kind, 'verified')
  assert.equal(decision.record.applied, null)
})

test('overlay stamps last checked and routine fields, and leaves conflicts alone', () => {
  const verified = applyVerificationOverlay(event({ verifiedDate: '2026-09-01' }), {
    events: {
      story: { outcome: 'updated', lastChecked: TODAY, applied: { startTime: '11:00', cost: 'Free' } },
    },
  })
  assert.equal(verified.verifiedDate, TODAY)
  assert.equal(verified.startTime, '11:00')

  const conflict = applyVerificationOverlay(event(), {
    events: { story: { outcome: 'escalated', lastChecked: '', attention: 'cancelled or postponed' } },
  })
  assert.equal(conflict.verifiedDate, '2026-09-01')
  assert.equal(conflict.startTime, '10:30')
})

test('weekly cadence fetches 30 days, and a due far window uses one 90-day prefix', () => {
  const weekly = selectDiscoveryHorizon({
    today: TODAY,
    config: cadenceConfig,
    state: {
      windows: {
        '0-30': { lastSuccess: '2026-10-17' },
        '31-60': { lastSuccess: '2026-10-17' },
        '61-90': { lastSuccess: '2026-10-17' },
      },
    },
  })
  assert.equal(weekly.days, 30)
  assert.deepEqual(weekly.scanned, ['0-30'])
  assert.deepEqual(weekly.skipped, ['31-60', '61-90'])

  const monthly = selectDiscoveryHorizon({
    today: TODAY,
    config: cadenceConfig,
    state: {
      windows: {
        '0-30': { lastSuccess: '2026-10-20' },
        '31-60': { lastSuccess: '2026-10-22' },
        '61-90': { lastSuccess: '2026-09-01' },
      },
    },
  })
  assert.equal(monthly.days, 90)
  assert.deepEqual(monthly.scanned, ['0-30', '31-60', '61-90'])

  const committed = commitDiscoveryRun({ windows: {} }, monthly)
  assert.equal(committed.windows['61-90'].lastSuccess, TODAY)
})

test('a same-day rerun skips discovery when every window already succeeded', () => {
  const again = selectDiscoveryHorizon({
    today: TODAY,
    config: cadenceConfig,
    state: {
      windows: {
        '0-30': { lastSuccess: TODAY },
        '31-60': { lastSuccess: TODAY },
        '61-90': { lastSuccess: TODAY },
      },
    },
  })
  assert.equal(again.days, 0)
})

test('the weekly summary separates maintenance from decisions', () => {
  const summary = buildWeeklySummary({
    today: TODAY,
    maintenance: {
      checked: 4,
      verified: 2,
      updated: 1,
      skippedPast: 3,
      skippedNotDue: 5,
      failed: 1,
      retriesScheduled: 1,
      failuresByReason: { 'No official reading matched this listing.': 1 },
      attention: [{ title: 'Concert', date: '2026-11-01', reason: 'cancelled or postponed' }],
    },
    cadence: { days: 90, scanned: ['0-30', '31-60', '61-90'], skipped: [], full: true },
    discovery: {
      totals: { new: 2, updated: 1, existing: 4, held: 1 },
      byWindow: {
        '0-30': { new: 1, updated: 0, existing: 2, held: 0 },
        '31-60': { new: 0, updated: 1, existing: 1, held: 0 },
        '61-90': { new: 1, updated: 0, existing: 1, held: 1 },
      },
      awaitingApproval: [{ title: 'Pumpkin morning', date: '2026-11-02', city: 'Palo Alto' }],
    },
    blocked: [],
  })
  assert.match(summary, /## A\. Event maintenance/)
  assert.match(summary, /## B\. Discovery/)
  assert.match(summary, /## C\. Needs my attention/)
  assert.match(summary, /Events archived by this run: 0/)
  assert.match(summary, /Cancellations: 1/)
  assert.match(summary, /New · 2026-11-02 · Pumpkin morning/)
})

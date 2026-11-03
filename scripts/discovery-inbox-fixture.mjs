/**
 * Proves New / Updated / Existing, including a moved series date,
 * a new storytime occurrence, and a kid-fit change.
 * Run: node scripts/discovery-inbox-fixture.mjs
 */
import assert from 'node:assert/strict'
import {
  applyAgentPost,
  approveBlocked,
  candidateReviewTiming,
  emptyInbox,
  labelCandidate,
  publishedTitleForUpdate,
} from '../src/utils/discoveryInboxCore.mjs'

const orchard = {
  id: 'orchard',
  title: 'Sunnyvale Orchard Music Series',
  date: '2026-09-17',
  startTime: '18:00',
  endTime: '19:30',
  venue: 'Sunnyvale Community Center Amphitheater',
  city: 'Sunnyvale',
  cost: 'Free',
  ageRange: 'All ages · Little ones welcome',
  description: 'Live music on the lawn for little ones and their grown-ups.',
  tips: 'Bring a blanket.',
  status: 'Published',
  eventUrl: 'https://www.sunnyvale.ca.gov/recreation-and-community/special-events',
  isRecurring: true,
}

const story = (date, id) => ({
  id,
  title: 'Family Storytime',
  date,
  startTime: '10:30',
  endTime: '11:00',
  venue: 'Sunnyvale Library',
  city: 'Sunnyvale',
  cost: 'Free',
  ageRange: '0–5',
  description: 'Stories and songs.',
  tips: '',
  status: 'Published',
  eventUrl: 'https://www.library.sunnyvale.ca.gov/events/kids-events',
})

const evidence = 'Official page: family concert on the lawn, all ages.'

function candidate(overrides) {
  return {
    sourceUrl: 'https://example.com/source',
    sourceName: 'Fixture',
    sourceExcerpt: evidence,
    title: 'Family Storytime',
    date: '2026-10-20',
    startTime: '10:30',
    endTime: '11:00',
    venue: 'Sunnyvale Library',
    city: 'Sunnyvale',
    cost: 'Free',
    ageRange: '0–5',
    description: 'Stories and songs.',
    eventUrl: 'https://www.library.sunnyvale.ca.gov/events/kids-events',
    ...overrides,
  }
}

const moved = labelCandidate(
  candidate({
    title: orchard.title,
    date: '2026-10-08',
    startTime: '18:00',
    endTime: '19:30',
    venue: orchard.venue,
    description: orchard.description,
    tips: orchard.tips,
    eventUrl: orchard.eventUrl,
    sourceUrl: orchard.eventUrl,
  }),
  [orchard],
)
assert.equal(moved.status, 'Updated', `series date change should be Updated, got ${moved.status}`)
assert.ok(moved.detectedChanges.some((line) => line.startsWith('date:')), moved.detectedChanges.join('; '))

const stories = [story('2026-10-06', 'st-1'), story('2026-10-13', 'st-2')]
const nextStory = labelCandidate(candidate({ date: '2026-10-20' }), stories)
assert.equal(nextStory.status, 'New', `new storytime date should be New, got ${nextStory.status}`)

const sameStory = labelCandidate(candidate({ date: '2026-10-06' }), stories)
assert.equal(sameStory.status, 'Existing', `same storytime should be Existing, got ${sameStory.status}`)

const kidFit = labelCandidate(
  candidate({
    date: '2026-10-06',
    description: 'Kids zone with crafts and a short story.',
  }),
  stories,
)
assert.equal(kidFit.status, 'Updated', `kid-fit change should be Updated, got ${kidFit.status}`)
assert.ok(kidFit.detectedChanges.includes('kid-fit changed'), kidFit.detectedChanges.join('; '))

const spacing = labelCandidate(
  candidate({
    date: '2026-10-06',
    description: 'Stories   and\nsongs.',
  }),
  stories,
)
assert.equal(spacing.status, 'Existing', `formatting-only copy should be Existing, got ${spacing.status}`)

const ambiguousCatalog = [
  orchard,
  {
    ...story('2026-10-08', 'orchard-night'),
    title: orchard.title,
    venue: orchard.venue,
    eventUrl: orchard.eventUrl,
    isRecurring: false,
  },
]
const ambiguous = labelCandidate(
  candidate({
    title: orchard.title,
    date: '2026-10-15',
    startTime: '18:00',
    venue: orchard.venue,
    description: orchard.description,
    eventUrl: orchard.eventUrl,
    sourceUrl: orchard.eventUrl,
  }),
  ambiguousCatalog,
)
assert.equal(ambiguous.needsChoice, true, 'series plus dated rows should ask for a choice')
assert.equal(
  approveBlocked(candidate({ title: orchard.title, date: '2026-10-15', eventUrl: orchard.eventUrl }), ambiguous),
  true,
)

const posted = applyAgentPost(
  emptyInbox(),
  {
    runId: 'fixture',
    agent: 'fixture',
    sourcesChecked: 1,
    sourcesSucceeded: 1,
    candidates: [
      candidate({
        title: 'Brand New Concert',
        date: '2026-11-01',
        eventUrl: 'https://bingschool.stanford.edu/events/example',
        sourceUrl: 'https://bingschool.stanford.edu/events/example',
      }),
    ],
  },
  [],
  '2026-10-07',
)
assert.equal(posted.upserted, 1)
const again = applyAgentPost(
  {
    ...posted.inbox,
    candidates: posted.inbox.candidates.map((row) => ({ ...row, decision: 'ignored' })),
  },
  {
    candidates: [
      candidate({
        title: 'Brand New Concert',
        date: '2026-11-08',
        eventUrl: 'https://bingschool.stanford.edu/events/example',
        sourceUrl: 'https://bingschool.stanford.edu/events/example',
      }),
    ],
  },
  [],
  '2026-10-07',
)
assert.equal(again.inbox.candidates[0].decision, 'ignored', 'a later post must keep Ignore')
assert.equal(again.inbox.candidates[0].date, '2026-11-08', 'a new date updates the same row')
assert.equal(again.inbox.candidates.length, 1)

const unreadable = applyAgentPost(
  emptyInbox(),
  {
    candidates: [
      {
        sourceUrl: 'https://www.instagram.com/cityofsunnyvale/',
        sourceName: 'Instagram @cityofsunnyvale',
        sourceExcerpt: '',
        needsReview: true,
        reviewReasons: ['unreadable_source'],
      },
    ],
  },
  [],
  '2026-10-07',
)
assert.equal(unreadable.inbox.candidates.length, 0, 'unreadable sources are not fake events')

const neighborhoodPost = applyAgentPost(
  emptyInbox(),
  {
    candidates: [
      candidate({
        title: 'Barron Park Movie Night',
        date: '2026-11-06',
        eventUrl: 'https://example.com/palo-alto-community-events',
        sourceUrl: 'https://example.com/palo-alto-community-events',
      }),
      candidate({
        title: 'Hands on the Arts',
        date: '2026-11-07',
        eventUrl: 'https://example.com/palo-alto-community-events',
        sourceUrl: 'https://example.com/palo-alto-community-events',
      }),
      candidate({
        title: 'Halloween Hoopla',
        date: '2026-10-31',
        eventUrl: 'https://example.com/palo-alto-community-events',
        sourceUrl: 'https://example.com/palo-alto-community-events',
      }),
    ],
  },
  [],
  '2026-10-15',
)
assert.equal(neighborhoodPost.inbox.candidates.length, 3, 'one calendar page must keep distinct events')

const planAhead = candidate({ title: 'Winter Workshop', date: '2027-01-05' })
assert.equal(candidateReviewTiming(planAhead, '2026-10-15'), 'later')
assert.equal(candidateReviewTiming(planAhead, '2026-11-15'), 'review')
assert.equal(
  candidateReviewTiming({ ...planAhead, tips: 'Registration opens today.' }, '2026-10-15'),
  'review',
  'registration should make a 61–90 day event actionable',
)

const approvedEarly = applyAgentPost(
  emptyInbox(),
  { candidates: [candidate({ title: 'Approved Winter Workshop', date: '2027-01-05' })] },
  [],
  '2026-10-15',
)
approvedEarly.inbox.candidates[0].decision = 'ready'
const approvedCrossingDisplayWindow = applyAgentPost(
  approvedEarly.inbox,
  { candidates: [candidate({ title: 'Approved Winter Workshop', date: '2027-01-05' })] },
  [],
  '2026-11-15',
)
assert.equal(
  approvedCrossingDisplayWindow.inbox.candidates[0].decision,
  'ready',
  'an unchanged early-approved event must not require approval again when it enters 60 days',
)
assert.equal(
  candidateReviewTiming(approvedCrossingDisplayWindow.inbox.candidates[0], '2026-11-15'),
  'review',
  'the approved event becomes display-window eligible without being forgotten',
)

const cancellation = labelCandidate(
  candidate({ date: '2026-10-06', isCancelled: true, sourceExcerpt: 'Officially cancelled.' }),
  stories,
)
assert.ok(
  cancellation.detectedChanges.includes('cancelled or postponed'),
  'cancellations must return to review',
)

const rerun = {
  id: 'disc-baby-storytime-rerun-2026-10-16-17170831',
  title: 'Baby Storytime: Rerun',
  date: '2026-10-16',
  startTime: '10:30',
  endTime: '11:15',
  venue: 'Mountain View Library',
  city: 'Mountain View',
  cost: 'Free',
  ageRange: '0–2',
  description: 'Did you miss Wednesday’s Baby Storytime?',
  status: 'Published',
  eventUrl: 'https://mountainview.libcal.com/event/17170831',
}
const canceledRerun = labelCandidate(
  candidate({
    title: 'Canceled--Baby Storytime Rerun',
    date: '2026-10-16',
    startTime: '10:30',
    endTime: '11:15',
    venue: 'Mountain View Library',
    city: 'Mountain View',
    ageRange: '0–2',
    providerEventId: '17170831',
    description: "This Friday's Baby Storytime Rerun is canceled because our Librarians will be presenting a special storytime.",
    sourceExcerpt: "This Friday's Baby Storytime Rerun is canceled because our Librarians will be presenting a special storytime.",
    eventUrl: 'https://mountainview.libcal.com/event/17170831',
    sourceUrl: 'https://mountainview.libcal.com/event/17170831',
  }),
  [rerun],
)
assert.equal(canceledRerun.status, 'Updated', `canceled rerun should update the published row, got ${canceledRerun.status}`)
assert.equal(canceledRerun.matchedEventId, rerun.id)
assert.ok(
  canceledRerun.detectedChanges.includes('cancelled or postponed'),
  canceledRerun.detectedChanges.join('; '),
)
assert.equal(
  canceledRerun.detectedChanges.includes('kid-fit changed'),
  false,
  'a cancellation note is not a kid-fit change',
)
assert.equal(publishedTitleForUpdate('Canceled--Baby Storytime Rerun', 'Baby Storytime: Rerun'), 'Baby Storytime: Rerun')

const meditation = {
  id: 'disc-mindfulness-meditation-2026-12-05-68faeb383cbc052f00816108',
  title: 'Mindfulness Meditation',
  date: '2026-12-05',
  startTime: '13:00',
  endTime: '14:00',
  venue: 'Palo Alto Art Center',
  city: 'Palo Alto',
  cost: 'Free',
  ageRange: '0–5',
  description: 'Sitting meditation at the library.',
  status: 'Published',
  eventUrl: 'https://paloalto.bibliocommons.com/events/68faeb383cbc052f00816108',
}
const locationChange = labelCandidate(
  candidate({
    title: 'LOCATION CHANGE: Mindfulness Meditation',
    date: '2026-12-05',
    startTime: '13:00',
    endTime: '14:00',
    venue: '',
    city: 'Palo Alto',
    ageRange: '0–5',
    providerEventId: '68faeb383cbc052f00816108',
    description: 'The December 5th meditation session will be at the Palo Alto Art Center.',
    eventUrl: 'https://paloalto.bibliocommons.com/events/68faeb383cbc052f00816108',
    sourceUrl: 'https://paloalto.bibliocommons.com/events/68faeb383cbc052f00816108',
  }),
  [meditation],
)
assert.equal(locationChange.status, 'Updated', `location change should update the published row, got ${locationChange.status}`)
assert.equal(locationChange.matchedEventId, meditation.id)
assert.ok(
  locationChange.detectedChanges.includes('location changed'),
  locationChange.detectedChanges.join('; '),
)
assert.equal(
  locationChange.detectedChanges.includes('kid-fit changed'),
  false,
  'a location-change note is not a kid-fit change',
)
assert.equal(
  publishedTitleForUpdate('LOCATION CHANGE: Mindfulness Meditation', 'Mindfulness Meditation'),
  'Mindfulness Meditation',
)

console.log('discovery inbox fixture ok')

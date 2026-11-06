import assert from 'node:assert/strict'
import test from 'node:test'
import { composeTipSuggestions } from './knowledge/compose.mjs'
import {
  matchKnowledgeProgram,
  matchKnowledgeVenue,
  normalizeProgramTitle,
} from './knowledge/load.mjs'
import { isFactStale } from '../src/utils/tipKnowledgeFreshness.ts'

test('normalizes program titles by stripping dates', () => {
  assert.equal(
    normalizeProgramTitle('Family Storytime — Nov 14, 2026'),
    normalizeProgramTitle('Family Storytime'),
  )
})

test('matches Mountain View Library venue aliases', () => {
  const venue = matchKnowledgeVenue('Mountain View Public Library', 'Mountain View')
  assert.equal(venue?.id, 'mountain-view-library')
})

test('matches Outdoor Storytime program at Pioneer Park', () => {
  const venue = matchKnowledgeVenue('Pioneer Park', 'Mountain View')
  const program = matchKnowledgeProgram('Outdoor Storytime', {
    venueId: venue?.id,
    eventUrl: 'https://mountainview.libcal.com/event/17142494',
  })
  assert.equal(program?.id, 'mv-outdoor-storytime-pioneer')
})

test('composes venue < program inheritance for Outdoor Storytime', () => {
  const result = composeTipSuggestions({
    title: 'Outdoor Storytime',
    venue: 'Pioneer Park',
    city: 'Mountain View',
    description: 'Stories in the park.',
    eventUrl: 'https://mountainview.libcal.com/event/17142494',
  })
  assert.equal(result.venueId, 'pioneer-park-mountain-view')
  assert.equal(result.programId, 'mv-outdoor-storytime-pioneer')
  assert.ok(result.suggestions.length >= 2)
  assert.ok(result.suggestions.some((s) => s.category === 'weather'))
  assert.ok(result.suggestions.every((s) => s.prefixedLine.includes('|')))
})

test('drops library indoor restroom tips for outdoor park programs', () => {
  const result = composeTipSuggestions({
    title: 'Outdoor Storytime',
    venue: 'Pioneer Park',
    city: 'Mountain View',
    description: 'Outdoor stories.',
    eventUrl: 'https://mountainview.libcal.com/event/17142494',
  })
  assert.ok(!result.suggestions.some((s) => s.factId === 'mv-lib-restroom'))
})

test('registration contradiction moves drop-in tip to needs review', () => {
  const result = composeTipSuggestions({
    title: 'Outdoor Storytime',
    venue: 'Pioneer Park',
    city: 'Mountain View',
    description: 'Registration required. Space is limited.',
    eventUrl: 'https://mountainview.libcal.com/event/17142494',
  })
  assert.ok(result.needsReview.some((s) => s.category === 'registration'))
})

test('FIT4MOM program match uses venue + title', () => {
  const venue = matchKnowledgeVenue('Cuesta Park', 'Mountain View')
  const program = matchKnowledgeProgram('FIT4MOM Stroller Strides at Cuesta', {
    venueId: venue?.id,
    eventUrl: 'https://sunnyvale.fit4mom.com/our-workouts',
  })
  assert.equal(program?.id, 'fit4mom-stroller-strides-cuesta')
})

test('stable facts are not stale within refresh window', () => {
  assert.equal(
    isFactStale({ verifiedAt: '2026-11-01', volatility: 'stable' }, new Date('2026-11-03')),
    false,
  )
  assert.equal(
    isFactStale({ verifiedAt: '2025-01-01', volatility: 'stable' }, new Date('2026-11-03')),
    true,
  )
})

test('matches Sunnyvale Main Library and composes indoor restroom tip', () => {
  const venue = matchKnowledgeVenue('Sunnyvale Public Library', 'Sunnyvale')
  assert.equal(venue?.id, 'sunnyvale-public-library')
  const result = composeTipSuggestions({
    title: 'Toddler Storytime',
    venue: 'Sunnyvale Public Library',
    city: 'Sunnyvale',
    description: 'Indoor stories at the Main Library.',
    eventUrl: 'https://www.library.sunnyvale.ca.gov/events/kids-events',
  })
  assert.equal(result.venueId, 'sunnyvale-public-library')
  assert.ok(result.suggestions.some((s) => s.factId === 'sv-main-lib-restroom'))
})

test('matches Lakewood Branch Library restroom tip', () => {
  const venue = matchKnowledgeVenue('Lakewood Branch Library and Learning Center', 'Sunnyvale')
  assert.equal(venue?.id, 'sunnyvale-lakewood-library')
  const result = composeTipSuggestions({
    title: 'Winter Magic Show',
    venue: 'Lakewood Branch Library and Learning Center',
    city: 'Sunnyvale',
    description: 'A show indoors at Lakewood.',
    eventUrl: 'https://www.library.sunnyvale.ca.gov/Home/Components/Calendar/Event/13567/129',
  })
  assert.equal(result.venueId, 'sunnyvale-lakewood-library')
  assert.ok(result.suggestions.some((s) => s.factId === 'sv-lakewood-lib-restroom'))
})

test('Magical Bridge Fair Oaks outdoor storytime gets weather, not Main restroom', () => {
  const venue = matchKnowledgeVenue('Magical Bridge Playground · Fair Oaks Park', 'Sunnyvale')
  assert.equal(venue?.id, 'magical-bridge-fair-oaks')
  const program = matchKnowledgeProgram('Storytime at Magical Bridge Playground', {
    venueId: venue?.id,
    eventUrl: 'https://www.library.sunnyvale.ca.gov/events/kids-events',
  })
  assert.equal(program?.id, 'sunnyvale-magical-bridge-storytime')
  const result = composeTipSuggestions({
    title: 'Storytime at Magical Bridge Playground',
    venue: 'Magical Bridge Playground · Fair Oaks Park',
    city: 'Sunnyvale',
    description: 'Outdoor stories at Fair Oaks Park.',
    eventUrl: 'https://www.library.sunnyvale.ca.gov/events/kids-events',
  })
  assert.equal(result.venueId, 'magical-bridge-fair-oaks')
  assert.ok(result.suggestions.some((s) => s.factId === 'sv-magical-bridge-weather'))
  assert.ok(!result.suggestions.some((s) => s.factId === 'sv-main-lib-restroom'))
  assert.ok(!result.suggestions.some((s) => s.factId === 'sv-lakewood-lib-restroom'))
})

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const events = JSON.parse(readFileSync(join(root, 'src/data/sheet-events.json'), 'utf8'))

function byId(id) {
  const event = events.find((row) => row.id === id)
  assert.ok(event, `missing ${id}`)
  return event
}

function hours(event) {
  return (event.sessions ?? []).map((session) => Number(String(session.startTime).split(':')[0]))
}

test('Little Red keeps one row with Morning and After lunch showtimes', () => {
  const event = byId('core-weekend-playhouse-little-red-riding-hood-2026-11-21')
  assert.equal(event.sessions.length, 5)
  const starts = hours(event)
  assert.ok(starts.some((hour) => hour < 12))
  assert.ok(starts.some((hour) => hour >= 12 && hour < 15))
  assert.ok(event.sessions.some((session) => session.date === '2026-11-22' && session.startTime === '14:00'))
})

test('Sleeping Beauty and Gingerbread also store every official Playhouse time', () => {
  const beauty = byId('core-weekend-playhouse-sleeping-beauty-2026-10-24')
  const ginger = byId('core-weekend-playhouse-gingerbread-man-2026-12-19')
  assert.equal(beauty.sessions.length, 5)
  assert.equal(ginger.sessions.length, 8)
  assert.ok(ginger.sessions.some((session) => session.date === '2026-12-21'))
})

test('Hidden Villa is one Los Altos Hills row that also matches After lunch', () => {
  const event = byId('core-weekend-hidden-villa-weekend-farm-tour-2026-11-08')
  assert.equal(event.city, 'Los Altos Hills')
  assert.equal(event.status, 'Published')
  assert.ok(hours(event).includes(13))
  assert.equal(events.find((row) => row.id === 'regional-hidden-villa-weekend-farm-tour-2026-09-19').status, 'Expired')
})

test('Filoli stays Hidden regional so Browse all-cities does not show Woodside', () => {
  const event = byId('regional-filoli-holidays-2026-11-14')
  assert.equal(event.status, 'Hidden')
  assert.equal(event.isRegional, true)
  assert.equal(event.city, 'Woodside')
})

test('Día de Muertos is Free and Zoo Night is membership-priced', () => {
  assert.equal(byId('mountain-view-dia-de-muertos-2026-11-07').cost, 'Free')
  assert.equal(byId('core-weekend-halloween-zoo-night-2026-10-29').cost, '$30')
  assert.match(byId('core-weekend-halloween-zoo-night-2026-10-29').tips, /Membership required/)
})

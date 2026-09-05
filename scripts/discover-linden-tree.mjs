#!/usr/bin/env node
/**
 * Weekly Linden Tree Books calendar pass.
 * Scrapes https://www.lindentreebooks.com/events-calendar/ for ages 0–5
 * Sunday storytimes (+ standing Outdoor Storytime) into Admin Discovery.
 *
 * Usage: node scripts/discover-linden-tree.mjs [--days=90]
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  addDaysYmd,
  parseArgs,
  pacificTodayYmd,
  rootDir,
  sortCandidates,
  summarizeDiscoveryCandidateStats,
  writeDiscoveryOutputs,
  printDiscoverySummary,
} from './discovery-shared.mjs'

export const LINDEN_SOURCE = 'Calendar Watchlist · Linden Tree Books'
export const LINDEN_WATCHLIST_ID = 'linden-tree'
export const LINDEN_CALENDAR_URL = 'https://www.lindentreebooks.com/events-calendar/'
/** Store logo — not Staff Picks collage. */
export const LINDEN_HOST_IMAGE =
  'https://cdn.shoplightspeed.com/shops/611345/themes/10258/v/165078/assets/logo.png'

const VENUE = {
  venue: 'Linden Tree Books',
  address: '265 State Street, Los Altos, CA 94022',
  city: 'Los Altos',
  lat: 37.3792,
  lng: -122.1161,
}

const MONTHS = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
}

const SKIP_RE =
  /\b(middle grade|book club|ya\b|young adult|ages?\s*7|ages?\s*9|ages?\s*12|teens?|workshop|educators?|whiskey|art workshop|buy tickets|spangenberg|conference)\b/i

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72)
}

function parseClockTo24(hourRaw, minuteRaw, meridiem) {
  let hour = Number(hourRaw)
  const minute = Number(minuteRaw || '0')
  const mer = String(meridiem || '').toLowerCase()
  if (mer === 'pm' && hour < 12) hour += 12
  if (mer === 'am' && hour === 12) hour = 0
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function parseDatedLine(line, defaultYear) {
  const match = line.match(
    /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*:\s*(.+)$/i,
  )
  if (!match) return null
  const [, monthName, day, yearMaybe, hour, minute, meridiem, rest] = match
  const month = MONTHS[monthName.toLowerCase()]
  if (!month) return null
  const year = Number(yearMaybe || defaultYear)
  const date = `${year}-${String(month).padStart(2, '0')}-${String(Number(day)).padStart(2, '0')}`
  const startTime = parseClockTo24(hour, minute, meridiem)
  return { date, startTime, titleRest: rest.trim() }
}

function cleanTitle(rest) {
  return rest
    .replace(/<\/?[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*(RSVP Now|Buy Tickets? Now).*$/i, '')
    .trim()
}

function isStorytimeFit(title) {
  const t = title.toLowerCase()
  if (SKIP_RE.test(t)) return false
  return /\bstorytime\b/.test(t)
}

function sundayYmds(startYmd, endYmd) {
  const out = []
  let cur = startYmd
  while (cur <= endYmd) {
    const [y, m, d] = cur.split('-').map(Number)
    const utc = new Date(Date.UTC(y, m - 1, d, 12))
    if (utc.getUTCDay() === 0) out.push(cur)
    cur = addDaysYmd(cur, 1)
  }
  return out
}

function candidateId(date, startTime, title) {
  return `watchlist-linden-${date}-${startTime.replace(':', '')}-${slugify(title)}`
}

function loadLiveLindenKeys() {
  const sheet = JSON.parse(readFileSync(join(rootDir, 'src/data/sheet-events.json'), 'utf8'))
  return sheet
    .filter(
      (e) =>
        (e.venue || '').includes('Linden Tree') &&
        (e.status === 'Published' || e.status === 'Hidden') &&
        /storytime/i.test(e.title || ''),
    )
    .map((e) => ({
      date: e.date,
      startTime: (e.startTime || '').slice(0, 5),
      title: (e.title || '').toLowerCase(),
      status: e.status,
    }))
}

function alreadyOnPuddlesForRow(row, liveRows) {
  const sameSlot = liveRows.filter(
    (e) => e.date === row.date && e.startTime === row.startTime,
  )
  if (sameSlot.length === 0) return false
  if (/outdoor storytime/i.test(row.title)) {
    return sameSlot.some((e) => e.status === 'Published')
  }
  return sameSlot.some(
    (e) => e.status === 'Published' && e.title.includes(row.title.toLowerCase().slice(0, 24)),
  )
}

function buildCandidate(row, checkedYmd, liveRows) {
  // Shared calendar hub URL — do not use URL matching for alreadyOnPuddles.
  return {
    id: candidateId(row.date, row.startTime, row.title),
    title: row.title,
    date: row.date,
    startTime: row.startTime,
    endTime: row.startTime,
    ...VENUE,
    ageRange: 'All ages · Little ones welcome',
    ageMin: 0,
    ageMax: 5,
    audiences: '',
    types: ['Stories', 'Outdoor'],
    categoryTags: ['Stories', 'Outdoor', 'Linden Sunday storytime'],
    cost: 'Free',
    description: row.description,
    tips: row.tips,
    imageUrl: LINDEN_HOST_IMAGE,
    eventUrl: LINDEN_CALENDAR_URL,
    source: LINDEN_SOURCE,
    watchlistSourceId: LINDEN_WATCHLIST_ID,
    isCancelled: false,
    isRecurring: /outdoor storytime/i.test(row.title),
    alreadyOnPuddles: alreadyOnPuddlesForRow(row, liveRows),
    reviewStatus: 'pending',
    convertedEventId: '',
    lastChecked: checkedYmd,
  }
}

export async function discoverLindenTree({ days = 90, writeAdmin = true } = {}) {
  const startYmd = pacificTodayYmd()
  const endYmd = addDaysYmd(startYmd, days)
  const year = Number(startYmd.slice(0, 4))

  const res = await fetch(LINDEN_CALENDAR_URL, {
    headers: { 'user-agent': 'PuddlesDiscoveryBot/1.0 (+https://puddlesmap.com)' },
  })
  if (!res.ok) throw new Error(`Linden Tree fetch failed: ${res.status}`)
  const html = await res.text()

  const liTexts = [...html.matchAll(/<li>([\s\S]*?)<\/li>/gi)].map((m) =>
    m[1]
      .replace(/<\/?[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&#039;/g, "'")
      .replace(/\s+/g, ' ')
      .trim(),
  )

  const namedByDate = new Map()
  for (const line of liTexts) {
    const parsed = parseDatedLine(line, year)
    if (!parsed) continue
    if (parsed.date < startYmd || parsed.date > endYmd) continue
    const title = cleanTitle(parsed.titleRest)
    if (!isStorytimeFit(title)) continue
    const key = `${parsed.date}|${parsed.startTime}`
    namedByDate.set(key, {
      date: parsed.date,
      startTime: parsed.startTime,
      title:
        title.startsWith('Storytime') || title.startsWith('Outdoor')
          ? title
          : `Storytime · ${title}`,
      description: `${title} — outdoor Sunday storytime at Linden Tree Books in front of the store.`,
      tips: 'In front of the store · picture books for little ones and their grown-ups.\nManresa Bread next door if you want a treat.',
    })
  }

  // Standing weekly Outdoor Storytime (official: every Sunday 10:30am).
  for (const date of sundayYmds(startYmd, endYmd)) {
    const key = `${date}|10:30`
    if (namedByDate.has(key)) continue
    namedByDate.set(key, {
      date,
      startTime: '10:30',
      title: 'Outdoor Storytime',
      description:
        'Join us every Sunday morning at 10:30am in front of the store as one of our booksellers (or perhaps a local author) shares some of their favorite read-alouds. All storytimes feature picture books and are appropriate for all ages.',
      tips: 'Weekly · Sundays in front of the store — guest authors sometimes fill this slot; check the Linden Tree calendar.\nManresa Bread next door if you want a treat.',
    })
  }

  const liveRows = loadLiveLindenKeys()
  const candidates = sortCandidates(
    [...namedByDate.values()]
      .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
      .map((row) => buildCandidate(row, startYmd, liveRows)),
  )

  const stats = summarizeDiscoveryCandidateStats(candidates)
  const paths = writeDiscoveryOutputs({
    fileStem: 'linden-tree',
    payload: {
      generatedAt: new Date().toISOString(),
      source: LINDEN_SOURCE,
      library: 'Linden Tree Books',
      libraries: ['linden-tree'],
      window: { start: startYmd, end: endYmd, days },
      stats,
      candidates,
    },
    writeAdmin,
    sourcesToReplace: [LINDEN_SOURCE],
  })

  printDiscoverySummary({
    label: 'Linden Tree Books',
    days,
    stats,
    candidates,
    newOnly: candidates.filter((c) => !c.alreadyOnPuddles),
    paths,
  })

  return { candidates, stats, startYmd, endYmd, paths }
}

async function main() {
  const { days, writeAdmin } = parseArgs(process.argv.slice(2), { days: 90 })
  await discoverLindenTree({ days, writeAdmin })
}

const isMain =
  Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}

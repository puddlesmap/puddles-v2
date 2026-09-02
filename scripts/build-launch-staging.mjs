#!/usr/bin/env node
/**
 * Build launch-staging-events.json from Hello Fall pipeline (high/medium only),
 * FIT4MOM series (Las Palmas, Cuesta, Mitchell), and Sunnyvale library storytime seeds.
 *
 * Usage: node scripts/build-launch-staging.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolvePublishingFields } from './publishing.mjs'
import {
  buildMartiGoodToKnow,
  buildSunnyvaleLibrarySeriesGoodToKnow,
  FIT4MOM_SERIES_COPY,
} from './fit4mom-tips.mjs'
import { MUSIC_TOGETHER_FALL_2026 } from './series-enrollment-tips.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const OUT_PATH = join(root, 'src/data/launch-staging-events.json')
const VERIFIED_DATE = '2026-09-01'

/** Discovery IDs in HELLO_FALL_DISCOVERY_PIPELINE — exclude priority low. */
const PIPELINE_IDS = [
  '16188977',
  '6a7bb022a821f90037ed3e17',
  'watchlist-mini-yoga-treehouse-2026-09-26',
  'watchlist-marti-parent-baby-2026-09-26',
]

/** Parent & Me launch staging — not Hello Fall editorial collection. */
const PARENT_ME_STAGING_IDS = ['watchlist-mt-pa-fall-mixed-ages-2026']

const FIT4MOM_SERIES = [
  {
    sampleId: 'watchlist-fit4mom-stroller-strides-laspalmas-2026-09-01',
    seriesId: 'watchlist-fit4mom-stroller-strides-laspalmas-series',
    requireCity: 'Sunnyvale',
  },
  {
    sampleId: 'watchlist-fit4mom-mommy-baby-yoga-laspalmas-2026-09-01',
    seriesId: 'watchlist-fit4mom-mommy-baby-yoga-laspalmas-series',
    requireCity: 'Sunnyvale',
  },
  {
    sampleId: 'watchlist-fit4mom-stroller-strides-cuesta-2026-09-04',
    seriesId: 'watchlist-fit4mom-stroller-strides-cuesta-series',
  },
  {
    sampleId: 'watchlist-fit4mom-stroller-barre-cuesta-2026-09-02',
    seriesId: 'watchlist-fit4mom-stroller-barre-cuesta-series',
  },
  {
    sampleId: 'watchlist-fit4mom-fourth-trimester-cuesta-2026-09-02',
    seriesId: 'watchlist-fit4mom-fourth-trimester-cuesta-series',
  },
  {
    sampleId: 'watchlist-fit4mom-family-strides-cuesta-2026-09-05',
    seriesId: 'watchlist-fit4mom-family-strides-cuesta-series',
  },
  {
    sampleId: 'watchlist-fit4mom-stroller-barre-mitchell-2026-09-03',
    seriesId: 'watchlist-fit4mom-stroller-barre-mitchell-series',
  },
]

const MARTI_SERIES_ID = 'disc-marti-parent-baby-yoga-series-2026'

const TRAIN_DAY_CANDIDATE_ID = 'watchlist-lahm-train-day-2026-08-30'

/** Hello Fall home carousel — featured IDs not yet on the live sheet. */
const HELLO_FALL_FEATURED_SEEDS = [
  {
    id: 'art-studios-open-house-palo-alto-art-center-2026-09-02-16-00',
    title: 'Art Studios Open House',
    description: 'Explore the studios, meet artists & see how art gets made.',
    venue: 'Palo Alto Art Center',
    address: '1313 Newell Road, Palo Alto, CA 94303',
    city: 'Palo Alto',
    date: '2026-09-02',
    startTime: '16:00',
    endTime: '19:00',
    ageRange: '0–2, 2–5, 5+',
    ageMin: 0,
    ageMax: 5,
    types: ['Arts & Crafts'],
    categoryTags: ['Arts & Crafts', 'Hello Fall featured seed'],
    cost: 'Free',
    imageUrl:
      'https://www.paloalto.gov/files/content/public/v/2/departments/community-services/arts-sciences/palo-alto-art-center/art-center-main-page-rotating-banner/studios-image/ceramics-studio.jpg',
    lat: 37.4441,
    lng: -122.1392,
  },
]

const TYPE_OVERRIDES = {
  '6a7bb022a821f90037ed3e17': ['Music & Movement'],
}

/** Official class photos from sunnyvale.fit4mom.com/our-workouts (and prenatal page). */
const FIT4MOM_STROLLER_STRIDES =
  'https://static.spacecrafted.com/dbfd6ca9d440403f89a29bb6ef274b92/i/b1d4bba1caf446edaff553933886ce3a/1/4SoifmQpDrHbZJ6VybMjS/FIT4MOM%20Stroller%20Strides%20stroller%20workout%20for%20moms.jpg'
const FIT4MOM_STROLLER_BARRE =
  'https://static.spacecrafted.com/dbfd6ca9d440403f89a29bb6ef274b92/i/dc6450fd530c46908f3e38abeba487e1/1/4SoifmQpDrHbZJ6VybMjS/strollerbarre.jpeg'
const FIT4MOM_STRIDES_360 =
  'https://static.spacecrafted.com/dbfd6ca9d440403f89a29bb6ef274b92/i/a253ff95ba7a49cd8adb94b7da4c66e5/1/4SoifmQpDrHbZJ6VybMjS/strides360.jpeg'
const FIT4MOM_MOMMY_BABY =
  'https://static.spacecrafted.com/dbfd6ca9d440403f89a29bb6ef274b92/i/ee462d0ca5bc4fe88d0d4863fceebe05/1/4SoifmQpDrHbZJ6W5XJrp/3V7A8901.jpg'
const FIT4MOM_FOURTH_TRIMESTER =
  'https://static.spacecrafted.com/dbfd6ca9d440403f89a29bb6ef274b92/i/e2defeaaf73f43e48de87d5adc0992f4/1/4SoifmQpDrHbZJ6W5XJrp/what-to-expect-in-class.jpg'

const IMAGE_OVERRIDES = {
  'watchlist-fit4mom-stroller-strides-laspalmas-series': FIT4MOM_STROLLER_STRIDES,
  'watchlist-fit4mom-stroller-strides-cuesta-series': FIT4MOM_STROLLER_STRIDES,
  'watchlist-fit4mom-stroller-barre-cuesta-series': FIT4MOM_STROLLER_BARRE,
  'watchlist-fit4mom-stroller-barre-mitchell-series': FIT4MOM_STROLLER_BARRE,
  'watchlist-fit4mom-family-strides-cuesta-series': FIT4MOM_STRIDES_360,
  'watchlist-fit4mom-mommy-baby-yoga-laspalmas-series': FIT4MOM_MOMMY_BABY,
  'watchlist-fit4mom-fourth-trimester-cuesta-series': FIT4MOM_FOURTH_TRIMESTER,
}

const DESCRIPTION_OVERRIDES = {
  'watchlist-mini-yoga-treehouse-2026-09-26':
    'Movement, music & mindfulness on the lawn — grown-ups and little ones practice yoga together.',
  '6a7bb022a821f90037ed3e17':
    'Bilingual songs, instruments & dancing for tiny humans and their grown-ups — Hispanic Heritage Month.',
  '16188977':
    'Mandarin stories, picture books & hands-on Mid-Autumn crafts with PiggySprout.',
  'watchlist-mt-pa-fall-mixed-ages-2026': MUSIC_TOGETHER_FALL_2026.description,
}

/** Sunnyvale Public Library recurring storytimes (manual seeds until discover-sunnyvale.mjs). */
const SUNNYVALE_LIBRARY_SERIES = [
  {
    id: 'staging-sunnyvale-library-baby-lapsit-series',
    title: 'Baby Lapsit & Playtime',
    description: 'Rhymes, songs & lap bounces for babies — then stay & play with other families.',
    dayLabel: 'Thursdays',
    startTime: '10:30',
    endTime: '11:15',
    ageRange: '0–2',
    ageMin: 0,
    ageMax: 2,
    types: ['Stories'],
    date: '2026-09-04',
  },
  {
    id: 'staging-sunnyvale-library-toddler-storytime-series',
    title: 'Toddler Storytime',
    description: 'Short stories, songs & movement for wiggly toddlers and their grown-ups.',
    dayLabel: 'Tuesdays',
    startTime: '11:00',
    endTime: '11:30',
    ageRange: '0–2, 2–5',
    ageMin: 1,
    ageMax: 3,
    types: ['Stories'],
    date: '2026-09-02',
  },
  {
    id: 'staging-sunnyvale-library-preschool-storytime-series',
    title: 'Preschool Storytime',
    description: 'Picture books, songs & early-literacy play for preschoolers ready to sit & listen.',
    dayLabel: 'Wednesdays',
    startTime: '11:00',
    endTime: '11:30',
    ageRange: '2–5',
    ageMin: 3,
    ageMax: 5,
    types: ['Stories'],
    date: '2026-09-03',
  },
  {
    id: 'staging-sunnyvale-library-family-storytime-series',
    title: 'Family Storytime',
    description: 'Stories & songs for the whole family — siblings welcome on Saturday mornings.',
    dayLabel: 'Saturdays',
    startTime: '11:00',
    endTime: '11:30',
    ageRange: '0–2, 2–5',
    ageMin: 0,
    ageMax: 5,
    types: ['Stories'],
    date: '2026-09-06',
  },
  {
    id: 'staging-sunnyvale-library-night-owl-storytime-series',
    title: 'Night Owl Storytime',
    description: 'Pajama-friendly stories & songs before bed — a calm evening outing with little ones.',
    dayLabel: 'Thursdays',
    startTime: '19:00',
    endTime: '19:30',
    ageRange: '0–2, 2–5',
    ageMin: 0,
    ageMax: 5,
    types: ['Stories'],
    date: '2026-09-04',
  },
  {
    id: 'staging-sunnyvale-library-magical-bridge-storytime-series',
    title: 'Storytime at Magical Bridge Playground',
    description: 'Outdoor stories at Fair Oaks Park’s inclusive playground — sing, rhyme & explore.',
    dayLabel: 'First Fridays',
    startTime: '11:00',
    endTime: '11:30',
    ageRange: '0–2, 2–5',
    ageMin: 0,
    ageMax: 5,
    types: ['Stories', 'Outdoor'],
    date: '2026-09-05',
    venue: 'Magical Bridge Playground · Fair Oaks Park',
    address: '540 N Fair Oaks Ave, Sunnyvale, CA 94085',
    lat: 37.3902,
    lng: -122.0085,
  },
]

const LIBRARY_MAIN = {
  venue: 'Sunnyvale Public Library',
  address: '665 W Olive Ave, Sunnyvale, CA 94086',
  city: 'Sunnyvale',
  lat: 37.3688,
  lng: -122.0363,
  eventUrl: 'https://www.library.sunnyvale.ca.gov/events/kids-events',
  imageUrl:
    'https://upload.wikimedia.org/wikipedia/commons/8/89/Sunnyvale_Public_Library_%28January_2025%29.jpg',
}

function loadCandidates() {
  const raw = JSON.parse(readFileSync(join(root, 'src/data/discovery-candidates.json'), 'utf8'))
  const byId = new Map()
  for (const candidate of raw.candidates ?? []) {
    byId.set(candidate.id, candidate)
  }
  return byId
}

function asPublishedEvent(partial) {
  const { status, isPast, isLive } = resolvePublishingFields({
    statusRaw: 'Published',
    approvedRaw: true,
    isPastRaw: false,
    isLiveRaw: true,
    date: partial.date,
    endTime: partial.endTime,
  })
  return {
    categoryTags: [],
    imageUrl: '',
    room: '',
    ...partial,
    status,
    isPast,
    isLive,
    verifiedDate: partial.verifiedDate || VERIFIED_DATE,
  }
}

function candidateToEvent(candidate, { seriesId, seriesNote } = {}) {
  const id = seriesId || candidate.id
  const types = TYPE_OVERRIDES[candidate.id] || candidate.types || ['Other']
  const description =
    DESCRIPTION_OVERRIDES[candidate.id] ||
    String(candidate.description || '')
      .split('\n')[0]
      .trim()

  let tips = candidate.tips || ''
  if (seriesNote) {
    tips = [seriesNote, tips].filter(Boolean).join('\n')
  }

  return asPublishedEvent({
    id,
    title: candidate.title,
    description,
    tips,
    venue: candidate.venue,
    room: candidate.room || '',
    address: candidate.address || '',
    city: candidate.city,
    date: candidate.date,
    startTime: candidate.startTime || '',
    endTime: candidate.endTime || '',
    ageRange: candidate.ageRange || '0–2, 2–5',
    ageMin: candidate.ageMin ?? 0,
    ageMax: candidate.ageMax ?? 5,
    types,
    categoryTags: candidate.categoryTags || [],
    cost: candidate.cost || 'Free',
    imageUrl: candidate.imageUrl || '',
    eventUrl: candidate.eventUrl || '#',
    lat: candidate.lat ?? 0,
    lng: candidate.lng ?? 0,
  })
}

function buildMartiSeries(candidates) {
  const sample =
    candidates.get('watchlist-marti-parent-baby-2026-09-12') ||
    candidates.get('watchlist-marti-parent-baby-2026-09-26')
  if (!sample) return null

  return asPublishedEvent({
    id: MARTI_SERIES_ID,
    title: 'Parent & Baby Yoga with Marti Foster',
    description:
      'Outdoor yoga at Pioneer Park — grown-up and baby practice together, with feeding & diaper breaks welcome.',
    tips: buildMartiGoodToKnow(),
    venue: sample.venue,
    address: sample.address,
    city: sample.city,
    date: '2026-09-06',
    startTime: sample.startTime || '11:15',
    endTime: sample.endTime || '12:15',
    ageRange: sample.ageRange || '0–2',
    ageMin: sample.ageMin ?? 0,
    ageMax: sample.ageMax ?? 2,
    types: ['Parent & Me', 'Outdoor'],
    categoryTags: ['Parent & Me', 'Series · do not explode weekly'],
    cost: sample.cost || 'Paid',
    imageUrl: sample.imageUrl || '',
    eventUrl: sample.eventUrl || '#',
    lat: sample.lat ?? 0,
    lng: sample.lng ?? 0,
  })
}

function buildFit4MomSeries(candidate, config) {
  const copy = FIT4MOM_SERIES_COPY[config.seriesId]
  if (!copy) {
    throw new Error(`Missing FIT4MOM_SERIES_COPY for ${config.seriesId}`)
  }
  const event = candidateToEvent(candidate, { seriesId: config.seriesId, seriesNote: null })
  event.id = config.seriesId
  event.title = candidate.title
  event.description = copy.description
  event.tips = copy.tips
  event.categoryTags = ['Parent & Me', 'Series · do not explode weekly']
  if (IMAGE_OVERRIDES[event.id]) {
    event.imageUrl = IMAGE_OVERRIDES[event.id]
  }
  return event
}

function buildLibrarySeries(seed) {
  const venue = seed.venue || LIBRARY_MAIN.venue
  const address = seed.address || LIBRARY_MAIN.address
  return asPublishedEvent({
    id: seed.id,
    title: seed.title,
    description: seed.description,
    tips: buildSunnyvaleLibrarySeriesGoodToKnow(seed.dayLabel),
    venue,
    address,
    city: LIBRARY_MAIN.city,
    date: seed.date,
    startTime: seed.startTime,
    endTime: seed.endTime,
    ageRange: seed.ageRange,
    ageMin: seed.ageMin,
    ageMax: seed.ageMax,
    types: seed.types,
    categoryTags: ['Stories', 'Series · Sunnyvale library seed'],
    cost: 'Free',
    imageUrl: LIBRARY_MAIN.imageUrl,
    eventUrl: LIBRARY_MAIN.eventUrl,
    lat: seed.lat ?? LIBRARY_MAIN.lat,
    lng: seed.lng ?? LIBRARY_MAIN.lng,
  })
}

function buildTrainDayFeatured(candidates) {
  const candidate = candidates.get(TRAIN_DAY_CANDIDATE_ID)
  if (!candidate) return null

  const event = candidateToEvent(candidate)
  event.id =
    candidate.convertedEventId || 'train-day-los-altos-history-museum-2026-08-30-11-00'
  event.categoryTags = ['Festivals & Community', 'Hello Fall featured seed']
  return event
}

function main() {
  const candidates = loadCandidates()
  const events = []
  const skipped = []

  for (const id of PIPELINE_IDS) {
    if (id === 'watchlist-marti-parent-baby-2026-09-26') continue
    const candidate = candidates.get(id)
    if (!candidate) {
      skipped.push({ id, reason: 'missing from discovery-candidates.json' })
      continue
    }
    events.push(candidateToEvent(candidate))
  }

  for (const id of PARENT_ME_STAGING_IDS) {
    const candidate = candidates.get(id)
    if (!candidate) {
      skipped.push({ id, reason: 'missing from discovery-candidates.json' })
      continue
    }
    if (id === 'watchlist-mt-pa-fall-mixed-ages-2026') {
      const event = candidateToEvent(candidate)
      event.description = MUSIC_TOGETHER_FALL_2026.description
      event.tips = MUSIC_TOGETHER_FALL_2026.tips
      events.push(event)
      continue
    }
    events.push(candidateToEvent(candidate))
  }

  const marti = buildMartiSeries(candidates)
  if (marti) events.push(marti)
  else skipped.push({ id: MARTI_SERIES_ID, reason: 'no Marti Foster candidate found' })

  for (const config of FIT4MOM_SERIES) {
    const candidate = candidates.get(config.sampleId)
    if (!candidate) {
      skipped.push({ id: config.seriesId, reason: `missing sample ${config.sampleId}` })
      continue
    }
    if (config.requireCity && candidate.city !== config.requireCity) {
      skipped.push({
        id: config.seriesId,
        reason: `expected ${config.requireCity}, got ${candidate.city}`,
      })
      continue
    }
    events.push(buildFit4MomSeries(candidate, config))
  }

  for (const seed of SUNNYVALE_LIBRARY_SERIES) {
    events.push(buildLibrarySeries(seed))
  }

  for (const seed of HELLO_FALL_FEATURED_SEEDS) {
    events.push(asPublishedEvent(seed))
  }

  const trainDay = buildTrainDayFeatured(candidates)
  if (trainDay) events.push(trainDay)
  else skipped.push({ id: TRAIN_DAY_CANDIDATE_ID, reason: 'Train Day candidate missing' })

  events.sort(
    (a, b) =>
      String(a.date).localeCompare(String(b.date)) ||
      String(a.startTime).localeCompare(String(b.startTime)) ||
      String(a.title).localeCompare(String(b.title)),
  )

  writeFileSync(OUT_PATH, `${JSON.stringify(events, null, 2)}\n`)

  const sunnyvale = events.filter((e) => e.city === 'Sunnyvale').length
  const parentAndMe = events.filter((e) => e.types.includes('Parent & Me')).length

  console.log(`Wrote ${events.length} staging events → ${OUT_PATH}`)
  console.log(`  Sunnyvale: ${sunnyvale}`)
  console.log(`  Parent & Me: ${parentAndMe}`)
  if (skipped.length) {
    console.warn('Skipped:', skipped)
  }
}

main()

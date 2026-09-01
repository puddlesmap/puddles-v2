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
  buildFit4momSeriesGoodToKnow,
  buildMartiGoodToKnow,
  buildSunnyvaleLibrarySeriesGoodToKnow,
  FIT4MOM_LAS_PALMAS_MOMMY_BABY_YOGA,
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
    dayLabel: 'Tuesdays',
    description:
      'Stroller workout at Las Palmas Park — cardio & strength for grown-ups with baby in tow.',
    requireCity: 'Sunnyvale',
  },
  {
    sampleId: 'watchlist-fit4mom-mommy-baby-yoga-laspalmas-2026-09-01',
    seriesId: 'watchlist-fit4mom-mommy-baby-yoga-laspalmas-series',
    dayLabel: 'Tuesdays',
    description: FIT4MOM_LAS_PALMAS_MOMMY_BABY_YOGA.description,
    tips: FIT4MOM_LAS_PALMAS_MOMMY_BABY_YOGA.tips,
    requireCity: 'Sunnyvale',
  },
  {
    sampleId: 'watchlist-fit4mom-stroller-strides-cuesta-2026-09-04',
    seriesId: 'watchlist-fit4mom-stroller-strides-cuesta-series',
    dayLabel: 'Mondays & Fridays',
    description:
      'Stroller Strides at Cuesta Park — cardio & strength for grown-ups with baby in tow.',
  },
  {
    sampleId: 'watchlist-fit4mom-stroller-barre-cuesta-2026-09-02',
    seriesId: 'watchlist-fit4mom-stroller-barre-cuesta-series',
    dayLabel: 'Wednesdays',
    description:
      'Stroller Barre at Cuesta Park — barre-style workout with little ones in strollers.',
  },
  {
    sampleId: 'watchlist-fit4mom-fourth-trimester-cuesta-2026-09-02',
    seriesId: 'watchlist-fit4mom-fourth-trimester-cuesta-series',
    dayLabel: 'Wednesdays',
    description:
      'Fourth Trimester+ postpartum class — caregiver movement with baby welcome.',
  },
  {
    sampleId: 'watchlist-fit4mom-family-strides-cuesta-2026-09-05',
    seriesId: 'watchlist-fit4mom-family-strides-cuesta-series',
    dayLabel: 'Saturdays',
    description: 'Family Strides 360 — stroller fitness for the whole family at Cuesta Park.',
  },
  {
    sampleId: 'watchlist-fit4mom-stroller-barre-mitchell-2026-09-03',
    seriesId: 'watchlist-fit4mom-stroller-barre-mitchell-series',
    dayLabel: 'Thursdays',
    description:
      'Stroller Barre at Mitchell Park — caregiver workout with child in stroller.',
  },
]

const MARTI_SERIES_ID = 'disc-marti-parent-baby-yoga-series-2026'

const TYPE_OVERRIDES = {
  '6a7bb022a821f90037ed3e17': ['Music & Movement'],
}

const IMAGE_OVERRIDES = {
  'watchlist-fit4mom-stroller-strides-laspalmas-series':
    'https://static.spacecrafted.com/fc7241510ec245c5b42e95561258cdcc/i/b741a4bd9ece4c65b1ac9ec9d2124a48/1/GCuCv726gZycFxatXh9yJ4/Moms%20giving%20high%20fives%20while%20pushing%20strollers%20in%20the%20park%20at%20a%20fit%20for%20mom%20stroller%20strides%20class.png',
  'watchlist-fit4mom-stroller-strides-cuesta-series':
    'https://static.spacecrafted.com/fc7241510ec245c5b42e95561258cdcc/i/b741a4bd9ece4c65b1ac9ec9d2124a48/1/GCuCv726gZycFxatXh9yJ4/Moms%20giving%20high%20fives%20while%20pushing%20strollers%20in%20the%20park%20at%20a%20fit%20for%20mom%20stroller%20strides%20class.png',
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
  const venue = candidate.venue || 'Las Palmas Park'
  const tips =
    config.tips ??
    buildFit4momSeriesGoodToKnow({
      title: candidate.title,
      venue,
      dayLabel: config.dayLabel,
    })
  const event = candidateToEvent(candidate, { seriesId: config.seriesId, seriesNote: null })
  event.id = config.seriesId
  event.title = candidate.title
  event.description = config.description
  event.tips = tips
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
    imageUrl: '',
    eventUrl: LIBRARY_MAIN.eventUrl,
    lat: seed.lat ?? LIBRARY_MAIN.lat,
    lng: seed.lng ?? LIBRARY_MAIN.lng,
  })
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
      event.tips = [MUSIC_TOGETHER_FALL_2026.seriesNote, MUSIC_TOGETHER_FALL_2026.tips]
        .filter(Boolean)
        .join('\n')
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

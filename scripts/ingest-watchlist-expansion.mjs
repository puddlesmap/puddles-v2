#!/usr/bin/env node
/**
 * Queue discovery rows from calendar-watchlist knownEventPages + expansion picks
 * + Regional · Worth a Drive destinations (Bay Area festivals, farms, trains).
 *
 * Usage: node scripts/ingest-watchlist-expansion.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import {
  isUrlAlreadyOnPuddles,
  loadCatalogUrls,
  loadExistingDiscoveryCandidates,
  sortCandidates,
  DISCOVERY_ADMIN_PATH,
} from './discovery-shared.mjs'

const EXPANSION_ROWS = [
  {
    id: 'watchlist-google-endless-summer-festival-2026-09-12',
    title: 'Endless Summer Festival',
    date: '2026-09-12',
    startTime: '11:00',
    endTime: '16:00',
    venue: 'Google Visitor Experience',
    address: '2000 N Shoreline Blvd, Mountain View, CA 94043',
    city: 'Mountain View',
    lat: 37.4227,
    lng: -122.0844,
    ageRange: '0–2, 2–5, 5+',
    ageMin: 0,
    ageMax: 5,
    types: ['Festivals & Community', 'Outdoor'],
    categoryTags: ['Seasonal', 'Community'],
    cost: 'Free',
    description:
      'Free all-ages plaza festival — magic shows, family DJs, slime truck, 3D chalk art, crafts with local nonprofits, and a kids sports zone (pickleball, basketball).',
    tips: 'Register for a reminder on the official page. Arrive early for parking; plaza is outdoors.',
    imageUrl: 'https://services.google.com/fh/files/misc/mini-yoga-club-flipped.png',
    eventUrl: 'https://rsvp.withgoogle.com/events/endless-summer-festival-2026',
    source: 'Calendar Watchlist · Google Visitor Experience',
    watchlistSourceId: 'google-visitor-experience',
  },
  {
    id: 'watchlist-sunnyvale-hands-on-the-arts-2026-10-17',
    title: 'Hands on the Arts',
    date: '2026-10-17',
    startTime: '10:30',
    endTime: '15:00',
    venue: 'Sunnyvale Community Center',
    address: '550 E Remington Dr, Sunnyvale, CA 94087',
    city: 'Sunnyvale',
    lat: 37.3782,
    lng: -122.0265,
    ageRange: '2–5, 5+',
    ageMin: 2,
    ageMax: 5,
    types: ['Arts & Crafts', 'Festivals & Community'],
    categoryTags: ['Seasonal', 'Sunnyvale'],
    cost: 'Free',
    description:
      '20+ hands-on art booths, roving performers, and food vendors — Sunnyvale’s long-running children’s arts festival celebrating cultures from around the world.',
    tips: 'Free wristband at check-in unlocks all workshops (booths tailored ~ages 3–15; best for preschool+). Limited parking; bike valet often available.',
    imageUrl: '',
    eventUrl: 'https://www.sunnyvale.ca.gov/recreation-and-community/special-events',
    source: 'Calendar Watchlist · City of Sunnyvale · Special Events',
    watchlistSourceId: 'sunnyvale-special-events',
  },
  {
    id: 'watchlist-sunnyvale-library-sensory-storytime-2026-09-09',
    title: 'Sensory Storytime',
    date: '2026-09-09',
    startTime: '15:00',
    endTime: '15:45',
    venue: 'Sunnyvale Public Library',
    address: '665 W Olive Ave, Sunnyvale, CA 94086',
    city: 'Sunnyvale',
    lat: 37.3688,
    lng: -122.0363,
    ageRange: '2–5',
    ageMin: 3,
    ageMax: 5,
    types: ['Stories'],
    categoryTags: ['Sunnyvale', 'Library special'],
    cost: 'Free',
    description:
      'Interactive literacy with movement, music, sensory materials & a calmer group size — great for little ones who need a gentler storytime.',
    tips: 'Registration required · limited spots. Caregivers stay with children.',
    imageUrl: '',
    eventUrl: 'https://www.library.sunnyvale.ca.gov/events/kids-events#sensory-storytime-2026-09-09',
    source: 'Calendar Watchlist · Sunnyvale Public Library · Kids Events',
    watchlistSourceId: 'sunnyvale-library',
  },
  {
    id: 'watchlist-sunnyvale-library-bilingual-hebrew-storytime-2026-09-11',
    title: 'Bilingual Hebrew-English Storytime',
    date: '2026-09-11',
    startTime: '11:00',
    endTime: '12:00',
    venue: 'Sunnyvale Public Library',
    address: '665 W Olive Ave, Sunnyvale, CA 94086',
    city: 'Sunnyvale',
    lat: 37.3688,
    lng: -122.0363,
    ageRange: '0–2, 2–5',
    ageMin: 0,
    ageMax: 5,
    types: ['Stories'],
    categoryTags: ['Sunnyvale', 'Library special'],
    cost: 'Free',
    description: 'Stories, songs & rhymes in Hebrew and English for little ones and their grown-ups.',
    tips: 'No registration — arrive early; doors close when the room is full.',
    imageUrl: '',
    eventUrl:
      'https://www.library.sunnyvale.ca.gov/events/kids-events#bilingual-hebrew-storytime-2026-09-11',
    source: 'Calendar Watchlist · Sunnyvale Public Library · Kids Events',
    watchlistSourceId: 'sunnyvale-library',
  },
  {
    id: 'watchlist-sunnyvale-library-mid-autumn-storytime-craft-2026-09-13',
    title: 'Mid-Autumn Festival Storytime and Craft',
    date: '2026-09-13',
    startTime: '14:00',
    endTime: '15:00',
    venue: 'Sunnyvale Public Library',
    address: '665 W Olive Ave, Sunnyvale, CA 94086',
    city: 'Sunnyvale',
    lat: 37.3688,
    lng: -122.0363,
    ageRange: '0–2, 2–5',
    ageMin: 0,
    ageMax: 5,
    types: ['Stories', 'Arts & Crafts'],
    categoryTags: ['Sunnyvale', 'Library special', 'Hello Fall'],
    cost: 'Free',
    description:
      'Seasonal Mid-Autumn stories plus a hands-on craft — a gentle festival outing for little ones.',
    tips: 'No registration — arrive early; doors close when the room is full.',
    imageUrl: '',
    eventUrl:
      'https://www.library.sunnyvale.ca.gov/events/kids-events#mid-autumn-storytime-craft-2026-09-13',
    source: 'Calendar Watchlist · Sunnyvale Public Library · Kids Events',
    watchlistSourceId: 'sunnyvale-library',
  },
  {
    id: 'watchlist-sunnyvale-library-asl-for-babies-2026-09-14',
    title: 'ASL for Babies',
    date: '2026-09-14',
    startTime: '11:00',
    endTime: '12:00',
    venue: 'Sunnyvale Public Library',
    address: '665 W Olive Ave, Sunnyvale, CA 94086',
    city: 'Sunnyvale',
    lat: 37.3688,
    lng: -122.0363,
    ageRange: '0–2',
    ageMin: 0,
    ageMax: 2,
    types: ['Parent & Me', 'Stories'],
    categoryTags: ['Sunnyvale', 'Library special', 'Parent & Me'],
    cost: 'Free',
    description:
      'Early signs with songs and play — grown-ups and babies learn simple ASL together.',
    tips: 'No registration — arrive early; doors close when the room is full.',
    imageUrl: '',
    eventUrl: 'https://www.library.sunnyvale.ca.gov/events/kids-events#asl-for-babies-2026-09-14',
    source: 'Calendar Watchlist · Sunnyvale Public Library · Kids Events',
    watchlistSourceId: 'sunnyvale-library',
  },
  {
    id: 'watchlist-sunnyvale-library-bilingual-spanish-storytime-craft-2026-09-18',
    title: 'Bilingual (Spanish/English) Storytime & Craft',
    date: '2026-09-18',
    startTime: '11:00',
    endTime: '12:00',
    venue: 'Sunnyvale Public Library',
    address: '665 W Olive Ave, Sunnyvale, CA 94086',
    city: 'Sunnyvale',
    lat: 37.3688,
    lng: -122.0363,
    ageRange: '0–2, 2–5',
    ageMin: 0,
    ageMax: 5,
    types: ['Stories', 'Arts & Crafts'],
    categoryTags: ['Sunnyvale', 'Library special'],
    cost: 'Free',
    description:
      'Stories and songs in Spanish and English, then a simple craft for little hands.',
    tips: 'No registration — arrive early; doors close when the room is full.',
    imageUrl: '',
    eventUrl:
      'https://www.library.sunnyvale.ca.gov/events/kids-events#bilingual-spanish-storytime-craft-2026-09-18',
    source: 'Calendar Watchlist · Sunnyvale Public Library · Kids Events',
    watchlistSourceId: 'sunnyvale-library',
  },
  {
    id: 'watchlist-sunnyvale-diwali-sacas-2026-10-03',
    title: 'Sunnyvale Diwali Festival',
    date: '2026-10-03',
    startTime: '11:30',
    endTime: '19:30',
    venue: 'Downtown Sunnyvale',
    address: '230 S Murphy Ave, Sunnyvale, CA 94086',
    city: 'Sunnyvale',
    lat: 37.3789,
    lng: -122.0302,
    ageRange: '0–2, 2–5, 5+',
    ageMin: 0,
    ageMax: 5,
    types: ['Festivals & Community', 'Arts & Crafts'],
    categoryTags: ['Seasonal', 'Sunnyvale'],
    cost: 'Free',
    description:
      'Free downtown Diwali mela — Kids Zone with diya painting, face painting, bookmark workshop & balloon activities, plus dance performances and food vendors.',
    tips: 'Free entry; food and henna are pay-as-you-go. Same weekend as Mid-Autumn Festival downtown — plan for crowds.',
    imageUrl: '',
    eventUrl: 'https://www.sacas.org/',
    source: 'Calendar Watchlist · Downtown Sunnyvale · Cityline & Murphy Ave',
    watchlistSourceId: 'sunnyvale-downtown',
  },
  {
    id: 'watchlist-sunnyvale-mid-autumn-festival-2026-10-03',
    title: 'Sunnyvale Mid-Autumn Festival',
    date: '2026-10-03',
    startTime: '10:00',
    endTime: '17:00',
    venue: 'Cityline Sunnyvale',
    address: '345 W McKinley Ave, Sunnyvale, CA 94086',
    city: 'Sunnyvale',
    lat: 37.3789,
    lng: -122.0302,
    ageRange: '0–2, 2–5, 5+',
    ageMin: 0,
    ageMax: 5,
    types: ['Festivals & Community', 'Music & Movement'],
    categoryTags: ['Seasonal', 'Sunnyvale'],
    cost: 'Free',
    description:
      'Downtown Mid-Autumn celebration — pan-Asian food, dance and music stages, and family-friendly cultural activities on Murphy Avenue.',
    tips: 'Free admission; food and crafts are pay-as-you-go. Runs Oct 3–4 — this row is the Saturday kickoff.',
    imageUrl: '',
    eventUrl: 'https://www.sunnyvaledowntown.org/',
    source: 'Calendar Watchlist · Downtown Sunnyvale · Cityline & Murphy Ave',
    watchlistSourceId: 'sunnyvale-downtown',
  },
]

/** Bay Area destination events — Worth a Drive (manual / watchlist; not library scrapers). */
const REGIONAL_DRIVE_ROWS = [
  {
    id: 'regional-lemos-farm-pumpkin-patch-2026-09-05',
    title: 'Lemos Farm Fall Pumpkin Patch',
    date: '2026-09-05',
    startTime: '10:00',
    endTime: '17:00',
    venue: 'Lemos Farm',
    address: '12320 San Mateo Road, Half Moon Bay, CA 94019',
    city: 'Half Moon Bay',
    lat: 37.465,
    lng: -122.428,
    ageRange: 'All ages · Little ones welcome',
    ageMin: 0,
    ageMax: 5,
    types: ['Outdoor', 'Festivals & Community'],
    categoryTags: ['Regional', 'Worth a Drive', 'Hello Fall'],
    cost: 'Paid',
    description:
      'Train rides, hay rides, petting zoo & pony rides — pumpkin patch season opens with farm attractions little ones can ride and explore.',
    tips: 'Season Sep 5–Nov 15. September hours Wed–Sun 10am–5pm (every day in October). Timed tickets on lemosfarm.com — buy ahead; parking included with admission. Pony rides have a 70 lb limit per official ticketing.',
    imageUrl: 'https://www.lemosfarm.com/wp-content/uploads/2021/08/pumpkin-patch-hero.jpg',
    eventUrl: 'https://www.lemosfarm.com/pumpkin-patch',
    source: 'Regional · Worth a Drive · Lemos Farm',
    watchlistSourceId: 'lemos-farm',
  },
  {
    id: 'regional-garin-apple-festival-2026-09-06',
    title: 'Garin Apple Festival',
    date: '2026-09-06',
    startTime: '10:00',
    endTime: '14:00',
    venue: 'Garin Regional Park',
    address: '1580 Garin Avenue, Hayward, CA 94544',
    city: 'Hayward',
    lat: 37.632,
    lng: -122.101,
    ageRange: 'All ages · Little ones welcome',
    ageMin: 0,
    ageMax: 5,
    types: ['Festivals & Community', 'Outdoor'],
    categoryTags: ['Regional', 'Worth a Drive', 'Hello Fall'],
    cost: 'Free',
    description:
      'Historic orchard tours, cider pressing, apple tasting, crafts & lawn games — a hands-on harvest morning in the red barn area.',
    tips: 'Free festival; $5 cash parking (EBRPD). Drop-in — no registration. Red Barn Visitor Center area. Arrive early for parking on a one-day event.',
    imageUrl: 'https://www.ebparks.org/sites/default/files/styles/scale_width_860/public/Garin%20Apple%20Festival%202024.jpg',
    eventUrl: 'https://www.ebparks.org/parks/garin',
    source: 'Regional · Worth a Drive · Garin Apple Festival',
    watchlistSourceId: 'garin-apple-festival',
  },
  {
    id: 'regional-roaring-camp-labor-day-2026-09-05',
    title: 'Labor Day Weekend at Roaring Camp',
    date: '2026-09-05',
    startTime: '08:00',
    endTime: '17:00',
    venue: 'Roaring Camp Railroads',
    address: '5401 Graham Hill Road, Felton, CA 95018',
    city: 'Felton',
    lat: 37.051,
    lng: -122.073,
    ageRange: 'All ages · Little ones welcome',
    ageMin: 0,
    ageMax: 5,
    types: ['Festivals & Community', 'Outdoor'],
    categoryTags: ['Regional', 'Worth a Drive', 'Hello Fall'],
    cost: 'Paid',
    description:
      'Redwood Forest steam train or beach train, plus Town of Roaring Camp — gold panning, blacksmith demos, mini tractors & live music for a Labor Day outing.',
    tips: 'Runs Sep 5–7. Train tickets sold separately on roaringcamp.com — check Labor Day departure times and town hours on the official page.',
    imageUrl: 'https://roaringcamp.com/wp-content/uploads/2019/06/ST2-copy-300x300.jpg',
    eventUrl: 'https://roaringcamp.com/events/labor-day-weekend',
    source: 'Regional · Worth a Drive · Roaring Camp Railroads',
    watchlistSourceId: 'roaring-camp-railroads',
  },
]

function main() {
  const catalogUrls = loadCatalogUrls()
  const existing = loadExistingDiscoveryCandidates()
  const existingIds = new Set(existing.map((row) => row.id))
  const existingUrls = new Set(
    existing.map((row) => row.eventUrl?.replace(/\/$/, '')).filter(Boolean),
  )

  const added = []
  for (const row of [...EXPANSION_ROWS, ...REGIONAL_DRIVE_ROWS]) {
    const normalizedUrl = row.eventUrl?.replace(/\/$/, '')
    if (existingIds.has(row.id)) continue
    // Shared calendar landing pages (e.g. Sunnyvale kids-events) can host many dated rows —
    // only skip URL duplicates when the URL is already queued under a different id AND
    // the incoming row is not a Sunnyvale library special with a unique fragment.
    const hasFragment = Boolean(normalizedUrl && normalizedUrl.includes('#'))
    if (normalizedUrl && existingUrls.has(normalizedUrl) && !hasFragment) continue
    if (!hasFragment && isUrlAlreadyOnPuddles(row.eventUrl, catalogUrls)) continue

    added.push({
      room: '',
      audiences: '',
      isCancelled: false,
      isRecurring: false,
      alreadyOnPuddles: false,
      reviewStatus: 'pending',
      convertedEventId: '',
      lastChecked: new Date().toISOString().slice(0, 10),
      tips: row.tips ?? '',
      imageUrl: row.imageUrl ?? '',
      ...row,
    })
    existingIds.add(row.id)
    if (normalizedUrl) existingUrls.add(normalizedUrl)
  }

  if (added.length === 0) {
    console.log('No new expansion rows to add.')
    return
  }

  const candidates = sortCandidates([...existing, ...added])
  const raw = JSON.parse(readFileSync(DISCOVERY_ADMIN_PATH, 'utf8'))
  const sources = new Set([...(raw.sources ?? []), ...added.map((row) => row.source)])
  const payload = {
    ...raw,
    generatedAt: new Date().toISOString(),
    sources: [...sources].sort(),
    candidates,
  }
  writeFileSync(DISCOVERY_ADMIN_PATH, `${JSON.stringify(payload, null, 2)}\n`)

  console.log(`Added ${added.length} expansion candidate(s):`)
  for (const row of added) {
    console.log(`  ${row.date}  ${row.title}  ·  ${row.city}`)
  }
  console.log(`\nWrote ${DISCOVERY_ADMIN_PATH}`)
}

main()

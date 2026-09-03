#!/usr/bin/env node
/**
 * Backfill empty event imageUrl values from:
 * 1) Class-/event-specific official images (FIT4MOM workouts, Pet a Pony host org)
 * 2) The event-host image registry
 *
 * Rules (see `.cursor/rules/event-images.mdc`):
 * - Never copy another event’s flyer because the venue matches
 * - Only assign a host identity photo when the event has no image of its own
 *
 * Usage: node scripts/backfill-event-images.mjs
 */
import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sheetPath = join(root, 'src/data/sheet-events.json')
const stagingPath = join(root, 'src/data/launch-staging-events.json')

/** Keep in sync with src/data/eventHostImages.ts */
const EVENT_HOST_IMAGES = {
  'Linden Tree Books':
    'https://cdn.shoplightspeed.com/shops/611345/themes/10258/v/1120325/assets/banner-image.png?20260305055717',
  'Sunnyvale Public Library':
    'https://upload.wikimedia.org/wikipedia/commons/8/89/Sunnyvale_Public_Library_%28January_2025%29.jpg',
  'Los Altos Library':
    'https://sccl.bibliocommons.com/events/uploads/images/full/9789d6ae7a5db8da406ba9e1d3837e1e/Early%20Learning%20%26%20Storytime.jpg',
  'Mountain View Public Library':
    'https://d68g328n4ug0e.cloudfront.net/data/feat_img/3989/8800/1738805385.png',
  'Magical Bridge Playground · Fair Oaks Park':
    'https://static.wixstatic.com/media/b287ea_66fff7ceec2e46bf9603d2a4fef94da4~mv2.jpg/v1/fit/w_1548,h_920,q_90/b287ea_66fff7ceec2e46bf9603d2a4fef94da4~mv2.jpg',
  'Magical Bridge Playground':
    'https://static.wixstatic.com/media/b287ea_66fff7ceec2e46bf9603d2a4fef94da4~mv2.jpg/v1/fit/w_1548,h_920,q_90/b287ea_66fff7ceec2e46bf9603d2a4fef94da4~mv2.jpg',
  'Unity Church · Music Together Palo Alto':
    'https://duy554ewuuwzm.cloudfront.net/photos/3/39/DMN_3989/image_vault/190319115534710_1.png',
  'Music Together Palo Alto':
    'https://duy554ewuuwzm.cloudfront.net/photos/3/39/DMN_3989/image_vault/190319115534710_1.png',
  'Downtown Mountain View':
    'https://upload.wikimedia.org/wikipedia/commons/b/b8/Castro_Street_Mountain_View_sidewalk.jpg',
  'Downtown Castro Street':
    'https://upload.wikimedia.org/wikipedia/commons/b/b8/Castro_Street_Mountain_View_sidewalk.jpg',
  'Downtown Los Altos':
    'https://upload.wikimedia.org/wikipedia/commons/2/2f/Los_Altos_Main_Street_2.jpg',
  'Civic Center Plaza':
    'https://upload.wikimedia.org/wikipedia/commons/9/95/City_Hall_of_Mountain_View_-_panoramio_-_Aleh_Haiko_%281%29.jpg',
  'Deer Hollow Farm':
    'https://upload.wikimedia.org/wikipedia/commons/7/73/Meadow_in_Rancho_San_Antonio_County_Park.jpg',
  'Heritage Park':
    'https://upload.wikimedia.org/wikipedia/commons/f/fc/Heritage_Park,_Mountain_View,_California,_Immigrant_House,_June_2019.jpg',
  'Rengstorff Park':
    'https://upload.wikimedia.org/wikipedia/commons/8/87/Rengstorff_House.jpg',
  'Elizabeth F. Gamble Garden':
    'https://www.gamblegarden.org/wp-content/uploads/2018/09/mini-pumpkins-890x890.jpg',
  'Gamble Garden':
    'https://www.gamblegarden.org/wp-content/uploads/2018/09/mini-pumpkins-890x890.jpg',
  'Pioneer Park':
    'https://upload.wikimedia.org/wikipedia/commons/3/31/Pioneer_Memorial_Park%2C_Mountain_View%2C_California%2C_July_2019.jpg',
  'Mountain View Center for the Performing Arts':
    'https://upload.wikimedia.org/wikipedia/commons/4/4d/Mountain_View_Center_for_the_Performing_Art_-_panoramio_-_Aleh_Haiko_%281%29.jpg',
}

const EVENT_HOST_IMAGE_ALIASES = {
  'linden tree books': 'Linden Tree Books',
  'sunnyvale public library': 'Sunnyvale Public Library',
  'los altos library': 'Los Altos Library',
  'mountain view public library': 'Mountain View Public Library',
  'mountain view library': 'Mountain View Public Library',
  'magical bridge playground · fair oaks park': 'Magical Bridge Playground · Fair Oaks Park',
  'magical bridge playground': 'Magical Bridge Playground',
  'magical bridge': 'Magical Bridge Playground',
  'unity church · music together palo alto': 'Unity Church · Music Together Palo Alto',
  'music together palo alto': 'Music Together Palo Alto',
  'unity church': 'Unity Church · Music Together Palo Alto',
  'downtown mountain view': 'Downtown Mountain View',
  'downtown castro street': 'Downtown Castro Street',
  'downtown los altos': 'Downtown Los Altos',
  'civic center plaza': 'Civic Center Plaza',
  'deer hollow farm': 'Deer Hollow Farm',
  'heritage park': 'Heritage Park',
  'rengstorff park': 'Rengstorff Park',
  'elizabeth f. gamble garden': 'Elizabeth F. Gamble Garden',
  'gamble garden': 'Gamble Garden',
  'pioneer park': 'Pioneer Park',
  'mountain view center for the performing arts': 'Mountain View Center for the Performing Arts',
}

/** Official FIT4MOM Silicon Valley class photos from sunnyvale.fit4mom.com/our-workouts */
const FIT4MOM_CLASS_IMAGES = {
  'stroller strides':
    'https://static.spacecrafted.com/dbfd6ca9d440403f89a29bb6ef274b92/i/b1d4bba1caf446edaff553933886ce3a/1/4SoifmQpDrHbZJ6VybMjS/FIT4MOM%20Stroller%20Strides%20stroller%20workout%20for%20moms.jpg',
  'stroller barre':
    'https://static.spacecrafted.com/dbfd6ca9d440403f89a29bb6ef274b92/i/dc6450fd530c46908f3e38abeba487e1/1/4SoifmQpDrHbZJ6VybMjS/strollerbarre.jpeg',
  'family strides':
    'https://static.spacecrafted.com/dbfd6ca9d440403f89a29bb6ef274b92/i/a253ff95ba7a49cd8adb94b7da4c66e5/1/4SoifmQpDrHbZJ6VybMjS/strides360.jpeg',
  'strides 360':
    'https://static.spacecrafted.com/dbfd6ca9d440403f89a29bb6ef274b92/i/a253ff95ba7a49cd8adb94b7da4c66e5/1/4SoifmQpDrHbZJ6VybMjS/strides360.jpeg',
  'mommy & baby yoga':
    'https://static.spacecrafted.com/dbfd6ca9d440403f89a29bb6ef274b92/i/ee462d0ca5bc4fe88d0d4863fceebe05/1/4SoifmQpDrHbZJ6W5XJrp/3V7A8901.jpg',
  'fourth trimester':
    'https://static.spacecrafted.com/dbfd6ca9d440403f89a29bb6ef274b92/i/e2defeaaf73f43e48de87d5adc0992f4/1/4SoifmQpDrHbZJ6W5XJrp/what-to-expect-in-class.jpg',
}

/** Event-specific images when no flyer but host org has a program photo */
const EVENT_SPECIFIC_IMAGES = [
  {
    match: /pet a pony|pet the pony/i,
    imageUrl: 'https://lahha.org/wp-content/uploads/2018/02/lahhapony.png',
    label: 'LAHHA Pet a Pony',
  },
]

function isMissing(url) {
  const trimmed = String(url ?? '').trim()
  return !trimmed || trimmed === '#'
}

function getHostImage(venue) {
  const trimmed = String(venue ?? '').trim()
  if (!trimmed) return null
  if (EVENT_HOST_IMAGES[trimmed]) return EVENT_HOST_IMAGES[trimmed]
  const canonical = EVENT_HOST_IMAGE_ALIASES[trimmed.toLowerCase()]
  return canonical ? EVENT_HOST_IMAGES[canonical] ?? null : null
}

function getFit4MomClassImage(title) {
  const lower = String(title ?? '').toLowerCase()
  if (!lower.includes('fit4mom')) return null
  for (const [key, url] of Object.entries(FIT4MOM_CLASS_IMAGES)) {
    if (lower.includes(key)) return url
  }
  return null
}

function resolveImage(event) {
  const specific = EVENT_SPECIFIC_IMAGES.find((row) => row.match.test(event.title || ''))
  if (specific) return { url: specific.imageUrl, source: specific.label }
  const fit4 = getFit4MomClassImage(event.title)
  if (fit4) return { url: fit4, source: 'FIT4MOM class' }
  const host = getHostImage(event.venue)
  if (host) return { url: host, source: `host:${event.venue}` }
  return null
}

function backfillFile(path, label) {
  const events = JSON.parse(readFileSync(path, 'utf8'))
  let updated = 0
  for (const event of events) {
    const fit4 = getFit4MomClassImage(event.title)
    // Prefer official class photos for FIT4MOM even when an older generic image exists.
    if (fit4 && String(event.imageUrl || '').trim() !== fit4) {
      event.imageUrl = fit4
      updated += 1
      console.log(`~ [${label}] ${event.title} ← FIT4MOM class`)
      continue
    }
    if (!isMissing(event.imageUrl)) continue
    const resolved = resolveImage(event)
    if (!resolved) continue
    event.imageUrl = resolved.url
    updated += 1
    console.log(`+ [${label}] ${event.title} ← ${resolved.source}`)
  }
  writeFileSync(path, `${JSON.stringify(events, null, 2)}\n`)
  console.log(`[${label}] Updated ${updated} events`)
  return updated
}

const total =
  backfillFile(sheetPath, 'sheet') + backfillFile(stagingPath, 'staging')
console.log(`Done. ${total} total updates.`)

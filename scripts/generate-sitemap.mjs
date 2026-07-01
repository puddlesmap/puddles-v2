import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { isPublicEvent } from './publishing.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const eventsPath = join(rootDir, 'src/data/sheet-events.json')
const outputPath = join(rootDir, 'public/sitemap.xml')
const siteUrl = 'https://puddlesmap.com'

const STATIC_PATHS = [
  '/',
  '/browse',
  '/map',
  '/share',
  '/about',
  '/palo-alto',
  '/los-altos',
  '/mountain-view',
]

function parseAgeBuckets(raw) {
  const text = String(raw ?? '').trim()
  const buckets = new Set()

  if (!text) return buckets

  if (/all\s*ages?/i.test(text)) {
    return new Set(['0-2', '2-5', '5+'])
  }

  for (const part of text.split(/[,;]/)) {
    const normalized = part.trim().toLowerCase().replace(/\s+/g, '')
    if (normalized === '0-2' || normalized === '0–2') buckets.add('0-2')
    if (normalized === '2-5' || normalized === '2–5') buckets.add('2-5')
    if (normalized === '5+') buckets.add('5+')
  }

  return buckets
}

function isPublicAgeEligible(ageRange) {
  const buckets = parseAgeBuckets(ageRange)
  if (buckets.size === 0) return true
  if (buckets.has('0-2') && buckets.has('2-5') && buckets.has('5+')) return true
  return buckets.has('0-2') || buckets.has('2-5')
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

const events = JSON.parse(readFileSync(eventsPath, 'utf8'))
const publicEvents = events.filter((event) => isPublicEvent(event) && isPublicAgeEligible(event.ageRange))

const urls = [
  ...STATIC_PATHS.map((path) => `${siteUrl}${path === '/' ? '' : path}`),
  ...publicEvents.map((event) => `${siteUrl}/event/${event.id}`),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (loc) => `  <url>
    <loc>${escapeXml(loc)}</loc>
  </url>`,
  )
  .join('\n')}
</urlset>
`

writeFileSync(outputPath, xml)
console.log(`Wrote ${urls.length} URLs to public/sitemap.xml (${publicEvents.length} events)`)

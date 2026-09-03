#!/usr/bin/env node
/**
 * Upsert launch-staging-events.json into sheet-events.json for Admin / go-live.
 *
 * Usage: node scripts/merge-launch-staging-into-sheet.mjs [--draft]
 * Default: new rows → Draft; existing rows → update copy, keep status.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolvePublishingFields } from './publishing.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const SHEET_PATH = join(root, 'src/data/sheet-events.json')
const STAGING_PATH = join(root, 'src/data/launch-staging-events.json')
const META_PATH = join(root, 'src/data/sync-meta.json')

const forceDraft = process.argv.includes('--draft')

function normalizeUrl(url) {
  return String(url || '')
    .trim()
    .replace(/\/$/, '')
    .toLowerCase()
}

function findIndex(events, incoming) {
  if (!incoming.id) return -1
  return events.findIndex((event) => event.id === incoming.id)
}

function enrich(event) {
  const status = event.status || 'Draft'
  const { isPast, isLive } = resolvePublishingFields({
    statusRaw: status,
    approvedRaw: status === 'Published',
    isPastRaw: null,
    isLiveRaw: null,
    date: event.date,
    endTime: event.endTime || event.startTime,
  })
  return { ...event, status, isPast, isLive }
}

function main() {
  const catalog = JSON.parse(readFileSync(SHEET_PATH, 'utf8'))
  const staging = JSON.parse(readFileSync(STAGING_PATH, 'utf8'))

  let inserted = 0
  let updated = 0

  for (const row of staging) {
    const incoming = enrich({
      ...row,
      status: forceDraft ? 'Draft' : row.status || 'Draft',
    })
    const index = findIndex(catalog, incoming)

    if (index >= 0) {
      const existing = catalog[index]
      catalog[index] = enrich({
        ...existing,
        ...incoming,
        id: existing.id,
        status: forceDraft ? 'Draft' : existing.status || incoming.status,
      })
      updated += 1
    } else {
      catalog.push(
        enrich({
          ...incoming,
          status: 'Draft',
        }),
      )
      inserted += 1
    }
  }

  catalog.sort(
    (a, b) =>
      String(a.date).localeCompare(String(b.date)) ||
      String(a.startTime).localeCompare(String(b.startTime)) ||
      String(a.title).localeCompare(String(b.title)),
  )

  writeFileSync(SHEET_PATH, `${JSON.stringify(catalog, null, 2)}\n`)

  const liveCount = catalog.filter((event) => event.isLive).length
  let meta = {}
  try {
    meta = JSON.parse(readFileSync(META_PATH, 'utf8'))
  } catch {
    // ignore
  }
  writeFileSync(
    META_PATH,
    `${JSON.stringify(
      {
        ...meta,
        syncedAt: new Date().toISOString(),
        eventCount: catalog.length,
        liveCount,
      },
      null,
      2,
    )}\n`,
  )

  console.log(`Merged launch staging → sheet-events.json`)
  console.log(`  inserted: ${inserted}`)
  console.log(`  updated:  ${updated}`)
  console.log(`  total:    ${catalog.length} (${liveCount} live)`)
}

main()

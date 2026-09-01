#!/usr/bin/env node
/**
 * Apply discovery review decisions to discovery-candidates.json.
 *
 * Usage: node scripts/bulk-apply-discovery-review.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DISCOVERY_ADMIN_PATH,
  isLibraryClosureNotice,
} from './discovery-shared.mjs'
import { isOutsidePuddlesAgeScope } from './age-hints.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const VERIFIED_DATE = '2026-09-01'

/** Weekly queue dupes — staging already has series rows. */
const DISMISS_IDS = new Set([
  'watchlist-fit4mom-stroller-strides-cuesta-2026-08-31',
  'watchlist-fit4mom-stroller-strides-laspalmas-2026-09-01',
  'watchlist-fit4mom-mommy-baby-yoga-laspalmas-2026-09-01',
  'watchlist-fit4mom-stroller-barre-cuesta-2026-09-02',
  'watchlist-fit4mom-fourth-trimester-cuesta-2026-09-02',
  'watchlist-fit4mom-stroller-barre-mitchell-2026-09-03',
  'watchlist-fit4mom-stroller-strides-cuesta-2026-09-04',
  'watchlist-fit4mom-family-strides-cuesta-2026-09-05',
  'watchlist-marti-parent-baby-2026-08-29',
  'watchlist-marti-parent-baby-2026-09-05',
  'watchlist-marti-parent-baby-2026-09-12',
  'watchlist-marti-parent-baby-2026-09-19',
  'watchlist-marti-parent-baby-2026-09-26',
  'watchlist-pyt-creepy-carrots-2026-10-10-b',
  'watchlist-gamble-parent-me-yoga-2026-09-19',
  '17231477',
  '6a7fa752d4b10d003006934b',
  '6a57fc45cca66c2f00a3ae1f',
  '6a57fc950d65ac36003ff829',
  '6a57fcfe0d65ac36003ff83e',
  '6a57faf688e9bf28003121f6',
  '6a57fcc8cca66c2f00a3ae6d',
  'watchlist-linden-2026-08-09',
  'watchlist-linden-2026-08-16',
  'watchlist-linden-2026-08-23',
  'watchlist-linden-2026-08-30',
])

function isExpired(candidate) {
  const date = String(candidate.date || '').trim()
  if (!date || date >= VERIFIED_DATE) return false
  return true
}

function main() {
  const catalog = JSON.parse(readFileSync(DISCOVERY_ADMIN_PATH, 'utf8'))
  let approved = 0
  let dismissed = 0
  let skipped = 0

  for (const candidate of catalog.candidates) {
    if (candidate.reviewStatus !== 'pending') {
      skipped += 1
      continue
    }

    if (DISMISS_IDS.has(candidate.id)) {
      candidate.reviewStatus = 'dismissed'
      dismissed += 1
      continue
    }

    if (isLibraryClosureNotice(candidate)) {
      candidate.reviewStatus = 'dismissed'
      dismissed += 1
      continue
    }

    if (isOutsidePuddlesAgeScope(candidate)) {
      candidate.reviewStatus = 'dismissed'
      dismissed += 1
      continue
    }

    if (isExpired(candidate)) {
      candidate.reviewStatus = 'dismissed'
      dismissed += 1
      continue
    }

    candidate.reviewStatus = 'approved'
    candidate.lastChecked = VERIFIED_DATE
    approved += 1
  }

  writeFileSync(DISCOVERY_ADMIN_PATH, `${JSON.stringify(catalog, null, 2)}\n`)

  console.log(`Discovery review applied (${VERIFIED_DATE})`)
  console.log(`  approved:  ${approved}`)
  console.log(`  dismissed: ${dismissed}`)
  console.log(`  skipped:   ${skipped} (already reviewed)`)
}

main()

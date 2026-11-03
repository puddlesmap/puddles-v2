#!/usr/bin/env node
/**
 * Single weekly discovery pass: libraries + Linden + core inbox + regional + merge.
 *
 * Usage: node scripts/discover-wednesday.mjs [--days=90]
 *
 * Human/agent step (same week, before or after): fill core-cities-weekend-inbox.json
 * and regional-leads-inbox.json from watchlist + roundups + social, then re-run ingest
 * or run this script again locally.
 */
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function parseDays() {
  const hit = process.argv.find((arg) => arg.startsWith('--days='))
  return hit ? Number(hit.slice('--days='.length)) : 90
}

function run(label, command, args = []) {
  console.log('')
  console.log(`=== ${label} ===`)
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: false })
  if (result.status !== 0) {
    throw new Error(`${label} failed (exit ${result.status ?? 'unknown'})`)
  }
}

function main() {
  const days = parseDays()
  const node = process.execPath

  console.log(`Puddles weekly discovery — ${days}-day horizon`)

  run('Library calendars (PA + Los Altos + MV)', node, [
    join(__dirname, 'discover-bay-area.mjs'),
    `--days=${days}`,
  ])
  run('Linden Tree Books', node, [join(__dirname, 'discover-linden-tree.mjs'), `--days=${days}`])
  run('Core cities weekend inbox', node, [join(__dirname, 'discover-core-weekend.mjs')])
  run('Regional Worth a Drive inbox', node, [join(__dirname, 'discover-regional-weekly.mjs')])
  run('Expansion lookahead', node, [
    join(__dirname, 'discover-expansion-lookahead.mjs'),
    `--days=${days}`,
  ])
  run('Merge Discovery Inbox', node, [join(__dirname, 'merge-discovery-candidates-into-inbox.mjs')])

  run('Record cadence (full weekly pass)', node, [
    join(__dirname, 'plan-discovery-window.mjs'),
    '--commit',
    '--full',
    `--days=${days}`,
  ])

  run('Verify published listings', node, [join(__dirname, 'verify-event-freshness.mjs')])
  run('Weekly discovery summary', node, [join(__dirname, 'write-weekly-discovery-summary.mjs')])

  console.log('')
  console.log('Weekly discovery ingest finished. Review Admin → Discovery; Approve → Publish.')
}

main()

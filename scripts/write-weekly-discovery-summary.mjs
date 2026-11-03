#!/usr/bin/env node
/**
 * Write data/discovery/weekly-summary.md from the latest verification run,
 * cadence record, and scrape meta.
 *
 * Usage: node scripts/write-weekly-discovery-summary.mjs [--today=YYYY-MM-DD]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pacificTodayYmd } from '../src/utils/discoveryInboxCore.mjs'
import { summarizeDiscoveryRun } from '../src/utils/discoveryRunStats.mjs'
import { buildWeeklySummary } from '../src/utils/weeklyDiscoverySummary.mjs'

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')

function argValue(name) {
  const prefix = `--${name}=`
  const hit = process.argv.find((arg) => arg.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : ''
}

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return fallback
  }
}

function main() {
  const today = argValue('today') || pacificTodayYmd()
  const blocked = []
  const verificationRun = readJson(join(rootDir, 'data/verification/latest-run.json'), null)
  const cadence = readJson(join(rootDir, 'data/discovery/cadence-state.json'), null)
  const catalog = readJson(join(rootDir, 'src/data/discovery-candidates.json'), null)
  const events = readJson(join(rootDir, 'src/data/sheet-events.json'), null)
  const meta = readJson(join(rootDir, 'data/discovery/latest-scrape-meta.json'), null)

  if (!verificationRun || verificationRun.today !== today) {
    blocked.push('Event verification did not record a run for this date.')
  }
  if (!cadence?.lastRun || cadence.lastRun.date !== today) {
    blocked.push('Discovery cadence was not recorded for this date.')
  }

  let discovery = null
  if (catalog && events && meta?.date === today) {
    discovery = summarizeDiscoveryRun({
      candidates: catalog.candidates || [],
      events,
      today,
      scrapedIds: Object.keys(meta.ids || {}),
    })
  } else if (!meta || meta.date !== today) {
    blocked.push('No library or Linden Tree scrape was recorded for this date.')
  }

  const summary = buildWeeklySummary({
    today,
    maintenance: verificationRun?.report || {},
    cadence: cadence?.lastRun?.date === today ? cadence.lastRun : { days: 'not recorded', scanned: [], skipped: [], full: false },
    discovery,
    blocked,
  })

  const path = join(rootDir, 'data/discovery/weekly-summary.md')
  writeFileSync(path, summary)
  console.log(summary)
}

main()

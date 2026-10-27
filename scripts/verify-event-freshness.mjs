#!/usr/bin/env node
/**
 * Verify published listings that are due. Writes internal freshness state.
 * Does not publish new events and does not delete listings.
 *
 * Usage: node scripts/verify-event-freshness.mjs [--dry-run] [--today=YYYY-MM-DD]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pacificTodayYmd } from '../src/utils/discoveryInboxCore.mjs'
import { runVerification } from '../src/utils/verificationMaintenance.mjs'

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
  const dryRun = process.argv.includes('--dry-run')
  const events = readJson(join(rootDir, 'src/data/sheet-events.json'), [])
  const catalog = readJson(join(rootDir, 'src/data/discovery-candidates.json'), { candidates: [] })
  const state = readJson(join(rootDir, 'src/data/verification-state.json'), { version: 1, events: {} })
  const config = readJson(join(rootDir, 'data/verification/config.json'), {})
  const meta = readJson(join(rootDir, 'data/discovery/latest-scrape-meta.json'), null)
  const freshOn = meta?.date || ''
  const freshIds = freshOn ? Object.keys(meta.ids || {}) : []

  const { state: next, report } = runVerification({
    events,
    candidates: catalog.candidates || [],
    state,
    today,
    catalogGeneratedAt: catalog.generatedAt || '',
    freshIds,
    freshOn,
    config,
  })

  const run = {
    today,
    sourceCatalogGeneratedAt: catalog.generatedAt || '',
    freshReadings: freshIds.length,
    report,
  }

  if (!dryRun) {
    writeFileSync(join(rootDir, 'src/data/verification-state.json'), `${JSON.stringify(next, null, 2)}\n`)
    writeFileSync(join(rootDir, 'data/verification/latest-run.json'), `${JSON.stringify(run, null, 2)}\n`)
  }

  console.log(JSON.stringify({ today, dryRun, ...report, attention: report.attention.length, updates: report.updates.length }, null, 2))
}

main()

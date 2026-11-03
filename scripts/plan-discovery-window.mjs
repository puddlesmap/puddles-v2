#!/usr/bin/env node
/**
 * Decide which discovery prefix is due, or record a finished run.
 *
 *   node scripts/plan-discovery-window.mjs --print [--full] [--today=YYYY-MM-DD]
 *   node scripts/plan-discovery-window.mjs --commit [--full] [--today=YYYY-MM-DD]
 *   node scripts/plan-discovery-window.mjs --commit --days=30 --scanned=0-30 --skipped=31-60,61-90
 */
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pacificTodayYmd } from '../src/utils/discoveryInboxCore.mjs'
import { commitDiscoveryRun, selectDiscoveryHorizon } from '../src/utils/discoveryCadence.mjs'

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const configPath = join(rootDir, 'data/discovery/cadence-config.json')
const statePath = join(rootDir, 'data/discovery/cadence-state.json')

function argValue(name) {
  const prefix = `--${name}=`
  const hit = process.argv.find((arg) => arg.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : ''
}

function listArg(name) {
  return argValue(name)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return fallback
  }
}

function emit(plan) {
  const lines = [
    `days=${plan.days}`,
    `scanned=${(plan.scanned || []).join(',')}`,
    `skipped=${(plan.skipped || []).join(',')}`,
    `full=${plan.full ? 'true' : 'false'}`,
  ]
  for (const line of lines) console.log(line)
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`)
}

function main() {
  const today = argValue('today') || pacificTodayYmd()
  const full = process.argv.includes('--full')
  const config = readJson(configPath, { maxHorizonDays: 90, windows: [] })
  const state = readJson(statePath, { windows: {}, lastRun: null })
  const planned = selectDiscoveryHorizon({ today, state, config, full })
  const commit = process.argv.includes('--commit')

  if (!commit) {
    emit(planned)
    return
  }

  const scanned = listArg('scanned')
  const skipped = listArg('skipped')
  const daysArg = argValue('days')
  const days = daysArg ? Number(daysArg) : planned.days
  const scannedIds = scanned.length > 0 ? scanned : planned.scanned
  const coversHorizon = scannedIds.length > 0 && scannedIds.length === (config.windows || []).length && days >= (config.maxHorizonDays || 90)
  const plan = {
    today,
    full: full || coversHorizon,
    days,
    scanned: scannedIds,
    skipped: process.argv.some((arg) => arg.startsWith('--skipped=')) ? skipped : planned.skipped,
  }
  const next = commitDiscoveryRun(state, plan)
  writeFileSync(statePath, `${JSON.stringify(next, null, 2)}\n`)
  emit(plan)
}

main()

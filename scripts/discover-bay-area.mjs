#!/usr/bin/env node
/**
 * Phase 2 discovery: Palo Alto + Los Altos + Mountain View library calendars
 * for the next N days into one Admin queue.
 *
 * Usage: node scripts/discover-bay-area.mjs [--days=30]
 */
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { discoverLosAltos } from './discover-los-altos.mjs'
import { discoverMountainView } from './discover-mountain-view.mjs'
import {
  parseArgs,
  pacificTodayYmd,
  rootDir,
  sortCandidates,
} from './discovery-shared.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SOURCES = [
  'Palo Alto Library · BiblioCommons',
  'SCCL · Los Altos',
  'Mountain View Library · LibCal',
]

function runPaloAlto(days) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [join(__dirname, 'discover-palo-alto.mjs'), `--days=${days}`, '--skip-admin'],
      { cwd: rootDir, stdio: 'inherit' },
    )
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`discover-palo-alto exited with ${code}`))
    })
  })
}

function loadCityPayload(fileStem, startYmd) {
  const path = join(rootDir, 'data/discovery', `${fileStem}-${startYmd}.json`)
  return JSON.parse(readFileSync(path, 'utf8'))
}

async function main() {
  const { days } = parseArgs(process.argv.slice(2), { days: 30 })
  const startYmd = pacificTodayYmd()

  console.log(`Bay Area discovery (${days} days) — Palo Alto, Los Altos, Mountain View`)
  console.log('')

  await runPaloAlto(days)
  const la = await discoverLosAltos({ days, writeAdmin: false })
  const mv = await discoverMountainView({ days, writeAdmin: false })
  const pa = loadCityPayload('palo-alto', startYmd)

  const candidates = sortCandidates([
    ...(pa.candidates || []),
    ...(la.candidates || []),
    ...(mv.candidates || []),
  ]).map((c) => ({
    ...c,
    reviewStatus: 'pending',
    convertedEventId: '',
    lastChecked: '',
  }))

  const already = candidates.filter((c) => c.alreadyOnPuddles)
  const newOnly = candidates.filter((c) => !c.alreadyOnPuddles)

  const adminPayload = {
    generatedAt: new Date().toISOString(),
    libraries: ['paloalto', 'sccl', 'mountainview-libcal'],
    sources: SOURCES,
    window: { start: startYmd, end: pa.window?.end || la.window?.end, days },
    stats: {
      candidates: candidates.length,
      alreadyOnPuddles: already.length,
      newForReview: newOnly.length,
      bySource: Object.fromEntries(
        SOURCES.map((source) => [source, candidates.filter((c) => c.source === source).length]),
      ),
      cities: {
        paloAlto: pa.stats || {},
        losAltos: la.stats || {},
        mountainView: mv.stats || {},
      },
    },
    candidates,
  }

  const adminPath = join(rootDir, 'src/data/discovery-candidates.json')
  writeFileSync(adminPath, `${JSON.stringify(adminPayload, null, 2)}\n`)

  const combinedPath = join(rootDir, 'data/discovery', `bay-area-${startYmd}.json`)
  writeFileSync(combinedPath, JSON.stringify(adminPayload, null, 2))

  console.log('')
  console.log('Bay Area combined')
  console.log(`  Candidates:          ${candidates.length}`)
  console.log(`  Already on Puddles:  ${already.length}`)
  console.log(`  New for review:      ${newOnly.length}`)
  for (const source of SOURCES) {
    const rows = candidates.filter((c) => c.source === source)
    const neu = rows.filter((c) => !c.alreadyOnPuddles).length
    console.log(`  · ${source}: ${rows.length} (${neu} new)`)
  }
  console.log('')
  console.log('Wrote')
  console.log(`  ${combinedPath}`)
  console.log(`  ${adminPath}`)
  if (newOnly.length) {
    console.log('')
    console.log('New for review:')
    for (const row of newOnly.slice(0, 40)) {
      console.log(`  ${row.date} ${row.startTime}  ${row.title}  ·  ${row.city} · ${row.source}`)
    }
    if (newOnly.length > 40) console.log(`  … +${newOnly.length - 40} more`)
  }
  console.log('')
  console.log('Review in Admin → Discovery (/admin/discovery)')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

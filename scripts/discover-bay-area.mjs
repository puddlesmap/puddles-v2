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
  loadExistingDiscoveryCandidates,
  mergeDiscoveryCandidatesPreservingReview,
  parseArgs,
  pacificTodayYmd,
  rootDir,
  sortCandidates,
  summarizeDiscoveryCandidateStats,
  DISCOVERY_ADMIN_PATH,
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

  const scraped = sortCandidates([
    ...(pa.candidates || []),
    ...(la.candidates || []),
    ...(mv.candidates || []),
  ])

  const existing = loadExistingDiscoveryCandidates()
  const librarySources = new Set(SOURCES)
  const scrapedMerged = mergeDiscoveryCandidatesPreservingReview(
    scraped,
    existing.filter((row) => librarySources.has(row.source)),
  )
  const preservedOther = existing.filter((row) => !librarySources.has(row.source))
  const candidates = sortCandidates([...scrapedMerged, ...preservedOther])

  const already = candidates.filter((c) => c.alreadyOnPuddles)
  const newOnly = candidates.filter((c) => !c.alreadyOnPuddles)
  const preservedReview = scrapedMerged.filter((scrapedRow) => {
    const prev = existing.find(
      (row) =>
        row.id === scrapedRow.id ||
        row.eventUrl?.replace(/\/$/, '') === scrapedRow.eventUrl?.replace(/\/$/, ''),
    )
    return prev && prev.reviewStatus !== 'pending' && prev.reviewStatus === scrapedRow.reviewStatus
  }).length
  const preservedNonLibrary = preservedOther.length

  const adminPayload = {
    generatedAt: new Date().toISOString(),
    libraries: ['paloalto', 'sccl', 'mountainview-libcal'],
    sources: [...SOURCES, ...[...new Set(preservedOther.map((c) => c.source))].sort()],
    window: { start: startYmd, end: pa.window?.end || la.window?.end, days },
    stats: {
      ...summarizeDiscoveryCandidateStats(candidates),
      preservedReview,
      preservedNonLibrary,
      bySource: Object.fromEntries(
        [...new Set(candidates.map((c) => c.source))].map((source) => [
          source,
          candidates.filter((c) => c.source === source).length,
        ]),
      ),
      cities: {
        paloAlto: pa.stats || {},
        losAltos: la.stats || {},
        mountainView: mv.stats || {},
      },
    },
    candidates,
  }

  const adminPath = DISCOVERY_ADMIN_PATH
  writeFileSync(adminPath, `${JSON.stringify(adminPayload, null, 2)}\n`)

  const combinedPath = join(rootDir, 'data/discovery', `bay-area-${startYmd}.json`)
  writeFileSync(combinedPath, JSON.stringify(adminPayload, null, 2))

  console.log('')
  console.log('Bay Area combined')
  console.log(`  Candidates:          ${candidates.length}`)
  console.log(`  Already on Puddles:  ${already.length}`)
  console.log(`  New for review:      ${newOnly.length}`)
  if (preservedReview > 0) {
    console.log(`  Preserved review:    ${preservedReview} (approved/dismissed/live)`)
  }
  if (preservedNonLibrary > 0) {
    console.log(`  Preserved watchlist: ${preservedNonLibrary} (Calendar Watchlist / other)`)
  }
  for (const source of [...new Set(candidates.map((c) => c.source))]) {
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

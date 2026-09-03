#!/usr/bin/env node
/**
 * Expansion discovery lookahead — 2–3 month window for launch city (Sunnyvale)
 * and launch activity types (Parent & Me, Festivals & Community).
 *
 * Reads the Admin discovery queue + live catalog + calendar watchlist.
 * Optionally refreshes library scrapers first.
 *
 * Usage:
 *   node scripts/discover-expansion-lookahead.mjs [--days=90]
 *   node scripts/discover-expansion-lookahead.mjs --days=90 --run-scrape
 */
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  addDaysYmd,
  parseArgs,
  pacificTodayYmd,
  rootDir,
} from './discovery-shared.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

const LAUNCH_CITY = 'Sunnyvale'
const LAUNCH_TYPES = ['Parent & Me', 'Festivals & Community']
const CORE_CITIES = new Set(['Palo Alto', 'Los Altos', 'Mountain View'])
const LIBRARY_SOURCES = new Set([
  'Palo Alto Library · BiblioCommons',
  'SCCL · Los Altos',
  'Mountain View Library · LibCal',
])

function parseLookaheadArgs(argv) {
  const base = parseArgs(argv, { days: 90 })
  let runScrape = false
  for (const arg of argv) {
    if (arg === '--run-scrape') runScrape = true
  }
  return { ...base, runScrape }
}

function runBayAreaScrape(days) {
  return new Promise((resolve, reject) => {
    console.log(`Running library scrape (${days} days)…`)
    const child = spawn(
      process.execPath,
      [join(__dirname, 'discover-bay-area.mjs'), `--days=${days}`],
      { cwd: rootDir, stdio: 'inherit' },
    )
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`discover-bay-area exited with ${code}`))
    })
  })
}

function loadJson(path) {
  return JSON.parse(readFileSync(join(rootDir, path), 'utf8'))
}

function hasType(candidate, type) {
  return candidate.types?.includes(type) ?? false
}

function hasParentAndMe(candidate) {
  if (hasType(candidate, 'Parent & Me')) return true
  return candidate.categoryTags?.some((tag) => tag.includes('Parent & Me')) ?? false
}

function inDateWindow(dateYmd, startYmd, endYmd) {
  return dateYmd >= startYmd && dateYmd <= endYmd
}

function countBy(values) {
  return values.reduce((acc, value) => {
    if (!value) return acc
    acc[value] = (acc[value] ?? 0) + 1
    return acc
  }, {})
}

function sortRows(rows) {
  return [...rows].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      String(a.startTime ?? '').localeCompare(String(b.startTime ?? '')) ||
      a.title.localeCompare(b.title),
  )
}

function formatTableRow(cols) {
  return `| ${cols.join(' | ')} |`
}

function buildMarkdownReport({
  startYmd,
  endYmd,
  days,
  discovery,
  sheetEvents,
  watchlist,
  expansion,
}) {
  const lines = [
    '# Expansion discovery lookahead',
    '',
    `Window: **${startYmd} → ${endYmd}** (${days} days)`,
    '',
    `Generated ${new Date().toISOString()}`,
    '',
    '## Launch expansion targets',
    '',
    '| Target | In window (discovery queue) | Pending review | On live catalog |',
    '|--------|----------------------------|----------------|-----------------|',
    `| **${LAUNCH_CITY}** (new city) | ${expansion.sunnyvale.inWindow} | ${expansion.sunnyvale.pending} | ${expansion.sunnyvale.onCatalog} |`,
    `| **Parent & Me** (new type) | ${expansion.parentAndMe.inWindow} | ${expansion.parentAndMe.pending} | ${expansion.parentAndMe.onCatalog} |`,
    `| **Festivals & Community** (new type) | ${expansion.festivals.inWindow} | ${expansion.festivals.pending} | ${expansion.festivals.onCatalog} |`,
    '',
    '## By city (discovery queue, in window)',
    '',
    '| City | Total | New for review |',
    '|------|-------|----------------|',
    ...expansion.byCity.map(([city, stats]) =>
      formatTableRow([city, String(stats.total), String(stats.pending)]),
    ),
    '',
    '## By activity type (discovery queue, in window)',
    '',
    '| Type | Count |',
    '|------|-------|',
    ...expansion.byType.map(([type, count]) => formatTableRow([type, String(count)])),
    '',
    '## Sunnyvale — pending review',
    '',
  ]

  if (expansion.sunnyvalePendingRows.length === 0) {
    lines.push('_No Sunnyvale rows in window — check watchlist (Mini Yoga, FIT4MOM) and library seeds._')
  } else {
    lines.push('| Date | Event | Source | Status |')
    lines.push('|------|-------|--------|--------|')
    for (const row of expansion.sunnyvalePendingRows) {
      lines.push(
        formatTableRow([
          row.date,
          row.title.replace(/\|/g, '\\|'),
          row.source.replace(/\|/g, '\\|'),
          row.reviewStatus,
        ]),
      )
    }
  }

  lines.push('', '## Parent & Me — pending review (in window)', '')
  if (expansion.parentAndMePendingRows.length === 0) {
    lines.push('_None — re-check FIT4MOM schedule, Marti Foster, Music Together, yoga studios._')
  } else {
    lines.push('| Date | City | Event | Source |')
    lines.push('|------|------|-------|--------|')
    for (const row of expansion.parentAndMePendingRows.slice(0, 40)) {
      lines.push(
        formatTableRow([
          row.date,
          row.city,
          row.title.replace(/\|/g, '\\|'),
          row.source.replace(/\|/g, '\\|'),
        ]),
      )
    }
    if (expansion.parentAndMePendingRows.length > 40) {
      lines.push('', `> … +${expansion.parentAndMePendingRows.length - 40} more in queue`)
    }
  }

  lines.push('', '## Festivals & Community — pending review (in window)', '')
  if (expansion.festivalsPendingRows.length === 0) {
    lines.push('_None — check city special events, harvest/Halloween fairs, open houses._')
  } else {
    lines.push('| Date | City | Event | Source |')
    lines.push('|------|------|-------|--------|')
    for (const row of expansion.festivalsPendingRows) {
      lines.push(
        formatTableRow([
          row.date,
          row.city,
          row.title.replace(/\|/g, '\\|'),
          row.source.replace(/\|/g, '\\|'),
        ]),
      )
    }
  }

  lines.push('', '## Calendar watchlist — manual checks', '')
  lines.push('| Source | City | Cadence | Fit | On Puddles? |')
  lines.push('|--------|------|---------|-----|-------------|')
  for (const source of watchlist.sources) {
    lines.push(
      formatTableRow([
        source.name,
        source.city,
        source.checkCadence ?? '—',
        source.fitFor0to5 ?? '—',
        source.alreadyOnPuddles ? 'Yes' : 'No',
      ]),
    )
  }

  lines.push('', '## Gaps & next actions', '')
  for (const action of expansion.actions) {
    lines.push(`- ${action}`)
  }

  lines.push(
    '',
    '## Ops',
    '',
    '- Review queue: `/admin/discovery`',
    '- Launch review: `/experiment/seasonal-launch-review`',
    '- Refresh libraries: `npm run discover:bay-area -- --days=90`',
    '- Regenerate this report: `npm run discover:expansion-lookahead`',
    '',
  )

  return `${lines.join('\n')}\n`
}

function analyzeExpansion({ candidates, sheetEvents, startYmd, endYmd }) {
  const inWindow = candidates.filter((row) => inDateWindow(row.date, startYmd, endYmd))
  const pending = (row) => !row.alreadyOnPuddles && row.reviewStatus === 'pending'

  const sunnyvaleRows = inWindow.filter((row) => row.city === LAUNCH_CITY)
  const parentAndMeRows = inWindow.filter(hasParentAndMe)
  const festivalRows = inWindow.filter((row) => hasType(row, 'Festivals & Community'))

  const catalogInWindow = sheetEvents.filter(
    (event) =>
      event.isLive &&
      inDateWindow(event.date, startYmd, endYmd) &&
      !event.isPast,
  )

  const byCityMap = countBy(inWindow.map((row) => row.city))
  const byCity = Object.entries(byCityMap)
    .map(([city, total]) => [
      city,
      {
        total,
        pending: inWindow.filter((row) => row.city === city && pending(row)).length,
      },
    ])
    .sort((a, b) => b[1].total - a[1].total)

  const byTypeMap = countBy(inWindow.flatMap((row) => row.types ?? []))
  const byType = Object.entries(byTypeMap).sort((a, b) => b[1] - a[1])

  const actions = []

  if (sunnyvaleRows.filter(pending).length === 0) {
    actions.push(
      `**${LAUNCH_CITY}:** No pending library rows — Sunnyvale Public Library is watchlist-only until ` +
        '`discover-sunnyvale.mjs` exists; verify Mini Yoga Club + FIT4MOM Las Palmas + library seeds.',
    )
  }
  if (!inWindow.some((row) => LIBRARY_SOURCES.has(row.source) && row.city === LAUNCH_CITY)) {
    actions.push(
      `**${LAUNCH_CITY} library:** No automated Sunnyvale branch scraper — add ` +
        '`discover-sunnyvale.mjs` or keep `build-launch-staging.mjs` series seeds current.',
    )
  }
  if (parentAndMeRows.filter(pending).length < 3) {
    actions.push(
      '**Parent & Me:** Re-check FIT4MOM weekly graphic (Mondays), Marti Foster, Music Together semester row.',
    )
  }
  if (festivalRows.filter(pending).length < 2) {
    actions.push(
      '**Festivals & Community:** Manual pass on MV/LA city calendars, harvest weekends, Halloween fairs (Sep–Oct).',
    )
  }
  actions.push(
    '**Seasonal drive picks:** Editorial farms/haunts live in `seasonal*DriveEvents.ts` — not library scrapers.',
  )
  actions.push(
    `**Core cities only in regular discovery:** Events outside ${[...CORE_CITIES].join(' / ')} ` +
      'belong in Seasonal → Worth a Little Drive until a city landing justifies a scraper.',
  )

  return {
    sunnyvale: {
      inWindow: sunnyvaleRows.length,
      pending: sunnyvaleRows.filter(pending).length,
      onCatalog: catalogInWindow.filter((event) => event.city === LAUNCH_CITY).length,
    },
    parentAndMe: {
      inWindow: parentAndMeRows.length,
      pending: parentAndMeRows.filter(pending).length,
      onCatalog: catalogInWindow.filter(
        (event) => event.types?.includes('Parent & Me'),
      ).length,
    },
    festivals: {
      inWindow: festivalRows.length,
      pending: festivalRows.filter(pending).length,
      onCatalog: catalogInWindow.filter((event) =>
        event.types?.includes('Festivals & Community'),
      ).length,
    },
    byCity,
    byType,
    sunnyvalePendingRows: sortRows(sunnyvaleRows.filter(pending)),
    parentAndMePendingRows: sortRows(parentAndMeRows.filter(pending)),
    festivalsPendingRows: sortRows(festivalRows.filter(pending)),
    actions,
  }
}

async function main() {
  const { days, runScrape } = parseLookaheadArgs(process.argv.slice(2))
  const startYmd = pacificTodayYmd()
  const endYmd = addDaysYmd(startYmd, days)

  if (runScrape) {
    await runBayAreaScrape(days)
  }

  const discovery = loadJson('src/data/discovery-candidates.json')
  const sheetEvents = loadJson('src/data/sheet-events.json')
  const watchlist = loadJson('data/calendar-watchlist.json')

  const expansion = analyzeExpansion({
    candidates: discovery.candidates ?? [],
    sheetEvents,
    startYmd,
    endYmd,
  })

  const payload = {
    generatedAt: new Date().toISOString(),
    window: { start: startYmd, end: endYmd, days },
    launchTargets: {
      city: LAUNCH_CITY,
      activityTypes: LAUNCH_TYPES,
    },
    discoveryGeneratedAt: discovery.generatedAt,
    expansion,
    watchlistUpdatedAt: watchlist.updatedAt,
  }

  const outDir = join(rootDir, 'data/discovery')
  mkdirSync(outDir, { recursive: true })
  const jsonPath = join(outDir, `expansion-lookahead-${startYmd}.json`)
  writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`)

  const mdPath = join(rootDir, 'docs/calendar-watchlist-next-2-months.md')
  const markdown = buildMarkdownReport({
    startYmd,
    endYmd,
    days,
    discovery,
    sheetEvents,
    watchlist,
    expansion,
  })
  writeFileSync(mdPath, markdown)

  console.log('')
  console.log(`Expansion lookahead (${days} days): ${startYmd} → ${endYmd}`)
  console.log(`  ${LAUNCH_CITY}: ${expansion.sunnyvale.pending} pending · ${expansion.sunnyvale.onCatalog} on catalog`)
  console.log(
    `  Parent & Me: ${expansion.parentAndMe.pending} pending · ${expansion.parentAndMe.onCatalog} on catalog`,
  )
  console.log(
    `  Festivals: ${expansion.festivals.pending} pending · ${expansion.festivals.onCatalog} on catalog`,
  )
  console.log('')
  console.log('Wrote')
  console.log(`  ${jsonPath}`)
  console.log(`  ${mdPath}`)
  console.log('')
  console.log('Next: review /admin/discovery · approve Sunnyvale + Parent & Me + Festivals rows')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

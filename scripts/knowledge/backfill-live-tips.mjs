#!/usr/bin/env node
/**
 * Backfill empty (or optionally weak) live tips from the knowledge library.
 *
 * Writes prefixed tip lines onto src/data/sheet-events.json for Published rows
 * that match a venue/program and currently have empty tips.
 *
 * Does NOT publish. Review in Admin / git diff before deploy.
 *
 * Usage:
 *   node scripts/knowledge/backfill-live-tips.mjs
 *   node scripts/knowledge/backfill-live-tips.mjs --rewrite-matched
 *   node scripts/knowledge/backfill-live-tips.mjs --dry-run
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isPublicEvent } from '../publishing.mjs'
import { composeTipSuggestions } from './compose.mjs'
import { KNOWLEDGE_FACTS } from './load.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const sheetPath = join(root, 'src/data/sheet-events.json')
const factsPath = join(root, 'data/knowledge/facts.json')

const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')
const rewriteMatched = args.has('--rewrite-matched')

const sheet = JSON.parse(readFileSync(sheetPath, 'utf8'))
const today = new Date()
const factUsage = new Map(KNOWLEDGE_FACTS.map((f) => [f.id, new Set(f.usedByEventIds || [])]))

let updated = 0
const report = []

for (const event of sheet) {
  if (!isPublicEvent(event, today)) continue
  const existing = String(event.tips || '').trim()
  const hasPrefix = /(^|\n)(ticket|baby|stroller|accessibility|restroom|food|weather|crowds|sound|info)\|/i.test(
    existing,
  )

  if (existing && !rewriteMatched) continue
  if (existing && rewriteMatched && hasPrefix) continue

  const composed = composeTipSuggestions({
    title: event.title,
    venue: event.venue,
    city: event.city,
    description: event.description,
    tips: event.tips,
    eventUrl: event.eventUrl,
    eventId: event.id,
  })

  // Never rewrite from venue-only matches — too easy to overwrite event-specific tips.
  if (existing && rewriteMatched && !composed.programId) continue

  const lines = composed.suggestions
    .filter((s) => s.reuseSafe && !s.stale && s.status === 'verified')
    .filter((s) => (existing && rewriteMatched ? s.scope === 'program' : true))
    .map((s) => s.prefixedLine)

  if (lines.length === 0) continue

  const nextTips = lines.join('\n')
  if (nextTips === existing) continue

  report.push({
    id: event.id,
    title: event.title,
    venueId: composed.venueId,
    programId: composed.programId,
    before: existing ? `${existing.split('\n').length} lines` : '(empty)',
    after: lines,
  })

  if (!dryRun) {
    event.tips = nextTips
    for (const suggestion of composed.suggestions) {
      if (!suggestion.reuseSafe || suggestion.stale) continue
      const set = factUsage.get(suggestion.factId) || new Set()
      set.add(event.id)
      factUsage.set(suggestion.factId, set)
    }
  }
  updated += 1
}

console.log(`${dryRun ? 'Would update' : 'Updated'} ${updated} live event(s).`)
for (const row of report) {
  console.log(`\n${row.title}`)
  console.log(`  ${row.id}`)
  console.log(`  match: ${row.venueId || '—'} / ${row.programId || '—'}`)
  console.log(`  ${row.before} →`)
  for (const line of row.after) console.log(`    ${line}`)
}

if (!dryRun && updated > 0) {
  writeFileSync(sheetPath, `${JSON.stringify(sheet, null, 2)}\n`)
  const nextFacts = KNOWLEDGE_FACTS.map((fact) => {
    const used = factUsage.get(fact.id)
    if (!used || used.size === 0) return fact
    return { ...fact, usedByEventIds: [...used].sort() }
  })
  writeFileSync(factsPath, `${JSON.stringify(nextFacts, null, 2)}\n`)
  console.log(`\nWrote ${sheetPath}`)
  console.log(`Updated usedByEventIds in ${factsPath}`)
  console.log('Review the diff, then publish when ready.')
}

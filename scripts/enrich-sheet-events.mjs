/**
 * One-off: apply copy enrichment to bundled sheet-events.json.
 * Safe to re-run after sync to restore truncated descriptions and fix types/tips.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { applyEventCopyEnrichment } from './event-enrichment.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const outputPath = join(rootDir, 'src/data/sheet-events.json')

const events = JSON.parse(readFileSync(outputPath, 'utf8'))
let changedCount = 0

const enriched = events.map((event) => {
  const next = applyEventCopyEnrichment({
    ...event,
    sheetTypesRaw: event.types?.join(', ') ?? '',
  })
  if (JSON.stringify(next) !== JSON.stringify(event)) changedCount += 1
  return next
})

enriched.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
writeFileSync(outputPath, `${JSON.stringify(enriched, null, 2)}\n`)
console.log(`Enriched ${changedCount} of ${events.length} events → ${outputPath}`)

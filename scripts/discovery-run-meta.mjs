#!/usr/bin/env node
/**
 * Merge one scrape's candidate ids into today's discovery meta.
 * A later scrape on the same day adds ids. A new day replaces the file.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const metaPath = join(rootDir, 'data/discovery/latest-scrape-meta.json')

export function recordScrapeMeta({ date, days, sourceName, candidateIds, metaPath: path = metaPath }) {
  let current = { date, days, sources: {}, ids: {} }
  try {
    const previous = JSON.parse(readFileSync(path, 'utf8'))
    if (previous?.date === date) current = previous
  } catch {
    // First scrape of the day.
  }
  current.date = date
  current.days = Math.max(Number(current.days) || 0, Number(days) || 0)
  current.sources = current.sources || {}
  current.ids = current.ids || {}
  current.sources[sourceName] = { days, count: candidateIds.length }
  for (const id of candidateIds) {
    if (id) current.ids[id] = date
  }
  writeFileSync(path, `${JSON.stringify(current, null, 2)}\n`)
  return current
}

function isMain() {
  return Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === process.argv[1]
}

if (isMain()) {
  console.log('recordScrapeMeta is imported by the discovery scripts.')
}

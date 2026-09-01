#!/usr/bin/env node
/**
 * Patch FIT4MOM (and Marti) good-to-know tips in discovery-candidates.json.
 *
 * Usage: node scripts/patch-fit4mom-tips.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DISCOVERY_ADMIN_PATH } from './discovery-shared.mjs'
import { buildFit4momDiscoveryCopy, buildMartiGoodToKnow } from './fit4mom-tips.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

function main() {
  const catalog = JSON.parse(readFileSync(DISCOVERY_ADMIN_PATH, 'utf8'))
  let fit4mom = 0
  let marti = 0

  for (const candidate of catalog.candidates) {
    if (candidate.source?.includes('FIT4MOM')) {
      const copy = buildFit4momDiscoveryCopy(candidate)
      candidate.description = copy.description
      candidate.tips = copy.tips
      fit4mom += 1
      continue
    }

    if (candidate.source?.includes('Marti Foster')) {
      candidate.tips = buildMartiGoodToKnow()
      marti += 1
    }
  }

  writeFileSync(DISCOVERY_ADMIN_PATH, `${JSON.stringify(catalog, null, 2)}\n`)
  console.log(`Patched tips: ${fit4mom} FIT4MOM, ${marti} Marti Foster`)
}

main()

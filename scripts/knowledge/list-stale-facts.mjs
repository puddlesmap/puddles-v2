#!/usr/bin/env node
/**
 * List knowledge facts past their volatility refresh window.
 * Usage: node scripts/knowledge/list-stale-facts.mjs
 */
import { KNOWLEDGE_FACTS } from './load.mjs'

const VOLATILITY_DAYS = { stable: 180, semi: 90, dynamic: 14 }

function ageDays(verifiedAt, now = new Date()) {
  const raw = String(verifiedAt || '').trim()
  if (!raw) return null
  const then = new Date(raw.includes('T') ? raw : `${raw}T12:00:00`)
  if (Number.isNaN(then.getTime())) return null
  return Math.floor((now.getTime() - then.getTime()) / 86400000)
}

const now = new Date()
const stale = KNOWLEDGE_FACTS.filter((fact) => {
  const age = ageDays(fact.verifiedAt, now)
  if (age == null) return true
  return age > (VOLATILITY_DAYS[fact.volatility] ?? 90)
})

console.log(`Knowledge facts: ${KNOWLEDGE_FACTS.length}`)
console.log(`Stale as of ${now.toISOString().slice(0, 10)}: ${stale.length}`)
for (const fact of stale) {
  const deps = (fact.usedByEventIds || []).length
  console.log(
    `- ${fact.id} · ${fact.volatility} · verified ${fact.verifiedAt} · ${fact.scope}/${fact.category}` +
      (deps ? ` · used by ${deps}` : ''),
  )
}

if (stale.length === 0) {
  console.log('All facts are within their refresh window.')
}

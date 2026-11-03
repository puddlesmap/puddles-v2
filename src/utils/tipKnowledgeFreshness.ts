import type { TipFact, TipFactVolatility } from '../types/tipKnowledge'

/** Days after verifiedAt before a fact is marked stale in Admin. */
export const VOLATILITY_REFRESH_DAYS: Record<TipFactVolatility, number> = {
  stable: 180,
  semi: 90,
  dynamic: 14,
}

export function daysSince(isoDate: string, now: Date = new Date()): number | null {
  const raw = String(isoDate ?? '').trim()
  if (!raw) return null
  const then = new Date(raw.includes('T') ? raw : `${raw}T12:00:00`)
  if (Number.isNaN(then.getTime())) return null
  const ms = now.getTime() - then.getTime()
  return Math.floor(ms / (24 * 60 * 60 * 1000))
}

export function isFactStale(fact: Pick<TipFact, 'verifiedAt' | 'volatility'>, now: Date = new Date()): boolean {
  const age = daysSince(fact.verifiedAt, now)
  if (age == null) return true
  return age > VOLATILITY_REFRESH_DAYS[fact.volatility]
}

export function listStaleFacts(facts: TipFact[], now: Date = new Date()): TipFact[] {
  return facts.filter((fact) => isFactStale(fact, now))
}

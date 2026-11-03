import type { TipFact } from '../types/tipKnowledge'
import { KNOWLEDGE_FACTS } from '../data/knowledge'

const STORAGE_KEY = 'puddles-tip-knowledge-overrides-v1'

type KnowledgeOverrideStore = {
  /** Full fact replacements / additions keyed by fact id. */
  facts: Record<string, TipFact>
  updatedAt: string
}

function readStore(): KnowledgeOverrideStore {
  if (typeof window === 'undefined') return { facts: {}, updatedAt: '' }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { facts: {}, updatedAt: '' }
    const parsed = JSON.parse(raw) as KnowledgeOverrideStore
    if (!parsed || typeof parsed !== 'object') return { facts: {}, updatedAt: '' }
    return {
      facts: parsed.facts && typeof parsed.facts === 'object' ? parsed.facts : {},
      updatedAt: parsed.updatedAt || '',
    }
  } catch {
    return { facts: {}, updatedAt: '' }
  }
}

function writeStore(store: KnowledgeOverrideStore) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

/** Bundle facts merged with Admin save-back overrides (browser only). */
export function loadFactsWithOverrides(base: TipFact[] = KNOWLEDGE_FACTS): TipFact[] {
  const overrides = readStore().facts
  const byId = new Map(base.map((f) => [f.id, f]))
  for (const [id, fact] of Object.entries(overrides)) {
    byId.set(id, fact)
  }
  return [...byId.values()]
}

export function saveFactOverride(fact: TipFact) {
  const store = readStore()
  store.facts[fact.id] = fact
  store.updatedAt = new Date().toISOString()
  writeStore(store)
}

export function recordFactUsedByEvent(factId: string, eventId: string, base: TipFact[] = KNOWLEDGE_FACTS) {
  if (!factId || !eventId) return
  const merged = loadFactsWithOverrides(base)
  const existing = merged.find((f) => f.id === factId)
  if (!existing) return
  const used = new Set(existing.usedByEventIds ?? [])
  if (used.has(eventId)) return
  used.add(eventId)
  saveFactOverride({ ...existing, usedByEventIds: [...used] })
}

export function getFactDependencyIds(factId: string, base: TipFact[] = KNOWLEDGE_FACTS): string[] {
  const fact = loadFactsWithOverrides(base).find((f) => f.id === factId)
  return fact?.usedByEventIds ?? []
}

export function clearKnowledgeOverrides() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
}

export function exportKnowledgeOverrides(): KnowledgeOverrideStore {
  return readStore()
}

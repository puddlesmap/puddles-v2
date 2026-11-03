#!/usr/bin/env node
/**
 * Merge manual checklist / Cursor browser scrape leads into discovery-candidates.json.
 *
 * Usage:
 *   node scripts/merge-manual-checklist-scrape.mjs data/discovery/manual-checklist-scrape-2026-11-03.json
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  catalogUrlKeys,
  findPreviousDiscoveryCandidate,
  indexDiscoveryCandidatesByIdentity,
  isUrlAlreadyOnPuddles,
  loadCatalogUrls,
  loadExistingDiscoveryCandidates,
  mergeDiscoveryCandidateReviewFields,
  pacificTodayYmd,
  sortCandidates,
  summarizeDiscoveryCandidateStats,
} from './discovery-shared.mjs'

const adminPath = join(process.cwd(), 'src/data/discovery-candidates.json')

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

function normTitle(t) {
  return String(t).toLowerCase().replace(/[^a-z0-9]+/g, ' ')
}

export function mergeLeads(leads, { sourceDefault = 'Manual checklist scrape · Cursor browser' } = {}) {
  const checked = pacificTodayYmd()
  const catalogUrls = loadCatalogUrls()
  const existing = loadExistingDiscoveryCandidates(adminPath)
  const index = indexDiscoveryCandidatesByIdentity(existing)
  const merged = [...existing]
  const added = []

  for (const partial of leads) {
    const id = partial.id || `manual-${slug(partial.title)}-${partial.date}`
    const prev = findPreviousDiscoveryCandidate({ id, eventUrl: partial.eventUrl }, index)
    if (
      prev?.reviewStatus === 'live' &&
      (prev.id === id ||
        (normTitle(prev.title) === normTitle(partial.title) && prev.date === partial.date))
    ) {
      continue
    }

    const onSite = isUrlAlreadyOnPuddles(partial.eventUrl, catalogUrls)
    const base = {
      room: '',
      audiences: '',
      categoryTags: [],
      imageUrl: '',
      isCancelled: false,
      isRecurring: false,
      convertedEventId: '',
      lastChecked: checked,
      lat: null,
      lng: null,
      ageMin: 0,
      ageMax: 5,
      ageRange: '0–5',
      types: ['Festivals & Community'],
      cost: 'Free',
      tips: '',
      reviewStatus: 'pending',
      source: partial.source || sourceDefault,
      ...partial,
      id,
      alreadyOnPuddles: partial.alreadyOnPuddles ?? onSite,
    }
    const candidate = mergeDiscoveryCandidateReviewFields(base, prev)

    const dupe = merged.find(
      (x) => normTitle(x.title) === normTitle(candidate.title) && x.date === candidate.date,
    )
    if (dupe) {
      Object.assign(dupe, {
        ...candidate,
        reviewStatus: dupe.reviewStatus === 'dismissed' ? 'pending' : dupe.reviewStatus,
      })
      added.push(dupe)
      continue
    }
    merged.push(candidate)
    added.push(candidate)
    for (const key of catalogUrlKeys(candidate.eventUrl)) index.byUrl.set(key, candidate)
    index.byId.set(candidate.id, candidate)
  }

  sortCandidates(merged)
  const catalog = JSON.parse(readFileSync(adminPath, 'utf8'))
  catalog.generatedAt = new Date().toISOString()
  catalog.candidates = merged
  catalog.stats = summarizeDiscoveryCandidateStats(merged)
  writeFileSync(adminPath, JSON.stringify(catalog, null, 2) + '\n')
  return { added: added.length, total: merged.length }
}

const input = process.argv[2]
if (!input) {
  console.error('Usage: node scripts/merge-manual-checklist-scrape.mjs <leads.json>')
  process.exit(1)
}
const payload = JSON.parse(readFileSync(input, 'utf8'))
const leads = payload.candidates || payload.leads || payload
const result = mergeLeads(leads, { sourceDefault: payload.source })
console.log(`Merged ${result.added} lead(s). Total candidates: ${result.total}.`)

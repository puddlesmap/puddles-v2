#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { applyAgentPost, emptyInbox } from '../src/utils/discoveryInboxCore.mjs'

const candidatesPath = 'src/data/discovery-candidates.json'
const inboxPath = 'data/discovery/agent-inbox.json'
const eventsPath = 'src/data/sheet-events.json'

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return fallback
  }
}

const catalogFile = readJson(candidatesPath, { candidates: [] })
const sourceCandidates = Array.isArray(catalogFile) ? catalogFile : catalogFile.candidates || []
const catalogEvents = readJson(eventsPath, [])
let inbox = { ...emptyInbox(), ...readJson(inboxPath, emptyInbox()) }
const today = new Date()
const startYmd = today.toISOString().slice(0, 10)
const horizon = new Date(today)
horizon.setUTCDate(horizon.getUTCDate() + 90)
const endYmd = horizon.toISOString().slice(0, 10)

const normalized = sourceCandidates
  .filter((row) => row.date >= startYmd && row.date <= endYmd && row.reviewStatus !== 'dismissed')
  .map((row) => ({
  title: row.title,
  date: row.date,
  startTime: row.startTime,
  endTime: row.endTime,
  city: row.city,
  venue: row.venue,
  cost: row.cost,
  ageRange: row.ageRange,
  bestFor: row.bestFor || '',
  description: row.description,
  tips: row.tips,
  types: row.types,
  imageUrl: row.imageUrl,
  eventUrl: row.eventUrl,
  sourceUrl: row.eventUrl,
  sourceName: row.source || 'Scheduled discovery',
  sourceExcerpt: row.description || row.tips || row.title,
  sourceSnapshot: {
    titleText: row.title,
    dateText: row.date,
    timeText: [row.startTime, row.endTime].filter(Boolean).join('–'),
    locationText: [row.venue, row.city].filter(Boolean).join(', '),
    costText: row.cost,
    ageText: row.ageRange,
  },
  providerEventId: row.id,
  isCancelled: row.isCancelled === true,
  discoveredAt: row.lastChecked || catalogFile.generatedAt || new Date().toISOString(),
  }))

for (let index = 0; index < normalized.length; index += 100) {
  const chunk = normalized.slice(index, index + 100)
  inbox = applyAgentPost(
    inbox,
    {
      candidates: chunk,
      runId: `scheduled-${new Date().toISOString().slice(0, 10)}`,
      completedAt: new Date().toISOString(),
      agent: 'Scheduled discovery adapters',
      sourcesChecked: Array.isArray(catalogFile.sources) ? catalogFile.sources.length : 0,
      sourcesSucceeded: Array.isArray(catalogFile.sources) ? catalogFile.sources.length : 0,
    },
    catalogEvents,
  ).inbox
}

writeFileSync(inboxPath, `${JSON.stringify(inbox, null, 2)}\n`)
console.log(`Merged ${normalized.length} scheduled candidates into ${inbox.candidates.length} inbox records.`)

/**
 * Validates Expansion Watch submission payload shape and optionally posts a test row.
 *
 * Usage:
 *   node scripts/verify-expansion-watch-submission.mjs
 *   node scripts/verify-expansion-watch-submission.mjs --live
 *
 * --live  POSTs to GOOGLE_APPS_SCRIPT_URL (from .env.local) with a test email.
 *         Omit on CI or when you only want a local shape check.
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

function loadEnvLocal() {
  const path = join(rootDir, '.env.local')
  if (!existsSync(path)) return {}
  const env = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return env
}

function buildExpansionWatchPayload() {
  const submittedAt = new Date().toISOString()
  const metadata = {
    source_context: 'footer_about',
    selected_city: null,
    selected_filters: null,
    requested_location: 'San Jose',
    timestamp: submittedAt,
  }

  return {
    action: 'appendSubmission',
    payload: {
      submissionType: 'ExpansionWatch',
      eventName: 'Expansion Watch sign-up',
      locationName: 'San Jose',
      city: 'San Jose',
      requestedLocation: 'San Jose',
      sourceContext: 'footer_about',
      selectedCity: '',
      submittedByEmail: 'expansion-watch-verify@puddles.test',
      submittedAt,
      additionalInfo: 'footer_about',
      internalNotes: JSON.stringify(metadata),
    },
  }
}

function assertPayloadShape(request) {
  const { payload } = request
  const required = [
    'submissionType',
    'eventName',
    'requestedLocation',
    'sourceContext',
    'submittedByEmail',
    'submittedAt',
    'internalNotes',
  ]

  for (const key of required) {
    if (!payload[key]) {
      throw new Error(`Missing required payload field: ${key}`)
    }
  }

  if (payload.submissionType !== 'ExpansionWatch') {
    throw new Error(`Expected submissionType ExpansionWatch, got ${payload.submissionType}`)
  }

  const metadata = JSON.parse(payload.internalNotes)
  if (metadata.source_context !== payload.sourceContext) {
    throw new Error('internalNotes.source_context must match sourceContext')
  }
  if (metadata.requested_location !== payload.requestedLocation) {
    throw new Error('internalNotes.requested_location must match requestedLocation')
  }
}

async function postLive(scriptUrl, request) {
  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  const text = await response.text()
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error(`GAS returned non-JSON: ${text.slice(0, 200)}`)
  }
  if (!response.ok || !parsed.ok) {
    throw new Error(parsed.error || `GAS request failed (${response.status})`)
  }
  return parsed.result
}

const live = process.argv.includes('--live')
const request = buildExpansionWatchPayload()

assertPayloadShape(request)
console.log('Payload shape OK')
console.log(JSON.stringify(request.payload, null, 2))

if (!live) {
  console.log('\nLocal verification passed. Run with --live to append a test row to Submissions.')
  process.exit(0)
}

const env = loadEnvLocal()
const scriptUrl = env.GOOGLE_APPS_SCRIPT_URL || process.env.GOOGLE_APPS_SCRIPT_URL
if (!scriptUrl) {
  console.error('GOOGLE_APPS_SCRIPT_URL not set in .env.local or environment')
  process.exit(1)
}

const result = await postLive(scriptUrl, request)
console.log('\nLive submission OK')
console.log(`Submission ID: ${result.id}`)
console.log('Confirm in Google Sheet Submissions tab: Submission Type = ExpansionWatch')

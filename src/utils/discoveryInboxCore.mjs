/**
 * Pure Discovery Inbox rules. No GitHub, no browser storage.
 * The Netlify function, the Admin page, and the fixture all use this module.
 */

const LIMITS = {
  title: 180,
  excerpt: 600,
  url: 500,
  snapshot: 240,
  name: 80,
  city: 60,
  venue: 120,
  cost: 40,
  age: 80,
  time: 16,
  text: 800,
  id: 120,
}

export function pacificTodayYmd(reference = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(reference)
}

export function plainText(value, max) {
  const text = String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.slice(0, max)
}

export function normalizeCopy(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeUrl(url) {
  return String(url ?? '')
    .trim()
    .replace(/\/$/, '')
    .toLowerCase()
}

function slug(value) {
  return normalizeCopy(value).replace(/ /g, '-').slice(0, 48)
}

export function emptyInbox() {
  return { latestRun: null, candidates: [], pendingUrls: [] }
}

export function candidateIdentityKey(candidate) {
  const providerId = plainText(candidate?.providerEventId, LIMITS.id)
  if (providerId) return `id:${providerId.toLowerCase()}`
  const url = normalizeUrl(candidate?.eventUrl || candidate?.sourceUrl)
  const title = normalizeCopy(candidate?.title)
  if (url && title && url !== '#') return `url:${url}|${title}`
  const venue = normalizeCopy(candidate?.venue)
  const city = normalizeCopy(candidate?.city)
  if (title && (venue || city)) return `place:${title}|${venue}|${city}`
  return ''
}

function registrationSignal(row) {
  const text = `${row?.tips || ''} ${row?.description || ''} ${row?.cost || ''} ${row?.sourceExcerpt || ''}`
  const bits = []
  if (/regist(?:er|ration)|rsvp|sign[\s-]?up/i.test(text)) bits.push('registration')
  if (/ticket/i.test(text)) bits.push('ticket')
  if (/drop-?in/i.test(text)) bits.push('drop-in')
  return bits.sort().join('+')
}

export function candidateReviewTiming(candidate, today = pacificTodayYmd()) {
  if (!candidate?.date) return 'review'
  const start = new Date(`${today}T12:00:00`)
  const date = new Date(`${candidate.date}T12:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(date.getTime())) return 'review'
  const days = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
  if (days <= 60) return 'review'
  if (registrationSignal(candidate).length > 0) return 'review'
  return 'later'
}

function isCancelledRow(row) {
  if (!row) return false
  if (row.isCancelled === true || row.status === 'Cancelled') return true
  return /\b(cancel+ed|postponed)\b/i.test(
    `${row.title || ''} ${row.sourceExcerpt || ''} ${row.tips || ''} ${row.description || ''}`,
  )
}

export function isCancelledNotice(row) {
  return isCancelledRow(row)
}

function stripCancelPrefix(value) {
  return String(value ?? '').replace(/^(?:cancel+ed|postponed)\s*[-–—:]+\s*/i, '')
}

/** Keep the published title when the library only prefixed it with Canceled--. */
export function publishedTitleForUpdate(nextTitle, currentTitle) {
  const next = normalizeCopy(stripCancelPrefix(nextTitle))
  const current = normalizeCopy(stripCancelPrefix(currentTitle))
  if (next && current && next === current) return currentTitle || nextTitle
  return nextTitle || currentTitle || ''
}

function providerIds(row) {
  const ids = new Set()
  const explicit = plainText(row?.providerEventId, LIMITS.id).toLowerCase()
  if (explicit) ids.add(explicit)
  const url = String(row?.eventUrl || row?.sourceUrl || '')
  for (const match of url.matchAll(/\/events?\/([a-z0-9]{5,})/gi)) ids.add(match[1].toLowerCase())
  const tail = String(row?.id || '').match(/(?:^id:|-)([a-z0-9]{5,})$/i)
  if (tail) ids.add(tail[1].toLowerCase())
  return ids
}

/** A "Canceled--…" page for an occurrence already in the catalog. */
function sameCancellationTarget(event, candidate) {
  if (!isCancelledRow(candidate) || isCancelledRow(event)) return false
  if (candidate?.date && event?.date && candidate.date !== event.date) return false
  const left = providerIds(candidate)
  for (const id of providerIds(event)) {
    if (left.has(id)) return true
  }
  const leftTitle = normalizeCopy(stripCancelPrefix(candidate?.title))
  const rightTitle = normalizeCopy(stripCancelPrefix(event?.title))
  return Boolean(
    leftTitle &&
      leftTitle === rightTitle &&
      normalizeCopy(candidate?.venue) &&
      normalizeCopy(candidate.venue) === normalizeCopy(event?.venue),
  )
}

function kidFit(row) {
  return normalizeCopy(`${row?.description || ''} ${row?.tips || ''}`)
}

/** Parent-relevant diff. Formatting-only copy stays equal after normalizeCopy. */
export function diffParentFields(event, candidate) {
  const changes = []
  if (event?.date && candidate?.date && event.date !== candidate.date) {
    changes.push(`date: ${event.date} → ${candidate.date}`)
  }
  const eventTime = `${event?.startTime || ''}${event?.endTime ? `–${event.endTime}` : ''}`
  const nextTime = `${candidate?.startTime || ''}${candidate?.endTime ? `–${candidate.endTime}` : ''}`
  if (candidate?.startTime && normalizeCopy(eventTime) !== normalizeCopy(nextTime)) {
    changes.push(`time: ${eventTime || '—'} → ${nextTime}`)
  }
  if (candidate?.ageRange && normalizeCopy(event?.ageRange) !== normalizeCopy(candidate.ageRange)) {
    changes.push(`age: ${event?.ageRange || '—'} → ${candidate.ageRange}`)
  }
  if ((candidate?.cost || event?.cost) && normalizeCopy(event?.cost) !== normalizeCopy(candidate?.cost)) {
    changes.push(`price: ${event?.cost || '—'} → ${candidate?.cost || '—'}`)
  }
  const beforeReg = registrationSignal(event)
  const afterReg = registrationSignal(candidate)
  if (beforeReg !== afterReg && (beforeReg || afterReg)) {
    changes.push(`registration: ${beforeReg || 'none'} → ${afterReg || 'none'}`)
  }
  if (isCancelledRow(candidate) && !isCancelledRow(event)) {
    changes.push('cancelled or postponed')
  } else {
    const beforeKid = kidFit(event)
    const afterKid = kidFit(candidate)
    if (afterKid && beforeKid !== afterKid) changes.push('kid-fit changed')
  }
  return changes
}

function daysApart(a, b) {
  const left = Date.parse(`${a}T12:00:00Z`)
  const right = Date.parse(`${b}T12:00:00Z`)
  if (Number.isNaN(left) || Number.isNaN(right)) return 999
  return Math.round(Math.abs(left - right) / 86400000)
}

function sameIdentity(event, candidate) {
  const key = candidateIdentityKey(candidate)
  if (!key) return false
  return candidateIdentityKey(event) === key
}

export function findIdentityMatches(candidate, events) {
  return (events || []).filter(
    (event) =>
      event &&
      event.status !== 'Draft' &&
      (sameIdentity(event, candidate) || sameCancellationTarget(event, candidate)),
  )
}

function isSeriesRow(event) {
  return Boolean(event?.isRecurring) || event?.scheduleKind === 'seasonal-run'
}

/**
 * New / Updated / Existing, plus flags. Date is not required to match.
 * Several dated rows with one new date → New.
 * One series row with a new date → Updated.
 * Both readings at once → ambiguous, Approve stays off until the editor chooses.
 */
export function labelCandidate(candidate, events) {
  const flags = []
  const reviewReasons = []
  const matches = findIdentityMatches(candidate, events)
  const sameDate = matches.filter((event) => event.date === candidate.date)
  const series = matches.filter(isSeriesRow)
  const dated = matches.filter((event) => !isSeriesRow(event))

  let status = 'New'
  let detectedChanges = []
  let matchedEventId = null
  let needsChoice = false

  const bothReadings = series.length >= 1 && dated.length >= 1 && sameDate.length === 0
  if (bothReadings) {
    needsChoice = true
    flags.push('needsReview')
    reviewReasons.push('ambiguous_recurring_schedule')
    status = 'Updated'
    matchedEventId = series[0]?.id || null
  } else if (matches.length === 1) {
    detectedChanges = diffParentFields(matches[0], candidate)
    status = detectedChanges.length > 0 ? 'Updated' : 'Existing'
    matchedEventId = matches[0].id
  } else if (matches.length > 1) {
    if (sameDate.length === 1) {
      detectedChanges = diffParentFields(sameDate[0], candidate)
      status = detectedChanges.length > 0 ? 'Updated' : 'Existing'
      matchedEventId = sameDate[0].id
    } else if (sameDate.length === 0) {
      status = 'New'
    } else {
      needsChoice = true
      flags.push('needsReview')
      reviewReasons.push('ambiguous_recurring_schedule')
      status = 'Updated'
    }
  }

  if (status === 'New' && matches.length === 0) {
    const title = normalizeCopy(candidate.title)
    const city = normalizeCopy(candidate.city)
    const dup = (events || []).some((event) => {
      if (!title || normalizeCopy(event.title) !== title) return false
      if (city && normalizeCopy(event.city) !== city) return false
      if (!candidate.date || !event.date) return true
      const days = daysApart(event.date, candidate.date)
      return days > 0 && days <= 14
    })
    if (dup) {
      flags.push('possibleDuplicate')
      reviewReasons.push('possible_duplicate')
    }
  }

  if (!candidate.date) {
    flags.push('needsReview')
    reviewReasons.push('missing_date')
  }
  if (!normalizeUrl(candidate.eventUrl) && !normalizeUrl(candidate.sourceUrl)) {
    flags.push('needsReview')
    reviewReasons.push('missing_url')
  }
  if (!plainText(candidate.ageRange, LIMITS.age)) {
    flags.push('needsReview')
    reviewReasons.push('missing_age')
  }
  if (plainText(candidate.sourceExcerpt, LIMITS.excerpt).length < 12) {
    flags.push('needsReview')
    reviewReasons.push('thin_evidence')
  }
  for (const reason of candidate.reviewReasons || []) {
    if (reason === 'unreadable_source') {
      flags.push('unreadableSource')
      flags.push('needsReview')
      reviewReasons.push('unreadable_source')
    }
  }

  return {
    status,
    flags: [...new Set(flags)],
    reviewReasons: [...new Set(reviewReasons)],
    detectedChanges,
    matchedEventId,
    needsChoice,
  }
}

export function needsDecision(label) {
  if (!label) return false
  if (label.status === 'New' || label.status === 'Updated') return true
  return label.flags.length > 0
}

export function approveBlocked(candidate, label) {
  if (!plainText(candidate?.title, LIMITS.title) || !candidate?.date) return true
  const reasons = new Set(label?.reviewReasons || [])
  if (reasons.has('missing_date') || reasons.has('missing_url') || reasons.has('missing_age') || reasons.has('thin_evidence')) {
    return true
  }
  if (label?.needsChoice && candidate?.occurrenceChoice !== 'replace' && candidate?.occurrenceChoice !== 'new') {
    return true
  }
  if ((label?.flags || []).includes('unreadableSource') && !plainText(candidate?.title, 1)) return true
  return false
}

function snapshotFrom(raw) {
  const snap = raw && typeof raw === 'object' ? raw : {}
  return {
    titleText: plainText(snap.titleText, LIMITS.snapshot),
    dateText: plainText(snap.dateText, LIMITS.snapshot),
    timeText: plainText(snap.timeText, LIMITS.snapshot),
    locationText: plainText(snap.locationText, LIMITS.snapshot),
    costText: plainText(snap.costText, LIMITS.snapshot),
    ageText: plainText(snap.ageText, LIMITS.snapshot),
  }
}

export function sanitizeCandidate(raw) {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Candidate must be an object.' }
  const sourceUrl = plainText(raw.sourceUrl, LIMITS.url)
  const sourceName = plainText(raw.sourceName, LIMITS.name)
  if (!sourceUrl.startsWith('http')) return { ok: false, error: 'Candidate needs an http sourceUrl.' }
  if (!sourceName) return { ok: false, error: 'Candidate needs a sourceName.' }

  const reasons = Array.isArray(raw.reviewReasons)
    ? raw.reviewReasons.map((reason) => plainText(reason, 60)).filter(Boolean).slice(0, 8)
    : []
  const title = plainText(raw.title, LIMITS.title)
  const date = plainText(raw.date, LIMITS.time)
  const unreadableOnly = reasons.includes('unreadable_source') && !title
  if (unreadableOnly) return { ok: true, skip: 'unreadable' }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) && raw.needsReview !== true) {
    return { ok: false, error: `Candidate “${title || sourceName}” needs a YYYY-MM-DD date or needsReview.` }
  }

  const candidate = {
    title,
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '',
    startTime: plainText(raw.startTime, LIMITS.time),
    endTime: plainText(raw.endTime, LIMITS.time),
    city: plainText(raw.city, LIMITS.city),
    venue: plainText(raw.venue, LIMITS.venue),
    cost: plainText(raw.cost, LIMITS.cost),
    ageRange: plainText(raw.age || raw.ageRange, LIMITS.age),
    bestFor: plainText(raw.bestFor, LIMITS.age),
    placement: ['browse', 'seasonal', 'drive'].includes(raw.placement) ? raw.placement : undefined,
    description: plainText(raw.description, LIMITS.text),
    tips: plainText(raw.tips, LIMITS.text),
    types: Array.isArray(raw.types)
      ? raw.types.map((type) => plainText(type, 80)).filter(Boolean).slice(0, 6)
      : [],
    imageUrl: plainText(raw.imageUrl, LIMITS.url),
    eventUrl: plainText(raw.eventUrl, LIMITS.url),
    sourceUrl,
    sourceName,
    sourceExcerpt: plainText(raw.sourceExcerpt, LIMITS.excerpt),
    sourceSnapshot: snapshotFrom(raw.sourceSnapshot),
    providerEventId: plainText(raw.providerEventId, LIMITS.id),
    isCancelled: raw.isCancelled === true,
    needsReview: raw.needsReview === true,
    reviewReasons: reasons,
    discoveredAt: plainText(raw.discoveredAt, 40) || new Date().toISOString(),
  }
  candidate.identityKey = candidateIdentityKey(candidate)
  candidate.id = candidate.identityKey || `inbox-${candidate.date || 'undated'}-${slug(title || sourceName)}`
  return { ok: true, candidate }
}

function keptDecision(previous) {
  if (!previous) return { decision: 'pending', occurrenceChoice: '' }
  const decision = previous.decision === 'ignored' || previous.decision === 'ready' || previous.decision === 'live'
    ? previous.decision
    : 'pending'
  const occurrenceChoice = previous.occurrenceChoice === 'replace' || previous.occurrenceChoice === 'new'
    ? previous.occurrenceChoice
    : ''
  return { decision, occurrenceChoice }
}

export function pruneInbox(inbox, catalog, today = pacificTodayYmd()) {
  const next = { ...emptyInbox(), ...inbox, candidates: [...(inbox?.candidates || [])] }
  const cutoff = Date.now() - 60 * 24 * 60 * 60 * 1000
  next.candidates = next.candidates.filter((candidate) => {
    if (candidate.date && candidate.date < today) return false
    const label = labelCandidate(candidate, catalog)
    const discovered = Date.parse(candidate.discoveredAt || '')
    if (
      label.status === 'Existing' &&
      label.flags.length === 0 &&
      !Number.isNaN(discovered) &&
      discovered < cutoff
    ) {
      return false
    }
    return true
  })
  return next
}

export function applyAgentPost(inbox, body, catalog, today = pacificTodayYmd()) {
  const base = pruneInbox({ ...emptyInbox(), ...inbox }, catalog, today)
  const incoming = Array.isArray(body?.candidates) ? body.candidates.slice(0, 100) : []
  const errors = []
  let upserted = 0
  let received = 0
  const byKey = new Map(base.candidates.map((row) => [row.identityKey || row.id, row]))

  for (const raw of incoming) {
    received += 1
    const parsed = sanitizeCandidate(raw)
    if (!parsed.ok) {
      errors.push(parsed.error)
      continue
    }
    if (parsed.skip) continue
    const previous = byKey.get(parsed.candidate.identityKey) || byKey.get(parsed.candidate.id)
    const decision = keptDecision(previous)
    const row = {
      ...parsed.candidate,
      ...decision,
      updatedAt: new Date().toISOString(),
    }
    byKey.set(row.identityKey || row.id, row)
    upserted += 1
  }

  const pending = [...(base.pendingUrls || [])]
  const consumed = new Set(
    [...byKey.values()].map((row) => normalizeUrl(row.sourceUrl)).filter(Boolean),
  )
  const pendingUrls = pending.filter((item) => !consumed.has(normalizeUrl(item.url)))

  const latestRun = {
    runId: plainText(body?.runId, 80) || `run-${today}`,
    startedAt: plainText(body?.startedAt, 40),
    completedAt: plainText(body?.completedAt, 40) || new Date().toISOString(),
    agent: plainText(body?.agent, 80),
    sourcesChecked: Number(body?.sourcesChecked) || 0,
    sourcesSucceeded: Number(body?.sourcesSucceeded) || 0,
    sourcesUnreadable: Number(body?.sourcesUnreadable) || 0,
    sourcesFailed: Number(body?.sourcesFailed) || 0,
  }

  const next = pruneInbox(
    {
      latestRun,
      pendingUrls,
      candidates: [...byKey.values()],
    },
    catalog,
    today,
  )
  const dropped = (inbox?.candidates || []).length + upserted - next.candidates.length
  return {
    inbox: next,
    received,
    upserted,
    dropped: Math.max(0, dropped),
    errors,
  }
}

export function enqueueUrl(inbox, sourceUrl, requestedAt = new Date().toISOString()) {
  const url = plainText(sourceUrl, LIMITS.url)
  if (!url.startsWith('http')) return { ok: false, error: 'Paste a public http(s) URL.' }
  const next = { ...emptyInbox(), ...inbox, pendingUrls: [...(inbox?.pendingUrls || [])] }
  if (!next.pendingUrls.some((item) => normalizeUrl(item.url) === normalizeUrl(url))) {
    next.pendingUrls.push({ url, requestedAt, sourceName: 'Pasted link' })
  }
  return { ok: true, inbox: next }
}

export function applyDecision(inbox, input) {
  const id = plainText(input?.id, LIMITS.id)
  const next = { ...emptyInbox(), ...inbox, candidates: (inbox?.candidates || []).map((row) => ({ ...row })) }
  const index = next.candidates.findIndex((row) => row.id === id || row.identityKey === id)
  if (index < 0) return { ok: false, error: 'That candidate is not in the inbox.' }
  const row = next.candidates[index]
  if (input?.title) row.title = plainText(input.title, LIMITS.title)
  if (input?.date) row.date = plainText(input.date, LIMITS.time)
  if (input?.startTime !== undefined) row.startTime = plainText(input.startTime, LIMITS.time)
  if (input?.endTime !== undefined) row.endTime = plainText(input.endTime, LIMITS.time)
  if (input?.venue !== undefined) row.venue = plainText(input.venue, LIMITS.venue)
  if (input?.city !== undefined) row.city = plainText(input.city, LIMITS.city)
  if (input?.ageRange !== undefined) row.ageRange = plainText(input.ageRange, LIMITS.age)
  if (input?.bestFor !== undefined) row.bestFor = plainText(input.bestFor, LIMITS.age)
  if (input?.placement !== undefined && ['browse', 'seasonal', 'drive'].includes(input.placement)) {
    row.placement = input.placement
  }
  if (input?.cost !== undefined) row.cost = plainText(input.cost, LIMITS.cost)
  if (input?.sourceExcerpt !== undefined) row.sourceExcerpt = plainText(input.sourceExcerpt, LIMITS.excerpt)
  if (input?.description !== undefined) row.description = plainText(input.description, LIMITS.text)
  if (input?.tips !== undefined) row.tips = plainText(input.tips, LIMITS.text)
  if (input?.eventUrl !== undefined) row.eventUrl = plainText(input.eventUrl, LIMITS.url)
  if (input?.imageUrl !== undefined) row.imageUrl = plainText(input.imageUrl, LIMITS.url)
  if (Array.isArray(input?.types)) {
    row.types = input.types.map((type) => plainText(type, 80)).filter(Boolean).slice(0, 6)
  }
  if (input?.occurrenceChoice === 'replace' || input?.occurrenceChoice === 'new') {
    row.occurrenceChoice = input.occurrenceChoice
  }
  if (input?.decision === 'ignored' || input?.decision === 'ready' || input?.decision === 'pending' || input?.decision === 'live') {
    row.decision = input.decision
  }
  row.identityKey = candidateIdentityKey(row)
  row.updatedAt = new Date().toISOString()
  next.candidates[index] = row
  return { ok: true, inbox: next, candidate: row }
}

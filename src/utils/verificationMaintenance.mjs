/**
 * Compare published listings to official discovery readings.
 * Routine time and same-bucket price corrections are recorded for the catalog overlay.
 * Cancellations, date moves, venue changes, and free/paid flips stay for editorial review.
 * A missing or stale reading is a failure, never a successful check.
 */
import { diffParentFields, findIdentityMatches } from './discoveryInboxCore.mjs'
import {
  addDaysYmd,
  daysUntilEvent,
  hasRegistrationSignal,
  intervalDays,
  isCheckDue,
  retryDaysFor,
} from './verificationSchedule.mjs'

export const LIBRARY_SOURCES = new Set([
  'Palo Alto Library · BiblioCommons',
  'SCCL · Los Altos',
  'Mountain View Library · LibCal',
])

function ymd(value) {
  const match = String(value || '').match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : ''
}

function moneyBucket(value) {
  const text = String(value || '').trim().toLowerCase()
  if (!text || text === 'free' || text === '$0' || text === '0' || text.startsWith('free ')) return 'free'
  if (text === 'paid' || text.startsWith('paid') || text === 'low-cost' || /^\$\d/.test(text)) return 'paid'
  return 'other'
}

export function isSeriesEvent(event) {
  return (
    event?.scheduleKind === 'seasonal-run' ||
    event?.scheduleKind === 'multi-day' ||
    event?.isRecurring === true ||
    (Array.isArray(event?.sessions) && event.sessions.length > 1)
  )
}

export function isPastForVerification(event, today) {
  if (event?.status === 'Expired' || event?.status === 'Cancelled') return true
  const end = event?.closingDate || event?.date || ''
  return Boolean(end) && end < today
}

function dateInRun(event, date) {
  const start = event?.openingDate || event?.date || ''
  const end = event?.closingDate || event?.date || ''
  return Boolean(date) && date >= start && date <= end
}

function readingIsFresh(sourceDate, today, interval) {
  if (!sourceDate || !interval) return false
  const age = (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${sourceDate}T00:00:00Z`)) / 86400000
  if (Number.isNaN(age)) return false
  return age >= -1 && age <= interval
}

export function sourceDateFor(candidate, context) {
  if (context.freshIds?.has(candidate?.id) && context.freshOn) return context.freshOn
  const stamped = ymd(candidate?.lastChecked)
  if (stamped) return stamped
  if (LIBRARY_SOURCES.has(candidate?.source)) return ymd(context.catalogGeneratedAt)
  return ''
}

function splitChanges(event, candidate) {
  const significant = []
  const routine = []
  for (const change of diffParentFields(event, candidate)) {
    if (change.startsWith('kid-fit') || change.startsWith('age:') || change.startsWith('registration:')) {
      continue
    }
    if (change.startsWith('price:')) {
      const match = change.match(/^price:\s*(.*?)\s*→\s*(.*)$/)
      if (match && moneyBucket(match[1]) === moneyBucket(match[2]) && moneyBucket(match[2]) !== 'other') {
        if (candidate?.cost) routine.push(change)
      } else significant.push(change)
      continue
    }
    if (change.startsWith('time:')) {
      if (candidate?.startTime) routine.push(change)
      continue
    }
    if (change === 'location changed') {
      const venue = String(event?.venue || '').trim().toLowerCase()
      const note = `${candidate?.description || ''} ${candidate?.venue || ''}`.toLowerCase()
      if (venue && note.includes(venue)) continue
      significant.push(change)
      continue
    }
    if (
      change.startsWith('date:') ||
      change.startsWith('venue:') ||
      change === 'cancelled or postponed'
    ) {
      significant.push(change)
    }
  }
  return { significant, routine }
}

function blankRecord(prior) {
  return {
    lastChecked: prior?.lastChecked || '',
    nextCheckDue: prior?.nextCheckDue || '',
    outcome: prior?.outcome || '',
    failureCount: prior?.failureCount || 0,
    lastFailure: prior?.lastFailure || '',
    lastAttempt: prior?.lastAttempt || '',
    failureSourceDate: prior?.failureSourceDate || '',
    escalatedOn: prior?.escalatedOn || '',
    applied: null,
    attention: prior?.outcome === 'escalated' ? prior?.attention || '' : '',
  }
}

function sameFailure(prior, today, reason, sourceDate) {
  return (
    prior?.lastAttempt === today &&
    prior?.outcome === 'failed' &&
    prior?.lastFailure === reason &&
    (prior?.failureSourceDate || '') === (sourceDate || '')
  )
}

function failure(event, context, prior, reason, sourceDate = '') {
  const today = context.today
  if (sameFailure(prior, today, reason, sourceDate)) {
    return { record: prior, kind: 'failed', reason, repeated: true }
  }
  const failureCount = (prior?.failureCount || 0) + 1
  const days = daysUntilEvent(event, today)
  const escalate =
    failureCount >= (context.config?.escalateAfterFailures ?? 3) &&
    (days <= (context.config?.escalateFailuresWithinDays ?? 30) || hasRegistrationSignal(event))
  const kept = !escalate && prior?.outcome === 'escalated' && prior?.attention
  const attention = escalate
    ? `Could not verify after ${failureCount} tries. ${reason}`
    : kept
      ? prior.attention
      : ''
  const record = {
    ...blankRecord(prior),
    lastChecked: prior?.lastChecked || '',
    nextCheckDue: addDaysYmd(today, retryDaysFor(event, today, context.config)),
    outcome: escalate || kept ? 'escalated' : 'failed',
    failureCount,
    lastFailure: reason,
    lastAttempt: today,
    failureSourceDate: sourceDate || '',
    escalatedOn: escalate ? today : prior?.escalatedOn || '',
    applied: null,
    attention,
  }
  return { record, kind: escalate || kept ? 'escalated' : 'failed', reason, repeated: false }
}

function editorAlreadySawConflict(event, prior, sourceDate) {
  const checked = ymd(event?.verifiedDate)
  if (!checked || !sourceDate || !prior?.escalatedOn) return false
  return checked >= sourceDate && checked >= prior.escalatedOn
}

function escalate(event, context, prior, candidate, changes, sourceDate) {
  if (editorAlreadySawConflict(event, prior, sourceDate)) {
    const interval = intervalDays(event, context.today, context.config)
    return {
      record: {
        ...blankRecord(null),
        lastChecked: ymd(event.verifiedDate),
        nextCheckDue: addDaysYmd(context.today, interval || 7),
        outcome: 'verified',
        failureCount: 0,
        lastFailure: '',
        lastAttempt: context.today,
        failureSourceDate: '',
        escalatedOn: '',
        applied: null,
        attention: '',
      },
      kind: 'verified',
      reason: 'Editor reviewed this official reading.',
      sourceUrl: candidate?.eventUrl || '',
    }
  }
  const reason = changes.join('; ')
  return {
    record: {
      ...blankRecord(prior),
      lastChecked: prior?.lastChecked || '',
      nextCheckDue: addDaysYmd(context.today, retryDaysFor(event, context.today, context.config)),
      outcome: 'escalated',
      failureCount: prior?.failureCount || 0,
      lastFailure: '',
      lastAttempt: context.today,
      failureSourceDate: sourceDate || '',
      escalatedOn: context.today,
      applied: null,
      attention: reason,
    },
    kind: 'escalated',
    reason,
    sourceUrl: candidate?.eventUrl || '',
  }
}

function succeed(event, context, candidate, sourceDate, applied, note) {
  const interval = intervalDays(event, context.today, context.config)
  const updated = applied && (applied.startTime || applied.endTime || applied.cost)
  return {
    record: {
      lastChecked: context.today,
      nextCheckDue: addDaysYmd(context.today, interval || 7),
      outcome: updated ? 'updated' : 'verified',
      failureCount: 0,
      lastFailure: '',
      lastAttempt: context.today,
      failureSourceDate: '',
      escalatedOn: '',
      applied: updated ? applied : null,
      attention: '',
    },
    kind: updated ? 'updated' : 'verified',
    reason: note || '',
    changes: note ? [note] : [],
    sourceUrl: candidate?.eventUrl || '',
  }
}

function usableCandidate(candidate) {
  if (!candidate?.title) return false
  if (candidate.reviewStatus === 'dismissed' && !candidate.alreadyOnPuddles) return false
  return true
}

function newest(candidates, context) {
  return [...candidates].sort((a, b) => {
    const dates = sourceDateFor(b, context).localeCompare(sourceDateFor(a, context))
    if (dates !== 0) return dates
    return String(b.lastChecked || '').localeCompare(String(a.lastChecked || ''))
  })[0]
}

export function assessEvent(event, candidates, context, prior) {
  const interval = intervalDays(event, context.today, context.config)
  const matched = []
  for (const candidate of candidates || []) {
    if (!usableCandidate(candidate)) continue
    const hits = findIdentityMatches(candidate, [event])
    if (hits.some((row) => row.id === event.id)) matched.push(candidate)
  }
  if (matched.length === 0) {
    return failure(event, context, prior, 'No official reading matched this listing.')
  }

  const sameDate = matched.filter((candidate) => candidate.date === event.date)
  let pool = sameDate
  let kind = 'same-date'
  if (sameDate.length === 0) {
    if (isSeriesEvent(event)) {
      const inside = matched.filter((candidate) => dateInRun(event, candidate.date))
      if (inside.length === 0) {
        const best = newest(matched, context)
        const sourceDate = sourceDateFor(best, context)
        if (!readingIsFresh(sourceDate, context.today, interval)) {
          return failure(event, context, prior, 'Official reading is older than this event’s check interval.', sourceDate)
        }
        return escalate(event, context, prior, best, [`date: ${event.date} → ${best.date}`], sourceDate)
      }
      pool = inside
      kind = 'series'
    } else if (matched.length > 1) {
      const best = newest(matched, context)
      const sourceDate = sourceDateFor(best, context)
      if (!readingIsFresh(sourceDate, context.today, interval)) {
        return failure(event, context, prior, 'Official reading is older than this event’s check interval.', sourceDate)
      }
      return escalate(event, context, prior, best, ['More than one official date matches this listing.'], sourceDate)
    } else {
      pool = matched
      kind = 'moved'
    }
  }

  const best = newest(pool, context)
  const sourceDate = sourceDateFor(best, context)
  if (!readingIsFresh(sourceDate, context.today, interval)) {
    return failure(event, context, prior, 'Official reading is older than this event’s check interval.', sourceDate)
  }
  if (kind === 'moved') {
    return escalate(event, context, prior, best, [`date: ${event.date} → ${best.date}`], sourceDate)
  }

  const { significant, routine } = splitChanges(event, best)
  const occurrenceDateOnly =
    kind === 'series' && significant.length > 0 && significant.every((change) => change.startsWith('date:'))
  if (significant.length > 0 && !occurrenceDateOnly) {
    return escalate(event, context, prior, best, significant, sourceDate)
  }
  if (kind === 'series') {
    return succeed(
      event,
      context,
      best,
      sourceDate,
      null,
      'Recurring listing matched an occurrence. The series row was left unchanged.',
    )
  }
  if (routine.length > 0) {
    const applied = {}
    if (routine.some((change) => change.startsWith('time:'))) {
      applied.startTime = best.startTime
      if (best.endTime) applied.endTime = best.endTime
    }
    if (routine.some((change) => change.startsWith('price:'))) applied.cost = best.cost
    return succeed(event, context, best, sourceDate, applied, routine.join('; '))
  }
  return succeed(event, context, best, sourceDate, null, '')
}

export function applyVerificationOverlay(event, state) {
  const row = state?.events?.[event?.id]
  if (!row) return event
  if (row.outcome !== 'verified' && row.outcome !== 'updated') return event
  if (!ymd(row.lastChecked)) return event
  if (event?.verifiedDate && event.verifiedDate > row.lastChecked) return event
  const next = { ...event, verifiedDate: row.lastChecked }
  if (row.outcome === 'updated' && row.applied) {
    if (row.applied.startTime) next.startTime = row.applied.startTime
    if (row.applied.endTime) next.endTime = row.applied.endTime
    if (row.applied.cost) next.cost = row.applied.cost
  }
  return next
}

function emptyReport() {
  return {
    checked: 0,
    verified: 0,
    updated: 0,
    escalated: 0,
    failed: 0,
    retriesScheduled: 0,
    skippedNotDue: 0,
    skippedPast: 0,
    skippedNotPublished: 0,
    seriesLeftUnchanged: 0,
    attention: [],
    failuresByReason: {},
    updates: [],
  }
}

export function runVerification({ events, candidates, state, today, catalogGeneratedAt, freshIds, freshOn, config }) {
  const context = {
    today,
    config,
    catalogGeneratedAt: catalogGeneratedAt || '',
    freshIds: freshIds instanceof Set ? freshIds : new Set(freshIds || []),
    freshOn: freshOn || '',
  }
  const priorEvents = state?.events || {}
  const nextEvents = { ...priorEvents }
  const report = emptyReport()

  for (const event of events || []) {
    if (!event?.id) continue
    if (event.status !== 'Published') {
      report.skippedNotPublished += 1
      continue
    }
    if (isPastForVerification(event, today)) {
      report.skippedPast += 1
      delete nextEvents[event.id]
      continue
    }
    const prior = priorEvents[event.id] || null
    if (!isCheckDue(event, prior, today, config)) {
      report.skippedNotDue += 1
      continue
    }
    report.checked += 1
    const decision = assessEvent(event, candidates, context, prior)
    nextEvents[event.id] = decision.record
    if (decision.kind === 'verified') {
      report.verified += 1
      if (decision.reason?.startsWith('Recurring listing')) report.seriesLeftUnchanged += 1
    } else if (decision.kind === 'updated') {
      report.updated += 1
      report.updates.push({
        id: event.id,
        title: event.title,
        date: event.date,
        city: event.city,
        changes: decision.reason,
      })
    } else if (decision.kind === 'escalated') {
      report.escalated += 1
      report.retriesScheduled += 1
      report.attention.push({
        id: event.id,
        title: event.title,
        date: event.date,
        city: event.city,
        reason: decision.record.attention || decision.reason,
      })
    } else {
      report.failed += 1
      report.retriesScheduled += 1
      report.failuresByReason[decision.reason] = (report.failuresByReason[decision.reason] || 0) + 1
    }
  }

  return {
    state: {
      version: 1,
      updatedAt: new Date().toISOString(),
      events: nextEvents,
    },
    report,
  }
}

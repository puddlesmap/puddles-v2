/** Risk-based freshness. Review does not use these intervals. */

export function daysBetweenYmd(from, to) {
  const start = Date.parse(`${from}T00:00:00Z`)
  const end = Date.parse(`${to}T00:00:00Z`)
  if (Number.isNaN(start) || Number.isNaN(end)) return 9999
  return Math.round((end - start) / 86400000)
}

export function addDaysYmd(ymd, days) {
  const [year, month, day] = String(ymd).split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function daysUntilEvent(event, today) {
  const end = event?.closingDate || event?.date || ''
  const start = event?.openingDate || event?.date || ''
  if (!end) return 9999
  if (end < today) return -1
  if (start <= today) return 0
  return daysBetweenYmd(today, start)
}

export function hasRegistrationSignal(event) {
  return /\b(regist(?:er|ration)|rsvp|sign[\s-]?up|tickets?)\b/i.test(
    `${event?.tips || ''} ${event?.description || ''} ${event?.cost || ''}`,
  )
}

export function intervalDays(event, today, config) {
  const days = daysUntilEvent(event, today)
  if (days < 0) return null
  const bands = [...(config?.intervals || [])].sort((a, b) => a.maxDaysUntil - b.maxDaysUntil)
  let every = config?.beyondHorizonEveryDays ?? 30
  for (const band of bands) {
    if (days <= band.maxDaysUntil) {
      every = band.everyDays
      break
    }
  }
  const tightenWithin = config?.registrationTightensWithinDays ?? 30
  const tightened = config?.registrationIntervalDays ?? 7
  if (days <= tightenWithin && every > tightened && hasRegistrationSignal(event)) {
    every = tightened
  }
  return every
}

/** Due when the stored next-check date has arrived, or the interval since the last stamp has elapsed. */
export function isCheckDue(event, prior, today, config) {
  if (daysUntilEvent(event, today) < 0) return false
  const stamps = [prior?.lastChecked, event?.verifiedDate].filter((value) => /^\d{4}-\d{2}-\d{2}/.test(value || ''))
  const stamp = stamps.sort().at(-1) || ''
  if (prior?.nextCheckDue) return prior.nextCheckDue <= today
  if (!stamp) return true
  const interval = intervalDays(event, today, config)
  if (!interval) return false
  return daysBetweenYmd(stamp, today) >= interval
}

export function retryDaysFor(event, today, config) {
  const days = daysUntilEvent(event, today)
  if (days >= 0 && days <= (config?.soonRetryWithinDays ?? 7)) return config?.soonRetryDays ?? 1
  return config?.retryDays ?? 3
}

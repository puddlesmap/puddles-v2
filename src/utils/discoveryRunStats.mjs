import { candidateReviewTiming, labelCandidate } from './discoveryInboxCore.mjs'
import { daysBetweenYmd } from './verificationSchedule.mjs'

export function discoveryWindowId(date, today) {
  if (!date) return 'beyond'
  const days = daysBetweenYmd(today, date)
  if (days < 0) return 'past'
  if (days <= 30) return '0-30'
  if (days <= 60) return '31-60'
  if (days <= 90) return '61-90'
  return 'beyond'
}

function emptyCounts() {
  return { new: 0, updated: 0, existing: 0, held: 0 }
}

function addLabel(bucket, candidate, label, today) {
  if (label.status === 'New') bucket.new += 1
  else if (label.status === 'Updated') bucket.updated += 1
  else bucket.existing += 1
  if (candidateReviewTiming(candidate, today) === 'later') bucket.held += 1
}

/** New / Updated / Existing for one scrape, plus the current approval queue. */
export function summarizeDiscoveryRun({ candidates, events, today, scrapedIds }) {
  const idSet = scrapedIds instanceof Set ? scrapedIds : new Set(scrapedIds || [])
  const totals = emptyCounts()
  const byWindow = {
    '0-30': emptyCounts(),
    '31-60': emptyCounts(),
    '61-90': emptyCounts(),
    past: emptyCounts(),
    beyond: emptyCounts(),
  }
  const awaitingApproval = []

  for (const candidate of candidates || []) {
    const label = labelCandidate(candidate, events || [])
    const scraped = idSet.size === 0 ? false : idSet.has(candidate.id)
    if (scraped) {
      const bucket = discoveryWindowId(candidate.date, today)
      addLabel(totals, candidate, label, today)
      addLabel(byWindow[bucket] || byWindow.beyond, candidate, label, today)
    }
    const pending = !candidate.reviewStatus || candidate.reviewStatus === 'pending'
    const stillAhead = !candidate.date || candidate.date >= today
    if (
      label.status === 'New' &&
      pending &&
      stillAhead &&
      !candidate.alreadyOnPuddles &&
      candidateReviewTiming(candidate, today) === 'review'
    ) {
      awaitingApproval.push({
        id: candidate.id,
        title: candidate.title,
        date: candidate.date,
        city: candidate.city,
      })
    }
  }

  awaitingApproval.sort((a, b) => `${a.date}${a.title}`.localeCompare(`${b.date}${b.title}`))
  return { totals, byWindow, awaitingApproval }
}

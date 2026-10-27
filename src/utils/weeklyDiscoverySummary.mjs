function line(label, value) {
  return `- ${label}: ${value}`
}

function windowLines(byWindow) {
  return ['0-30', '31-60', '61-90'].map((id) => {
    const row = byWindow?.[id] || { new: 0, updated: 0, existing: 0, held: 0 }
    return line(
      id,
      `${row.new} new, ${row.updated} updated, ${row.existing} already listed, ${row.held} held past the 60-day review window`,
    )
  })
}

function attentionGroup(items, pattern) {
  return (items || []).filter((item) => pattern.test(item.reason || ''))
}

/**
 * One weekly note. Maintenance stays separate from the decision queue.
 */
export function buildWeeklySummary({ today, maintenance, cadence, discovery, blocked }) {
  const attention = maintenance?.attention || []
  const cancellations = attentionGroup(attention, /cancel+ed|postponed/i)
  const unresolved = attention.filter((item) => /could not verify/i.test(item.reason || ''))
  const changes = attention.filter((item) => !cancellations.includes(item) && !unresolved.includes(item))
  const scanned = cadence?.scanned?.length ? cadence.scanned.join(', ') : 'none'
  const skipped = cadence?.skipped?.length ? cadence.skipped.join(', ') : 'none'
  const totals = discovery?.totals
  const failures = maintenance?.failuresByReason || {}
  const failureLines = Object.entries(failures)
  const approval = discovery?.awaitingApproval || []

  const lines = [
    `# Weekly discovery summary (${today})`,
    '',
    '## A. Event maintenance',
    line('Events checked', maintenance?.checked ?? 0),
    line('Automatically verified', maintenance?.verified ?? 0),
    line('Updated', maintenance?.updated ?? 0),
    line('Events archived by this run', 0),
    line('Past events skipped', maintenance?.skippedPast ?? 0),
    line('Not due this run', maintenance?.skippedNotDue ?? 0),
    line('Verification failures', maintenance?.failed ?? 0),
    line('Retries scheduled', maintenance?.retriesScheduled ?? 0),
  ]

  if (failureLines.length > 0) {
    lines.push('', 'Failures by reason:')
    for (const [reason, count] of failureLines) lines.push(line(reason, count))
  }

  lines.push(
    '',
    '## B. Discovery',
    line('Horizon fetched (days)', cadence?.days ?? 'not recorded'),
    line('Windows scanned', scanned),
    line('Windows skipped', skipped),
    line('Full 90-day run', cadence?.full ? 'yes' : 'no'),
  )

  if (totals) {
    lines.push(
      line('New events discovered', totals.new),
      line('Existing events updated', totals.updated),
      line('Duplicates skipped', totals.existing),
      line('Held until the public review window', totals.held),
      '',
      'By discovery window:',
      ...windowLines(discovery.byWindow),
    )
  } else {
    lines.push('', 'No discovery scrape was recorded for this run.')
  }

  lines.push(
    '',
    '## C. Needs my attention',
    line('New events awaiting approval', approval.length),
    line('Significant changes', changes.length),
    line('Cancellations', cancellations.length),
    line('Unresolved verification conflicts', unresolved.length),
  )

  const decisionItems = [
    ...approval.map((item) => `New · ${item.date || 'date unset'} · ${item.title} · ${item.city || ''}`),
    ...cancellations.map((item) => `Cancellation · ${item.date} · ${item.title} · ${item.reason}`),
    ...changes.map((item) => `Change · ${item.date} · ${item.title} · ${item.reason}`),
    ...unresolved.map((item) => `Unresolved · ${item.date} · ${item.title} · ${item.reason}`),
  ]
  if (decisionItems.length === 0) {
    lines.push('', 'Nothing is waiting on an editorial decision from this run.')
  } else {
    lines.push('')
    for (const item of decisionItems.slice(0, 40)) lines.push(`- ${item}`)
    if (decisionItems.length > 40) lines.push(`- … +${decisionItems.length - 40} more`)
  }

  if (blocked?.length) {
    lines.push('', '## Blocked', ...blocked.map((item) => `- ${item}`))
  }

  lines.push('')
  return lines.join('\n')
}

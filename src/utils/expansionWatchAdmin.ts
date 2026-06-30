import type { ExpansionWatchSourceContext } from '../types/expansionWatch'
import type { SheetSubmission } from '../types/submission'

const SOURCE_LABELS: Record<ExpansionWatchSourceContext, string> = {
  empty_state: 'Empty browse results',
  feedback_add_neighborhood: 'Share idea: add neighborhood',
  footer_about: 'About / footer',
  browse_inline_card: 'Browse feed card',
}

export function isExpansionWatchSubmission(submission: SheetSubmission): boolean {
  return submission.submissionType.trim().toLowerCase() === 'expansionwatch'
}

export function expansionWatchSourceLabel(source: string): string {
  const key = source.trim() as ExpansionWatchSourceContext
  return (SOURCE_LABELS[key] ?? source) || '—'
}

export function expansionWatchRequestedLocation(submission: SheetSubmission): string {
  return (
    submission.requestedLocation?.trim() ||
    submission.locationName?.trim() ||
    submission.city?.trim() ||
    ''
  )
}

export function expansionWatchSourceContext(submission: SheetSubmission): string {
  return submission.sourceContext?.trim() || submission.additionalInfo?.trim() || ''
}

export function parseExpansionWatchMetadata(internalNotes: string): Record<string, unknown> | null {
  const trimmed = internalNotes.trim()
  if (!trimmed.startsWith('{')) return null

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

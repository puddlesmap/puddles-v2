import type { SheetSubmission } from '../../types/submission'
import {
  expansionWatchRequestedLocation,
  expansionWatchSourceContext,
  expansionWatchSourceLabel,
  parseExpansionWatchMetadata,
} from '../../utils/expansionWatchAdmin'
import { DetailRow, DetailSection } from './AdminDetailGrid'

function formatSelectedFilters(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const filters = value as Record<string, unknown>
  const parts = [
    filters.city ? `City: ${String(filters.city)}` : '',
    filters.day ? `Day: ${String(filters.day)}` : '',
    filters.time ? `Time: ${String(filters.time)}` : '',
    filters.age ? `Age: ${String(filters.age)}` : '',
    Array.isArray(filters.types) && filters.types.length > 0
      ? `Types: ${filters.types.join(', ')}`
      : '',
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : null
}

export function AdminExpansionWatchDetailPanel({ submission }: { submission: SheetSubmission }) {
  const source = expansionWatchSourceContext(submission)
  const metadata = parseExpansionWatchMetadata(submission.internalNotes)
  const selectedFilters = metadata?.selected_filters

  return (
    <div className="admin-table-expand-panel" aria-label="Expansion Watch details">
      <DetailSection title="Waitlist sign-up">
        <DetailRow label="Email" value={submission.submittedByEmail} />
        <DetailRow label="Requested location" value={expansionWatchRequestedLocation(submission)} />
        <DetailRow label="Source" value={expansionWatchSourceLabel(source)} />
        <DetailRow
          label="Browse city filter"
          value={submission.selectedCity?.trim() || (metadata?.selected_city as string) || null}
        />
        <DetailRow label="Selected filters" value={formatSelectedFilters(selectedFilters)} />
      </DetailSection>
    </div>
  )
}

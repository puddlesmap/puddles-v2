import type { AdminEventRecord } from '../../types/admin'
import { formatEventDate } from '../../utils/dates'
import { DetailDescription, DetailRow, DetailSection } from './AdminDetailGrid'

function formatTimeRange(startTime: string, endTime: string): string | null {
  if (!startTime && !endTime) return null
  if (startTime && endTime) return `${startTime} – ${endTime}`
  return startTime || endTime || null
}

function formatVerifiedDate(dateStr: string): string {
  if (!dateStr?.trim()) return '—'
  const d = new Date(`${dateStr}T12:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function AdminEventDetailPanel({ event }: { event: AdminEventRecord }) {
  return (
    <div className="admin-table-expand-panel" aria-label="Event details">
      <DetailSection title="Schedule & location">
        <DetailRow label="Date" value={formatEventDate(event.date)} />
        <DetailRow label="Time" value={formatTimeRange(event.startTime, event.endTime)} />
        <DetailRow label="Venue" value={event.venue} />
        <DetailRow label="Address" value={event.address} />
        <DetailRow label="City" value={event.city} />
      </DetailSection>

      <DetailSection title="Details">
        <DetailRow label="Ages" value={event.ageRange} />
        <DetailRow label="Cost" value={event.cost} />
        <DetailRow
          label="Types"
          value={event.types.length > 0 ? event.types.join(', ') : undefined}
        />
        <DetailRow label="Last checked" value={formatVerifiedDate(event.verifiedDate)} />
        <DetailRow label="Event URL" value={event.eventUrl !== '#' ? event.eventUrl : undefined} />
        <DetailRow label="Event ID" value={event.id} />
      </DetailSection>

      <DetailDescription label="Description" value={event.description} />
    </div>
  )
}

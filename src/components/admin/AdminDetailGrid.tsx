import { useState, type ReactNode } from 'react'

export function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  const text = value?.trim()
  if (!text) return null
  return (
    <div className="admin-detail-row">
      <dt className="admin-detail-label">{label}</dt>
      <dd className="admin-detail-value">{text}</dd>
    </div>
  )
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="admin-detail-section">
      <h4 className="admin-detail-section-title">{title}</h4>
      <dl className="admin-detail-grid">{children}</dl>
    </div>
  )
}

export function DetailDescription({
  label,
  value,
  maxLength = 320,
}: {
  label: string
  value: string | null | undefined
  maxLength?: number
}) {
  const text = value?.trim()
  if (!text) return null

  if (text.length <= maxLength) {
    return (
      <div className="admin-record-description">
        <dt className="admin-detail-label">{label}</dt>
        <dd className="admin-detail-value">{text}</dd>
      </div>
    )
  }

  return <ExpandableDescription label={label} text={text} maxLength={maxLength} />
}

function ExpandableDescription({
  label,
  text,
  maxLength,
}: {
  label: string
  text: string
  maxLength: number
}) {
  const [expanded, setExpanded] = useState(false)
  const display = expanded ? text : `${text.slice(0, maxLength)}…`

  return (
    <div className="admin-record-description">
      <dt className="admin-detail-label">{label}</dt>
      <dd className="admin-detail-value">
        {display}
        <button
          type="button"
          className="admin-record-expand-btn"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      </dd>
    </div>
  )
}

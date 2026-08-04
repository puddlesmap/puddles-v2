import { Fragment, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { DiscoveryCandidate, DiscoveryEditableFields } from '../../types/discovery'
import { formatEventDate, formatEventTimeRange } from '../../utils/dates'
import { editableFieldsFromCandidate } from '../../utils/discoveryReview'
import { latestApprovedOnForCandidate } from '../../utils/discoveryMatchEvents'
import { AdminDiscoveryDetailPanel } from './AdminDiscoveryDetail'

const COLUMN_COUNT = 9
const DRAG_THRESHOLD_PX = 6

export type DiscoverySortKey =
  | 'when'
  | 'title'
  | 'venue'
  | 'ages'
  | 'tips'
  | 'status'
  | 'lastChecked'

type SortDir = 'asc' | 'desc'

interface AdminDiscoveryTableProps {
  candidates: DiscoveryCandidate[]
  selectedId: string | null
  busyId: string | null
  bulkBusy?: boolean
  onSelect: (candidate: DiscoveryCandidate) => void
  onSaveEdits: (candidate: DiscoveryCandidate, edits: DiscoveryEditableFields) => void
  onApprove: (candidate: DiscoveryCandidate, edits: DiscoveryEditableFields) => void
  onBulkApprove: (candidates: DiscoveryCandidate[]) => void
  onDismiss: (candidate: DiscoveryCandidate) => void
  onRestore: (candidate: DiscoveryCandidate) => void
}

const SORTABLE_COLUMNS: { key: DiscoverySortKey; label: string; className?: string }[] = [
  { key: 'when', label: 'When', className: 'admin-discovery-col-when' },
  { key: 'title', label: 'Title', className: 'admin-discovery-col-title' },
  { key: 'venue', label: 'Venue', className: 'admin-discovery-col-venue' },
  { key: 'ages', label: 'Ages', className: 'admin-discovery-col-ages' },
  { key: 'tips', label: 'Tips', className: 'admin-discovery-col-tips' },
  { key: 'status', label: 'Status', className: 'admin-discovery-col-status' },
  { key: 'lastChecked', label: 'Approved on', className: 'admin-discovery-col-checked' },
]

function StatusBadge({ candidate }: { candidate: DiscoveryCandidate }) {
  if (candidate.reviewStatus === 'approved') {
    return (
      <span className="admin-badge admin-badge-yes" title="Draft is on the Events sheet — Refresh Events, then Publish when ready">
        Ready
      </span>
    )
  }
  if (candidate.reviewStatus === 'dismissed') {
    return <span className="admin-badge admin-badge-no">Dismissed</span>
  }
  if (candidate.alreadyOnPuddles) {
    return <span className="admin-badge admin-badge-status">On site</span>
  }
  return <span className="admin-badge admin-badge-yes">New</span>
}

/** Format approve stamp for the Discovery table (same value as site verifiedDate). */
function formatApprovedOn(dateStr: string): string {
  if (!dateStr?.trim()) return '—'
  const d = new Date(`${dateStr}T12:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function statusSortValue(candidate: DiscoveryCandidate): string {
  if (candidate.reviewStatus === 'approved') return '3-approved'
  if (candidate.reviewStatus === 'dismissed') return '4-dismissed'
  if (candidate.alreadyOnPuddles) return '2-onsite'
  return '1-new'
}

function compareCandidates(
  a: DiscoveryCandidate,
  b: DiscoveryCandidate,
  key: DiscoverySortKey,
  dir: SortDir,
): number {
  let cmp = 0
  switch (key) {
    case 'when':
      cmp = `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)
      break
    case 'title':
      cmp = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
      break
    case 'venue':
      cmp = `${a.venue} ${a.room}`.localeCompare(`${b.venue} ${b.room}`, undefined, {
        sensitivity: 'base',
      })
      break
    case 'ages':
      cmp = (a.ageRange || '').localeCompare(b.ageRange || '', undefined, { sensitivity: 'base' })
      break
    case 'tips':
      cmp = (a.tips || '').localeCompare(b.tips || '', undefined, { sensitivity: 'base' })
      break
    case 'status':
      cmp = statusSortValue(a).localeCompare(statusSortValue(b))
      break
    case 'lastChecked':
      cmp = (a.lastChecked || '').localeCompare(b.lastChecked || '')
      break
    default:
      cmp = 0
  }
  if (cmp === 0) {
    cmp = `${a.date} ${a.startTime} ${a.title}`.localeCompare(`${b.date} ${b.startTime} ${b.title}`)
  }
  return dir === 'asc' ? cmp : -cmp
}

function SortHeader({
  label,
  active,
  dir,
  className,
  onClick,
}: {
  label: string
  active: boolean
  dir: SortDir
  className?: string
  onClick: () => void
}) {
  const indicator = active ? (dir === 'asc' ? ' ↑' : ' ↓') : ''
  return (
    <th
      className={className}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button type="button" className="admin-sort-header" onClick={onClick}>
        {label}
        <span className="admin-sort-header__indicator" aria-hidden="true">
          {indicator || ' ↕'}
        </span>
      </button>
    </th>
  )
}

function idsInRange(sorted: DiscoveryCandidate[], from: number, to: number): string[] {
  const start = Math.min(from, to)
  const end = Math.max(from, to)
  return sorted.slice(start, end + 1).map((row) => row.id)
}

export function AdminDiscoveryTable({
  candidates,
  selectedId,
  busyId,
  bulkBusy = false,
  onSelect,
  onSaveEdits,
  onApprove,
  onBulkApprove,
  onDismiss,
  onRestore,
}: AdminDiscoveryTableProps) {
  const [sortKey, setSortKey] = useState<DiscoverySortKey>('when')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [multiIds, setMultiIds] = useState<string[]>([])
  const dragRef = useRef<{
    startIndex: number
    startX: number
    startY: number
    moved: boolean
    pointerId: number
  } | null>(null)

  const sorted = useMemo(
    () => [...candidates].sort((a, b) => compareCandidates(a, b, sortKey, sortDir)),
    [candidates, sortKey, sortDir],
  )

  const multiSet = useMemo(() => new Set(multiIds), [multiIds])
  const multiCandidates = useMemo(
    () => sorted.filter((row) => multiSet.has(row.id)),
    [sorted, multiSet],
  )

  useEffect(() => {
    function onPointerUp(event: PointerEvent) {
      const drag = dragRef.current
      if (!drag) return
      if (drag.pointerId !== event.pointerId) return
      dragRef.current = null
      // Tap (no drag): expand/collapse details. Do not treat as multi-select.
      if (!drag.moved) {
        const candidate = sorted[drag.startIndex]
        if (candidate) {
          setMultiIds((current) => (current.length <= 1 ? [] : current))
          onSelect(candidate)
        }
      }
    }
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [onSelect, sorted])

  function handleSort(key: DiscoverySortKey) {
    if (sortKey === key) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir('asc')
  }

  function beginDrag(index: number, event: ReactPointerEvent) {
    const target = event.target as HTMLElement | null
    if (target?.closest('button, a, input, textarea, select, label')) return
    dragRef.current = {
      startIndex: index,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      pointerId: event.pointerId,
    }
    // Do not select yet — wait until the pointer actually moves (drag).
  }

  function extendDrag(index: number, event: ReactPointerEvent) {
    const drag = dragRef.current
    if (!drag) return
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY)
    if (!drag.moved && distance < DRAG_THRESHOLD_PX) return
    if (!drag.moved) {
      drag.moved = true
      setMultiIds(idsInRange(sorted, drag.startIndex, index))
      return
    }
    setMultiIds(idsInRange(sorted, drag.startIndex, index))
  }

  function clearMulti() {
    setMultiIds([])
  }

  function handleBulkApproveClick() {
    const targets = multiCandidates.filter((row) => row.reviewStatus === 'pending')
    if (targets.length === 0) {
      window.alert('No pending events in the selection to approve.')
      return
    }
    const already = targets.filter((row) => row.alreadyOnPuddles).length
    const ok = window.confirm(
      [
        `Approve ${targets.length} event${targets.length === 1 ? '' : 's'}?`,
        `Last checked / Verified date will be set to today.`,
        already > 0
          ? `${already} already on Puddles — those update the existing row (no duplicate Draft).`
          : null,
      ]
        .filter(Boolean)
        .join('\n\n'),
    )
    if (!ok) return
    onBulkApprove(targets)
    clearMulti()
  }

  if (candidates.length === 0) {
    return (
      <div className="admin-empty">
        <p className="font-medium text-charcoal">No discovery candidates in this view.</p>
        <p className="mt-1 text-sm text-muted">
          Run <code>npm run discover:palo-alto</code> to refresh the queue, or switch filters.
        </p>
      </div>
    )
  }

  return (
    <div className="admin-discovery-table-shell">
      {multiIds.length > 0 ? (
        <div className="admin-discovery-bulk-bar" role="status">
          <span className="admin-discovery-bulk-count">
            {multiIds.length} selected
            <span className="admin-discovery-bulk-hint"> — checkboxes or drag to select</span>
          </span>
          <div className="admin-discovery-bulk-actions">
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={bulkBusy}
              onClick={handleBulkApproveClick}
            >
              {bulkBusy ? 'Approving…' : 'Approve'}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-text"
              disabled={bulkBusy}
              onClick={clearMulti}
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <p className="admin-discovery-drag-hint">
          Tip: use checkboxes (or drag across rows) to select several, then Approve.
        </p>
      )}

      <div className="admin-table-wrap admin-discovery-table-wrap">
        <table className="admin-table admin-discovery-table">
          <colgroup>
            <col className="admin-col-check-col" />
            <col />
            <col />
            <col />
            <col />
            <col />
            <col />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th className="admin-col-check" scope="col">
                <label className="admin-check">
                  <span className="sr-only">Select all visible candidates</span>
                  <input
                    type="checkbox"
                    checked={sorted.length > 0 && sorted.every((row) => multiSet.has(row.id))}
                    ref={(el) => {
                      if (!el) return
                      const some = sorted.some((row) => multiSet.has(row.id))
                      const all = sorted.length > 0 && sorted.every((row) => multiSet.has(row.id))
                      el.indeterminate = some && !all
                    }}
                    disabled={bulkBusy}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setMultiIds(sorted.map((row) => row.id))
                      } else {
                        clearMulti()
                      }
                    }}
                  />
                </label>
              </th>
              {SORTABLE_COLUMNS.map((column) => (
                <SortHeader
                  key={column.key}
                  label={column.label}
                  className={column.className}
                  active={sortKey === column.key}
                  dir={sortDir}
                  onClick={() => handleSort(column.key)}
                />
              ))}
              <th
                aria-label="Actions"
                className="admin-discovery-sticky-actions admin-discovery-col-actions"
              />
            </tr>
          </thead>
          <tbody>
            {sorted.map((candidate, index) => {
              const isExpanded = selectedId === candidate.id
              const isMulti = multiSet.has(candidate.id)
              const isBusy = busyId === candidate.id
              const canApprove = candidate.reviewStatus === 'pending'
              const approvedOnRaw = latestApprovedOnForCandidate(candidate)
              const approvedOn = formatApprovedOn(approvedOnRaw)
              return (
                <Fragment key={candidate.id}>
                  <tr
                    className={[
                      'admin-table-row-clickable',
                      'admin-discovery-row',
                      isExpanded ? 'is-selected' : '',
                      isMulti ? 'is-multi-selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onPointerDown={(event) => beginDrag(index, event)}
                    onPointerEnter={(event) => {
                      if (event.buttons === 1) extendDrag(index, event)
                    }}
                    onPointerMove={(event) => {
                      if (event.buttons === 1) extendDrag(index, event)
                    }}
                  >
                    <td
                      className="admin-col-check"
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <label className="admin-check">
                        <span className="sr-only">Select {candidate.title}</span>
                        <input
                          type="checkbox"
                          checked={isMulti}
                          disabled={bulkBusy}
                          onChange={() => {
                            setMultiIds((current) =>
                              current.includes(candidate.id)
                                ? current.filter((id) => id !== candidate.id)
                                : [...current, candidate.id],
                            )
                          }}
                        />
                      </label>
                    </td>
                    <td className="admin-discovery-col-when">
                      <div>{formatEventDate(candidate.date)}</div>
                      <div className="text-xs text-muted admin-discovery-time">
                        {formatEventTimeRange(candidate.startTime, candidate.endTime)}
                      </div>
                    </td>
                    <td className="admin-discovery-col-title">
                      <div className="font-medium text-charcoal admin-discovery-title-text">
                        {candidate.title}
                      </div>
                      <div className="text-xs text-muted">
                        {(candidate.types || []).join(', ') || '—'}
                      </div>
                    </td>
                    <td className="admin-discovery-col-venue">
                      <div>{candidate.venue || '—'}</div>
                      {candidate.room ? (
                        <div className="text-xs text-muted">{candidate.room}</div>
                      ) : null}
                    </td>
                    <td className="admin-discovery-col-ages">{candidate.ageRange || '—'}</td>
                    <td className="admin-discovery-col-tips">
                      <div className="admin-discovery-tips-preview">
                        {candidate.tips?.trim() ? candidate.tips.split('\n')[0] : '—'}
                      </div>
                    </td>
                    <td className="admin-discovery-col-status">
                      <StatusBadge candidate={candidate} />
                    </td>
                    <td
                      className="admin-discovery-col-checked"
                      title={
                        approvedOnRaw
                          ? candidate.reviewStatus === 'approved'
                            ? `Approved on ${approvedOnRaw} — Verified / Last checked on Puddles`
                            : `Last verified ${approvedOnRaw} on Puddles (Approve to refresh to today)`
                          : 'Approve to stamp today’s date as Verified on Puddles'
                      }
                    >
                      <span className="text-sm text-muted">
                        {approvedOn === '—' ? '—' : approvedOn}
                      </span>
                    </td>
                    <td className="admin-discovery-sticky-actions admin-discovery-col-actions">
                      {canApprove ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn-primary"
                          disabled={isBusy || bulkBusy}
                          onClick={(e) => {
                            e.stopPropagation()
                            onApprove(candidate, editableFieldsFromCandidate(candidate))
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          {isBusy ? '…' : 'Approve'}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                  {isExpanded ? (
                    <tr className="admin-table-expand-row">
                      <td colSpan={COLUMN_COUNT}>
                        <AdminDiscoveryDetailPanel
                          candidate={candidate}
                          busy={isBusy || bulkBusy}
                          onSaveEdits={(edits) => onSaveEdits(candidate, edits)}
                          onApprove={(edits) => onApprove(candidate, edits)}
                          onDismiss={() => onDismiss(candidate)}
                          onRestore={() => onRestore(candidate)}
                        />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import {
  ALL_SUBMISSIONS,
  filterSubmissions,
  submissionWasUpdated,
  summarizeSubmissionCounts,
  updateSubmissionById,
} from '../../data/submissions'
import { AdminSubmissionsTable } from '../../components/admin/AdminSubmissionsTable'
import { AdminSyncBar } from '../../components/admin/AdminSyncBar'
import {
  SOLVED_SUBMISSION_STATUS,
  SUBMISSION_STATUSES,
  type SheetSubmission,
  type SubmissionStatusFilter,
  submissionIdsMatch,
  submissionStatusLabel,
} from '../../types/submission'
import { downloadRowsAsCsv } from '../../utils/exportCsv'
import { SUBMISSION_EXPORT_COLUMNS, exportFilename } from '../../utils/adminExport'
import { callSheetApi } from '../../utils/sheetApi'
import {
  loadCachedSubmissionsRefresh,
  persistAdminSubmissionsCache,
  refreshSubmissionsFromSheet,
} from '../../utils/submissionSync'

const TYPE_FILTERS = ['all', 'Event', 'Idea'] as const

type ActionMessage = { type: 'success' | 'error'; text: string }

function getInitialCache() {
  return loadCachedSubmissionsRefresh()
}

function getInitialSubmissions(): SheetSubmission[] {
  return getInitialCache()?.submissions ?? ALL_SUBMISSIONS
}

function getInitialHiddenIds(): string[] {
  return getInitialCache()?.hiddenSubmissionIds ?? []
}

export function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SheetSubmission[]>(getInitialSubmissions)
  const [hiddenSubmissionIds, setHiddenSubmissionIds] = useState<string[]>(getInitialHiddenIds)
  const [adminRefreshedAt, setAdminRefreshedAt] = useState<string | null>(() => {
    return getInitialCache()?.refreshedAt ?? null
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [status, setStatus] = useState<SubmissionStatusFilter>('all')
  const [submissionType, setSubmissionType] = useState<(typeof TYPE_FILTERS)[number]>('all')
  const [search, setSearch] = useState('')
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<ActionMessage | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const counts = useMemo(
    () => summarizeSubmissionCounts(submissions, hiddenSubmissionIds),
    [submissions, hiddenSubmissionIds],
  )

  const filteredSubmissions = useMemo(
    () =>
      filterSubmissions(submissions, {
        status,
        submissionType,
        search,
        hiddenSubmissionIds,
      }),
    [submissions, status, submissionType, search, hiddenSubmissionIds],
  )

  function persistState(
    nextSubmissions: SheetSubmission[],
    nextHiddenIds: string[] = hiddenSubmissionIds,
  ) {
    persistAdminSubmissionsCache(nextSubmissions, nextHiddenIds, adminRefreshedAt)
  }

  async function handleRefresh() {
    setIsRefreshing(true)
    setRefreshError(null)
    setActionMessage(null)
    try {
      const result = await refreshSubmissionsFromSheet()
      setSubmissions(result.submissions)
      setAdminRefreshedAt(result.refreshedAt)
      persistAdminSubmissionsCache(result.submissions, hiddenSubmissionIds, result.refreshedAt)
    } catch (error) {
      setRefreshError(
        error instanceof Error
          ? `${error.message}. Check that the sheet is shared as Viewer, or run npm run sync-submissions locally.`
          : 'Could not refresh submissions from Google Sheet.',
      )
    } finally {
      setIsRefreshing(false)
    }
  }

  async function handleStatusChange(submission: SheetSubmission, nextStatus: string) {
    if (nextStatus === submission.status) return
    const targetId = submission.id.trim()
    setBusyId(submission.id)
    setActionMessage(null)
    try {
      await callSheetApi({
        action: 'updateSubmissionStatus',
        payload: { id: submission.id, status: nextStatus },
      })
      setSubmissions((current) => {
        const next = updateSubmissionById(current, targetId, { status: nextStatus })
        persistState(next)
        return next
      })
      setActionMessage({
        type: 'success',
        text: `Updated status to “${submissionStatusLabel(nextStatus)}”.`,
      })
    } catch (error) {
      setActionMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not update status.',
      })
    } finally {
      setBusyId(null)
    }
  }

  async function handlePromote(submission: SheetSubmission) {
    const targetId = submission.id.trim()
    setBusyId(submission.id)
    setActionMessage(null)
    try {
      const result = await callSheetApi<{ eventId: string; status: string }>({
        action: 'promoteSubmission',
        payload: { id: submission.id },
      })
      setSubmissions((current) => {
        const next = updateSubmissionById(current, targetId, {
          status: result.status,
          convertedEventId: result.eventId,
        })
        persistState(next)
        return next
      })
      setActionMessage({
        type: 'success',
        text: `Sent to Events tab as Draft (Event ID: ${result.eventId}).`,
      })
    } catch (error) {
      setActionMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not send to Events tab.',
      })
    } finally {
      setBusyId(null)
    }
  }

  async function handleSolved(submission: SheetSubmission) {
    const confirmed = window.confirm(
      `Mark “${submission.eventName || 'this submission'}” as solved?\n\nIt will be archived in the Google Sheet and removed from your review queue.`,
    )
    if (!confirmed) return

    const targetId = submission.id.trim()
    const previousStatus = submission.status
    setBusyId(submission.id)
    setActionMessage(null)

    let optimisticSubmissions = submissions
    setSubmissions((current) => {
      const next = updateSubmissionById(current, targetId, {
        status: SOLVED_SUBMISSION_STATUS,
      })
      if (!submissionWasUpdated(current, targetId, next)) {
        return current
      }
      optimisticSubmissions = next
      persistState(next)
      return next
    })

    if (!submissionWasUpdated(submissions, targetId, optimisticSubmissions)) {
      setBusyId(null)
      setActionMessage({
        type: 'error',
        text: 'Could not find this submission in the dashboard. Try refreshing submissions.',
      })
      return
    }

    setSelectedId((current) => (submissionIdsMatch(current ?? '', targetId) ? null : current))

    try {
      await callSheetApi({
        action: 'updateSubmissionStatus',
        payload: { id: submission.id, status: SOLVED_SUBMISSION_STATUS },
      })
      setActionMessage({
        type: 'success',
        text: 'Marked as solved and removed from your review queue.',
      })
    } catch (error) {
      setSubmissions((current) => {
        const next = updateSubmissionById(current, targetId, { status: previousStatus })
        persistState(next)
        return next
      })
      setActionMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not mark submission as solved.',
      })
    } finally {
      setBusyId(null)
    }
  }

  function handleDelete(submission: SheetSubmission) {
    const confirmed = window.confirm(
      `Remove “${submission.eventName || 'this submission'}” from the dashboard?\n\nThe row stays in the Google Sheet unchanged.`,
    )
    if (!confirmed) return

    const targetId = submission.id.trim()
    setActionMessage(null)

    setHiddenSubmissionIds((current) => {
      if (current.some((id) => submissionIdsMatch(id, targetId))) return current
      const next = [...current, targetId]
      persistState(submissions, next)
      return next
    })
    setSelectedId((current) => (submissionIdsMatch(current ?? '', targetId) ? null : current))
    setActionMessage({
      type: 'success',
      text: 'Removed from dashboard. Still saved in the Google Sheet.',
    })
  }

  function handleRestore(submission: SheetSubmission) {
    const targetId = submission.id.trim()
    setHiddenSubmissionIds((current) => {
      const next = current.filter((id) => !submissionIdsMatch(id, targetId))
      persistState(submissions, next)
      return next
    })
    setSelectedId(null)
    setActionMessage({
      type: 'success',
      text: 'Restored to the review queue.',
    })
  }

  function handleExportCsv() {
    const ok = downloadRowsAsCsv(
      exportFilename('submissions', filteredSubmissions.length),
      filteredSubmissions,
      SUBMISSION_EXPORT_COLUMNS,
    )
    setExportMessage(
      ok
        ? `Exported ${filteredSubmissions.length} filtered submissions.`
        : 'Nothing to export — adjust filters or refresh data.',
    )
  }

  return (
    <>
      <AdminSyncBar
        adminRefreshedAt={adminRefreshedAt}
        isRefreshing={isRefreshing}
        refreshError={refreshError}
        onRefresh={handleRefresh}
        refreshLabel="Refresh submissions"
      />

      <section className="admin-sync-bar" aria-label="Submissions overview">
        <p className="admin-submissions-intro">
          Share form submissions land in the Google Sheet <strong>Submissions</strong> tab. Review
          here, set status, then send approved activities to the <strong>Events</strong> tab as{' '}
          <strong>Draft</strong>. Publish on the Events tab when ready.
        </p>
        <div className="admin-stat-grid admin-stat-grid-compact">
          <div className="admin-stat-card admin-stat-card-static">
            <div className="admin-stat-value">{counts.total}</div>
            <div className="admin-stat-label">Total</div>
          </div>
          <div className="admin-stat-card admin-stat-card-static">
            <div className="admin-stat-value">{counts.new}</div>
            <div className="admin-stat-label">New</div>
          </div>
          <div className="admin-stat-card admin-stat-card-static">
            <div className="admin-stat-value">{counts.needsReview}</div>
            <div className="admin-stat-label">Needs review</div>
          </div>
          <div className="admin-stat-card admin-stat-card-static">
            <div className="admin-stat-value">{counts.approved}</div>
            <div className="admin-stat-label">Approved</div>
          </div>
          <div className="admin-stat-card admin-stat-card-static">
            <div className="admin-stat-value">{counts.addedToSheet}</div>
            <div className="admin-stat-label">Added to sheet</div>
          </div>
          <div className="admin-stat-card admin-stat-card-static">
            <div className="admin-stat-value">{counts.solved}</div>
            <div className="admin-stat-label">Solved</div>
          </div>
          <div className="admin-stat-card admin-stat-card-static">
            <div className="admin-stat-value">{counts.hidden}</div>
            <div className="admin-stat-label">Hidden</div>
          </div>
        </div>
        {actionMessage && (
          <p
            className={`admin-action-alert admin-action-alert--${actionMessage.type}`}
            role="status"
          >
            {actionMessage.text}
          </p>
        )}
      </section>

      <section className="admin-events-section">
        <div className="admin-events-header">
          <div>
            <h2 className="font-display text-lg text-charcoal">Community submissions</h2>
            <p className="mt-1 text-sm text-muted">
              Click a row to expand full details. <strong>Solved</strong> archives in the sheet and
              removes from your queue. <strong>Delete</strong> hides from this dashboard only.
            </p>
          </div>
          <div className="admin-events-header-actions">
            <div className="text-sm text-muted">{filteredSubmissions.length} shown</div>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={handleExportCsv}>
              Export filtered CSV
            </button>
          </div>
        </div>

        {exportMessage && <p className="admin-export-message">{exportMessage}</p>}

        <div className="admin-filters">
          <label className="admin-filter-field">
            <span className="admin-filter-label">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SubmissionStatusFilter)}
              className="input-field input-field-select admin-filter-select"
            >
              <option value="all">Active queue</option>
              {SUBMISSION_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {submissionStatusLabel(option)}
                </option>
              ))}
              <option value="hidden">Hidden (dashboard only)</option>
            </select>
          </label>

          <label className="admin-filter-field">
            <span className="admin-filter-label">Type</span>
            <select
              value={submissionType}
              onChange={(e) => setSubmissionType(e.target.value as typeof submissionType)}
              className="input-field input-field-select admin-filter-select"
            >
              {TYPE_FILTERS.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All types' : option}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-filter-field admin-filter-grow">
            <span className="sr-only">Search submissions</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, location, email…"
              className="input-field"
            />
          </label>
        </div>

        <AdminSubmissionsTable
          submissions={filteredSubmissions}
          busyId={busyId}
          selectedId={selectedId}
          showHiddenActions={status === 'hidden'}
          onSelect={(submission) =>
            setSelectedId((current) => (current === submission.id ? null : submission.id))
          }
          onStatusChange={handleStatusChange}
          onPromote={handlePromote}
          onSolved={handleSolved}
          onDelete={handleDelete}
          onRestore={handleRestore}
        />
      </section>
    </>
  )
}

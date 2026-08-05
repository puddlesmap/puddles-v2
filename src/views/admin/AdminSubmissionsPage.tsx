import { useEffect, useMemo, useState } from 'react'
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
import { pacificTodayYmd } from '../../utils/discoveryReview'
import { publishEventsToSite } from '../../utils/publishEvents'
import { promoteSubmissionLocally } from '../../utils/submissionPromoteLocal'
import {
  patchSubmissionsInAdminStore,
  refreshSubmissionsFromAdminStore,
} from '../../utils/submissionsApi'
import {
  loadCachedSubmissionsRefresh,
  persistAdminSubmissionsCache,
  refreshSubmissionsFromSheet,
} from '../../utils/submissionSync'

const TYPE_FILTERS = ['all', 'Event', 'Idea', 'ExpansionWatch'] as const

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
  const [checkedIds, setCheckedIds] = useState<string[]>([])
  const [bulkBusy, setBulkBusy] = useState(false)

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

  useEffect(() => {
    setCheckedIds([])
  }, [status, submissionType, search])

  function persistState(
    nextSubmissions: SheetSubmission[],
    nextHiddenIds: string[] = hiddenSubmissionIds,
  ) {
    persistAdminSubmissionsCache(nextSubmissions, nextHiddenIds, adminRefreshedAt)
  }

  function applyLocalStatus(id: string, nextStatus: string, extra: Partial<SheetSubmission> = {}) {
    setSubmissions((current) => {
      const next = updateSubmissionById(current, id.trim(), { status: nextStatus, ...extra })
      persistState(next)
      return next
    })
  }

  async function syncStatusToStore(patch: Partial<SheetSubmission> & { id: string }) {
    try {
      await patchSubmissionsInAdminStore([patch])
    } catch (error) {
      // Local Admin state already updated — store sync is best-effort.
      console.warn('Could not sync submission to Admin store:', error)
    }
  }

  function handleToggleChecked(submissionId: string) {
    setCheckedIds((current) =>
      current.includes(submissionId)
        ? current.filter((id) => id !== submissionId)
        : [...current, submissionId],
    )
  }

  function handleToggleCheckAll(checked: boolean) {
    if (!checked) {
      setCheckedIds((current) =>
        current.filter((id) => !filteredSubmissions.some((row) => row.id === id)),
      )
      return
    }
    setCheckedIds((current) => {
      const next = new Set(current)
      for (const row of filteredSubmissions) next.add(row.id)
      return [...next]
    })
  }

  async function handleBulkStatusChange(rows: SheetSubmission[], nextStatus: string) {
    if (rows.length === 0) return
    const ok = window.confirm(
      `Set ${rows.length} submission${rows.length === 1 ? '' : 's'} to “${submissionStatusLabel(nextStatus)}”?`,
    )
    if (!ok) return

    setBulkBusy(true)
    setActionMessage(null)
    const updates: Array<Partial<SheetSubmission> & { id: string }> = []
    for (const submission of rows) {
      if (submission.status === nextStatus) continue
      applyLocalStatus(submission.id, nextStatus)
      updates.push({ id: submission.id, status: nextStatus })
    }
    if (updates.length > 0) {
      try {
        await patchSubmissionsInAdminStore(updates)
      } catch (error) {
        setActionMessage({
          type: 'error',
          text:
            error instanceof Error
              ? `Updated locally; store sync failed: ${error.message}`
              : 'Updated locally; store sync failed.',
        })
        setCheckedIds([])
        setBulkBusy(false)
        return
      }
    }
    setCheckedIds([])
    setBulkBusy(false)
    setActionMessage({
      type: 'success',
      text: `Updated ${rows.length} to “${submissionStatusLabel(nextStatus)}”.`,
    })
  }

  async function handleBulkSolved(rows: SheetSubmission[]) {
    if (rows.length === 0) return
    const ok = window.confirm(
      `Mark ${rows.length} submission${rows.length === 1 ? '' : 's'} as solved?\n\nThey will leave the review queue.`,
    )
    if (!ok) return

    setBulkBusy(true)
    setActionMessage(null)
    const updates = rows.map((submission) => ({
      id: submission.id,
      status: SOLVED_SUBMISSION_STATUS,
    }))
    for (const submission of rows) {
      applyLocalStatus(submission.id, SOLVED_SUBMISSION_STATUS)
    }
    try {
      await patchSubmissionsInAdminStore(updates)
      setActionMessage({ type: 'success', text: `Marked ${rows.length} as solved.` })
    } catch (error) {
      setActionMessage({
        type: 'error',
        text:
          error instanceof Error
            ? `Solved locally; store sync failed: ${error.message}`
            : 'Solved locally; store sync failed.',
      })
    }
    setCheckedIds([])
    setBulkBusy(false)
  }

  async function handleRefresh() {
    setIsRefreshing(true)
    setRefreshError(null)
    setActionMessage(null)
    try {
      const result = await refreshSubmissionsFromAdminStore()
      setSubmissions(result.submissions)
      setAdminRefreshedAt(result.refreshedAt)
      persistAdminSubmissionsCache(result.submissions, hiddenSubmissionIds, result.refreshedAt)
      setActionMessage({
        type: 'success',
        text: `Loaded ${result.submissions.length} submissions from Admin store.`,
      })
    } catch (error) {
      // Fallback: optional Sheet CSV for legacy data.
      try {
        const sheet = await refreshSubmissionsFromSheet()
        setSubmissions(sheet.submissions)
        setAdminRefreshedAt(sheet.refreshedAt)
        persistAdminSubmissionsCache(sheet.submissions, hiddenSubmissionIds, sheet.refreshedAt)
        setActionMessage({
          type: 'success',
          text: `Admin store unavailable — loaded ${sheet.submissions.length} from Google Sheet fallback.`,
        })
      } catch {
        setRefreshError(
          error instanceof Error
            ? error.message
            : 'Could not refresh submissions. Check GITHUB_DEPLOY_TOKEN on Netlify.',
        )
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  async function handleStatusChange(submission: SheetSubmission, nextStatus: string) {
    if (nextStatus === submission.status) return
    const targetId = submission.id.trim()
    setBusyId(submission.id)
    setActionMessage(null)
    applyLocalStatus(targetId, nextStatus)
    await syncStatusToStore({ id: targetId, status: nextStatus })
    setActionMessage({
      type: 'success',
      text: `Updated status to “${submissionStatusLabel(nextStatus)}”.`,
    })
    setBusyId(null)
  }

  /** Approve + publish Event submission to the public catalog. */
  async function handlePromote(submission: SheetSubmission) {
    const targetId = submission.id.trim()
    setBusyId(submission.id)
    setActionMessage(null)

    try {
      let working = submission
      if (String(submission.status).toLowerCase() !== 'approved') {
        applyLocalStatus(targetId, 'Approved')
        working = { ...submission, status: 'Approved' }
        await syncStatusToStore({ id: targetId, status: 'Approved' })
      }

      const verifiedDate = pacificTodayYmd()
      const { event, eventId } = promoteSubmissionLocally(working, verifiedDate)
      const message = await publishEventsToSite([event])

      applyLocalStatus(targetId, 'Added to sheet', { convertedEventId: eventId })
      await syncStatusToStore({
        id: targetId,
        status: 'Added to sheet',
        convertedEventId: eventId,
      })

      setActionMessage({
        type: 'success',
        text: `Went live (${eventId}). ${message}`,
      })
    } catch (error) {
      setActionMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not Go live.',
      })
    } finally {
      setBusyId(null)
    }
  }

  async function handleSolved(submission: SheetSubmission) {
    const confirmed = window.confirm(
      `Mark “${submission.eventName || 'this submission'}” as solved?\n\nIt will be removed from your review queue.`,
    )
    if (!confirmed) return

    const targetId = submission.id.trim()
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
        text: 'Could not find this submission in the dashboard. Try refreshing.',
      })
      return
    }

    setSelectedId((current) => (submissionIdsMatch(current ?? '', targetId) ? null : current))
    await syncStatusToStore({ id: targetId, status: SOLVED_SUBMISSION_STATUS })
    setActionMessage({
      type: 'success',
      text: 'Marked as solved and removed from your review queue.',
    })
    setBusyId(null)
  }

  function handleDelete(submission: SheetSubmission) {
    const confirmed = window.confirm(
      `Remove “${submission.eventName || 'this submission'}” from the dashboard?\n\nYou can restore it from Hidden later.`,
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
      text: 'Removed from dashboard (hidden in this browser).',
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
          Share form submissions land here directly (no Google Sheet). Review, set{' '}
          <strong>Approved</strong>, then <strong>Go live</strong> to publish Event submissions on
          Puddles (~2–4 min).
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
            <div className="admin-stat-label">Ready / Live</div>
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
              Click a row to expand. <strong>Go live</strong> publishes Approved Event submissions to
              the public site. <strong>Solved</strong> archives from your queue.
            </p>
          </div>
        </div>

        {/* rest of filters/table unchanged below — kept in following patch if truncated */}
        <div className="admin-toolbar">
          <label className="admin-search">
            <span className="sr-only">Search submissions</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, city, tips…"
              className="admin-search-input"
            />
          </label>
          <label className="admin-select-wrap">
            <span className="admin-select-label">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SubmissionStatusFilter)}
              className="admin-select"
            >
              <option value="all">All statuses</option>
              {SUBMISSION_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {submissionStatusLabel(option)}
                </option>
              ))}
              <option value="hidden">Hidden</option>
            </select>
          </label>
          <label className="admin-select-wrap">
            <span className="admin-select-label">Type</span>
            <select
              value={submissionType}
              onChange={(e) =>
                setSubmissionType(e.target.value as (typeof TYPE_FILTERS)[number])
              }
              className="admin-select"
            >
              {TYPE_FILTERS.map((option) => (
                <option key={option} value={option}>
                  {option === 'all'
                    ? 'All types'
                    : option === 'ExpansionWatch'
                      ? 'Expansion Watch'
                      : option}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="admin-btn admin-btn-secondary" onClick={handleExportCsv}>
            Export CSV
          </button>
        </div>
        {exportMessage ? <p className="admin-export-message">{exportMessage}</p> : null}

        <AdminSubmissionsTable
          submissions={filteredSubmissions}
          selectedId={selectedId}
          busyId={busyId}
          checkedIds={checkedIds}
          bulkBusy={bulkBusy}
          onSelect={(submission) =>
            setSelectedId((current) => (current === submission.id ? null : submission.id))
          }
          onToggleChecked={handleToggleChecked}
          onToggleCheckAll={handleToggleCheckAll}
          onClearChecked={() => setCheckedIds([])}
          onBulkStatusChange={(rows, next) => void handleBulkStatusChange(rows, next)}
          onBulkSolved={(rows) => void handleBulkSolved(rows)}
          onStatusChange={(submission, next) => void handleStatusChange(submission, next)}
          onPromote={(submission) => void handlePromote(submission)}
          onSolved={(submission) => void handleSolved(submission)}
          onDelete={handleDelete}
          onRestore={handleRestore}
        />
      </section>
    </>
  )
}

import { formatSyncTimestamp, SYNC_CONFIG, SYNC_META } from '../../data/syncInfo'

interface AdminSyncBarProps {
  adminRefreshedAt: string | null
  isRefreshing: boolean
  refreshError: string | null
  onRefresh: () => void
  refreshLabel?: string
  adminHint?: string
  footerNote?: string
  isPublishing?: boolean
  publishError?: string | null
  publishMessage?: string | null
  onPublish?: () => void
}

export function AdminSyncBar({
  adminRefreshedAt,
  isRefreshing,
  refreshError,
  onRefresh,
  refreshLabel = 'Legacy: preview Sheet in browser',
  adminHint = 'Optional — does not update the public site',
  footerNote = 'Public site updates via Discovery or Submissions → Go live (~2–4 min). Sheet import is legacy only.',
  isPublishing = false,
  publishError = null,
  publishMessage = null,
  onPublish,
}: AdminSyncBarProps) {
  const deployedLabel = formatSyncTimestamp(SYNC_META.syncedAt)
  const adminLabel = adminRefreshedAt ? formatSyncTimestamp(adminRefreshedAt) : null

  return (
    <section className="admin-sync-bar" aria-label="Events monitor status">
      <p className="admin-submissions-intro">
        Monitor what is on the public site. Promote new activities from{' '}
        <strong>Discovery → Ready → Go live</strong>. Sheet refresh is optional/advanced.
      </p>
      <div className="admin-sync-grid">
        <div className="admin-sync-item">
          <div className="admin-sync-label">Public catalog</div>
          <div className="admin-sync-value">{deployedLabel}</div>
          <div className="admin-sync-hint">
            {SYNC_META.eventCount} events · {SYNC_META.liveCount} live · {SYNC_CONFIG.scheduleLabel}
          </div>
        </div>

        <div className="admin-sync-item">
          <div className="admin-sync-label">Admin refreshed</div>
          <div className="admin-sync-value">{adminLabel ?? 'Not yet this session'}</div>
          <div className="admin-sync-hint">{adminHint}</div>
        </div>
      </div>

      <div className="admin-sync-actions">
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={onRefresh}
          disabled={isRefreshing || isPublishing}
        >
          {isRefreshing ? 'Refreshing…' : refreshLabel}
        </button>
        {onPublish ? (
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={onPublish}
            disabled={isRefreshing || isPublishing}
            title="Legacy: re-import Google Sheet and deploy — can overwrite Admin edits"
          >
            {isPublishing ? 'Importing…' : 'Legacy: import Sheet → site'}
          </button>
        ) : null}
        {(refreshError || publishError) && (
          <p className="admin-sync-error" role="alert">
            {publishError || refreshError}
          </p>
        )}
        {publishMessage ? (
          <p className="admin-action-alert admin-action-alert--success" role="status">
            {publishMessage}
          </p>
        ) : null}
        {!refreshError && !publishError && !publishMessage && footerNote ? (
          <p className="admin-sync-note-inline">{footerNote}</p>
        ) : null}
      </div>
    </section>
  )
}

import { formatSyncTimestamp, SYNC_CONFIG, SYNC_META } from '../../data/syncInfo'

interface AdminSyncBarProps {
  adminRefreshedAt: string | null
  isRefreshing: boolean
  refreshError: string | null
  onRefresh: () => void
  refreshLabel?: string
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
  refreshLabel = 'Refresh from Sheet',
  isPublishing = false,
  publishError = null,
  publishMessage = null,
  onPublish,
}: AdminSyncBarProps) {
  const deployedLabel = formatSyncTimestamp(SYNC_META.syncedAt)
  const adminLabel = adminRefreshedAt ? formatSyncTimestamp(adminRefreshedAt) : null

  return (
    <section className="admin-sync-bar" aria-label="Sync status">
      <div className="admin-sync-grid">
        <div className="admin-sync-item">
          <div className="admin-sync-label">Scheduled sync</div>
          <div className="admin-sync-value">{SYNC_CONFIG.scheduleLabel}</div>
          <div className="admin-sync-hint">{SYNC_CONFIG.scheduleDescription}</div>
        </div>

        <div className="admin-sync-item">
          <div className="admin-sync-label">Last deployed sync</div>
          <div className="admin-sync-value">{deployedLabel}</div>
          <div className="admin-sync-hint">
            {SYNC_META.eventCount} events · {SYNC_META.liveCount} live on public site
          </div>
        </div>

        <div className="admin-sync-item">
          <div className="admin-sync-label">Admin refreshed</div>
          <div className="admin-sync-value">{adminLabel ?? 'Not yet this session'}</div>
          <div className="admin-sync-hint">Pulls latest sheet data into this dashboard</div>
        </div>
      </div>

      <div className="admin-sync-actions">
        <button
          type="button"
          className="admin-btn admin-btn-primary"
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
          >
            {isPublishing ? 'Publishing…' : 'Publish to site'}
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
        {!refreshError && !publishError && !publishMessage && (
          <p className="admin-sync-note-inline">
            <strong>Refresh</strong> updates this dashboard. <strong>Publish to site</strong> syncs the
            sheet and deploys the public site (2–4 min).
          </p>
        )}
      </div>
    </section>
  )
}

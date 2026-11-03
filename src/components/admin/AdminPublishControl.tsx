import { useEffect, useMemo, useState } from 'react'
import {
  clearPublishedAdminEvents,
  loadAdminPublishQueue,
  subscribeToAdminPublishQueue,
  type AdminPublishQueueItem,
} from '../../utils/adminPublishQueue'
import { markDiscoveryReviewsLive } from '../../utils/discoveryReview'
import {
  commitSeasonalCurationPublish,
  getActiveThemeSlugForAdmin,
  getEffectiveSeasonalSectionIds,
  SEASONAL_STAGING_CHANGED,
  stagingHasChanges,
} from '../../utils/seasonalCurationStaging'
import { upsertAdminCacheEvent } from '../../utils/discoveryApproveLocal'

type PublishResult = {
  ok?: boolean
  error?: string
  message?: string
}

const SOURCE_LABEL: Record<AdminPublishQueueItem['source'], string> = {
  discovery: 'Discovery',
  events: 'Events',
  submissions: 'Submissions',
}

function preparedStatus(item: AdminPublishQueueItem) {
  if (item.event.status !== 'Draft') return item.event
  const core = new Set(['Palo Alto', 'Mountain View', 'Los Altos', 'Los Altos Hills', 'Sunnyvale'])
  return { ...item.event, status: core.has(item.event.city) ? 'Published' as const : 'Hidden' as const }
}

export function AdminPublishControl() {
  const [items, setItems] = useState(() => loadAdminPublishQueue().items)
  const [, setSeasonalTick] = useState(0)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => subscribeToAdminPublishQueue(() => setItems(loadAdminPublishQueue().items)), [])
  useEffect(() => {
    const refresh = () => setSeasonalTick((value) => value + 1)
    window.addEventListener(SEASONAL_STAGING_CHANGED, refresh)
    return () => window.removeEventListener(SEASONAL_STAGING_CHANGED, refresh)
  }, [])

  const seasonal = (() => {
    const themeSlug = getActiveThemeSlugForAdmin()
    const sections = getEffectiveSeasonalSectionIds(themeSlug)
    return stagingHasChanges(sections.staging)
      ? {
          themeSlug,
          collectionEventIds: sections.closeToHome,
          driveEventIds: sections.worthADrive,
        }
      : null
  })()
  const count = items.length + (seasonal ? 1 : 0)
  const groups = useMemo(
    () =>
      (Object.keys(SOURCE_LABEL) as AdminPublishQueueItem['source'][]).map((source) => ({
        source,
        items: items.filter((item) => item.source === source),
      })),
    [items],
  )

  async function publish() {
    if (count === 0) return
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/publish-admin-bundle', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, seasonal }),
      })
      const result = (await response.json()) as PublishResult
      if (!response.ok || !result.ok) throw new Error(result.error || 'Publish failed.')

      for (const item of items) upsertAdminCacheEvent(preparedStatus(item))
      markDiscoveryReviewsLive(
        items.filter((item) => item.source === 'discovery').map((item) => item.sourceId),
      )
      clearPublishedAdminEvents(items)
      if (seasonal) {
        commitSeasonalCurationPublish(
          seasonal.themeSlug,
          seasonal.collectionEventIds,
          seasonal.driveEventIds,
        )
      }
      setItems(loadAdminPublishQueue().items)
      setOpen(false)
      setMessage(result.message || 'Published. The public site usually updates in 2–4 minutes.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not publish.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-publish-control">
      <button
        type="button"
        className="admin-btn admin-btn-primary"
        disabled={count === 0 || busy}
        onClick={() => setOpen((value) => !value)}
      >
        {busy ? 'Publishing…' : `Publish (${count})`}
      </button>
      {open ? (
        <section className="admin-publish-summary" aria-label="Publish summary">
          <div className="admin-publish-summary__head">
            <div>
              <strong>Publish approved changes</strong>
              <p>One site update. Removed and unresolved items are excluded.</p>
            </div>
            <button type="button" className="admin-btn admin-btn-text" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          {groups.map((group) =>
            group.items.length > 0 ? (
              <div key={group.source} className="admin-publish-summary__group">
                <strong>{SOURCE_LABEL[group.source]} · {group.items.length}</strong>
                <ul>
                  {group.items.map((item) => <li key={`${item.source}:${item.sourceId}`}>{item.event.title}</li>)}
                </ul>
              </div>
            ) : null,
          )}
          {seasonal ? (
            <div className="admin-publish-summary__group">
              <strong>Seasonal curation · 1</strong>
              <p>{seasonal.themeSlug} · {seasonal.collectionEventIds.length} close to home · {seasonal.driveEventIds.length} worth a drive</p>
            </div>
          ) : null}
          <button type="button" className="admin-btn admin-btn-primary" disabled={busy} onClick={() => void publish()}>
            {busy ? 'Publishing…' : `Publish ${count} approved change${count === 1 ? '' : 's'}`}
          </button>
        </section>
      ) : null}
      {message ? <p className="admin-publish-control__message" role="status">{message}</p> : null}
    </div>
  )
}

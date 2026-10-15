import type { Event } from '../types/event'

const STORAGE_KEY = 'puddles-admin-publish-queue-v1'
export const ADMIN_PUBLISH_QUEUE_CHANGED = 'puddles:admin-publish-queue-changed'

export type AdminPublishSource = 'discovery' | 'events' | 'submissions'

export interface AdminPublishQueueItem {
  event: Event
  source: AdminPublishSource
  sourceId: string
  approvedAt: string
}

interface AdminPublishQueueStore {
  items: AdminPublishQueueItem[]
}

function emptyStore(): AdminPublishQueueStore {
  return { items: [] }
}

function notify() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ADMIN_PUBLISH_QUEUE_CHANGED))
  }
}

export function loadAdminPublishQueue(): AdminPublishQueueStore {
  if (typeof window === 'undefined') return emptyStore()
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '') as AdminPublishQueueStore
    return {
      items: Array.isArray(parsed?.items)
        ? parsed.items.filter((item) => item?.event?.id && item?.source && item?.sourceId)
        : [],
    }
  } catch {
    return emptyStore()
  }
}

function writeStore(store: AdminPublishQueueStore) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  notify()
}

export function stageAdminEvent(
  event: Event,
  source: AdminPublishSource,
  sourceId: string = event.id,
) {
  const store = loadAdminPublishQueue()
  const key = `${source}:${sourceId}`
  const item: AdminPublishQueueItem = {
    event,
    source,
    sourceId,
    approvedAt: new Date().toISOString(),
  }
  const items = store.items.filter((row) => `${row.source}:${row.sourceId}` !== key)
  writeStore({ items: [...items, item] })
}

export function removeStagedAdminEvent(source: AdminPublishSource, sourceId: string) {
  const store = loadAdminPublishQueue()
  writeStore({
    items: store.items.filter((row) => row.source !== source || row.sourceId !== sourceId),
  })
}

export function clearPublishedAdminEvents(items: AdminPublishQueueItem[]) {
  const keys = new Set(items.map((item) => `${item.source}:${item.sourceId}`))
  const store = loadAdminPublishQueue()
  writeStore({
    items: store.items.filter((row) => !keys.has(`${row.source}:${row.sourceId}`)),
  })
}

export function subscribeToAdminPublishQueue(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined
  window.addEventListener(ADMIN_PUBLISH_QUEUE_CHANGED, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(ADMIN_PUBLISH_QUEUE_CHANGED, listener)
    window.removeEventListener('storage', listener)
  }
}

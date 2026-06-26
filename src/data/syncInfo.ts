import syncConfig from '../data/sync-config.json'
import syncMeta from '../data/sync-meta.json'

export interface SyncMeta {
  syncedAt: string
  eventCount: number
  liveCount: number
  spreadsheetId: string
  tab: string
  scheduleLabel?: string
  scheduleCron?: string
}

export interface SyncConfig {
  scheduleLabel: string
  scheduleCron: string
  scheduleDescription: string
}

export const SYNC_CONFIG = syncConfig as SyncConfig
export const SYNC_META = syncMeta as SyncMeta

export function formatSyncTimestamp(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Legacy /event/:id paths that should resolve to a canonical catalog event.
 * Used when a sheet or discovery id was hidden/deduped but links still circulate.
 */
export const EVENT_ID_ALIASES: Readonly<Record<string, string>> = {
  'disc-winter-wonderlab-2026-11-21-regional-badm-winter-wonderlab-2026-11-2':
    'regional-badm-winter-wonderlab-2026-11-21',
}

export function resolveEventIdAlias(id: string): string {
  return EVENT_ID_ALIASES[id] ?? id
}

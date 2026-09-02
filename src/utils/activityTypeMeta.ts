import type { ActivityType } from '../types/event'

/** Short label for activity type in card metadata (not image pills). */
export function formatActivityTypeMetaLabel(type: ActivityType | string): string {
  if (type === 'Festivals & Community') return 'Festival'
  return type
}

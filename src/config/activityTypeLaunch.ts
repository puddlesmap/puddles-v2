import type { ActivityType } from '../types/event'

/**
 * Last calendar day (inclusive, local) to show a small NEW indicator on activity-type
 * filters. Remove entries once a type is established in the product.
 */
export const ACTIVITY_TYPE_FILTER_NEW_UNTIL: Partial<Record<ActivityType, string>> = {
  'Festivals & Community': '2026-10-31',
  'Parent & Me': '2026-10-31',
}

export function isNewActivityTypeFilter(type: ActivityType, now = new Date()): boolean {
  const until = ACTIVITY_TYPE_FILTER_NEW_UNTIL[type]
  if (!until) return false

  const end = new Date(`${until}T23:59:59`)
  return now.getTime() <= end.getTime()
}

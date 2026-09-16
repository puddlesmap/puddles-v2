import { ACTIVITY_TYPES, type ActivityType } from '../types/event'

/**
 * Last calendar day (inclusive, local) to show a small NEW indicator on activity-type
 * filters. Remove entries once a type is established in the product.
 */
export const ACTIVITY_TYPE_FILTER_NEW_UNTIL: Partial<Record<ActivityType, string>> = {
  'Festivals & Community': '2026-10-31',
  'Parent & Me': '2026-10-31',
}

const NEW_ACTIVITY_TYPE_FILTER_ORDER = Object.keys(
  ACTIVITY_TYPE_FILTER_NEW_UNTIL,
) as ActivityType[]

export function isNewActivityTypeFilter(type: ActivityType, now = new Date()): boolean {
  const until = ACTIVITY_TYPE_FILTER_NEW_UNTIL[type]
  if (!until) return false

  const end = new Date(`${until}T23:59:59`)
  return now.getTime() <= end.getTime()
}

/** Parent-facing type lists: NEW types first, then the rest of ACTIVITY_TYPES. */
export function publicActivityTypeFilterOrder(includeOther = false): ActivityType[] {
  const newTypes = NEW_ACTIVITY_TYPE_FILTER_ORDER.filter((type) => ACTIVITY_TYPES.includes(type))
  const rest = ACTIVITY_TYPES.filter(
    (type) => type !== 'Other' && !newTypes.includes(type),
  )
  return includeOther ? [...newTypes, ...rest, 'Other'] : [...newTypes, ...rest]
}

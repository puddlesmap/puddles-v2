const WEEKLY_REVIEW_REMINDER_ID = 'weekly-discovery-review'
const STORAGE_KEY = `puddles-admin-reminder-${WEEKLY_REVIEW_REMINDER_ID}`

export interface AdminReminder {
  id: string
  title: string
  phrase: string
  body: string
}

export const SCHEDULED_DISCOVER_REMINDER: AdminReminder = {
  id: WEEKLY_REVIEW_REMINDER_ID,
  title: 'Weekly discovery is ready',
  phrase: 'review this week’s queue.',
  body: 'In chat, say “review this week’s queue.” I will help only with uncertain cards and skipped standing sources such as FIT4MOM and Sunnyvale Library.',
}

export function isScheduledDiscoverReminderDismissed(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'dismissed'
  } catch {
    return false
  }
}

export function dismissScheduledDiscoverReminder() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, 'dismissed')
}

/** Visible on Admin until dismissed. A new id replaces the old trip reminder. */
export function shouldShowScheduledDiscoverReminder(): boolean {
  return !isScheduledDiscoverReminderDismissed()
}

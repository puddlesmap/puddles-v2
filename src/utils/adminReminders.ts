const SCHEDULED_DISCOVER_REMINDER_ID = 'scheduled-discover-2026-08-19'
const STORAGE_KEY = `puddles-admin-reminder-${SCHEDULED_DISCOVER_REMINDER_ID}`
/** First Pacific calendar day the reminder may appear. */
export const SCHEDULED_DISCOVER_REMINDER_START = '2026-08-19'

export interface AdminReminder {
  id: string
  title: string
  body: string
}

export const SCHEDULED_DISCOVER_REMINDER: AdminReminder = {
  id: SCHEDULED_DISCOVER_REMINDER_ID,
  title: 'Back from trip — set up Scheduled Discover',
  body: 'When you’re ready, add the Scheduled Discover cron so the Discovery queue refreshes automatically (no manual redeploy just to review). Dismiss this when done or when you no longer need the reminder.',
}

function pacificTodayYmd(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
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

/** Visible on/after Aug 19, 2026 Pacific until the admin dismisses it. */
export function shouldShowScheduledDiscoverReminder(): boolean {
  if (pacificTodayYmd() < SCHEDULED_DISCOVER_REMINDER_START) return false
  return !isScheduledDiscoverReminderDismissed()
}

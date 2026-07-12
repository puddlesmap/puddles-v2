/** Prototype-only cancelled events for the expired-activity experiment. */
export const EXPERIMENT_CANCELLED_EVENT_IDS = new Set<string>([
  'baby-storytime-mountain-view-public-library-2026-07-01-10-30',
])

export const EXPERIMENT_LIFECYCLE_SCENARIOS = [
  {
    id: 'upcoming',
    label: 'Upcoming',
    description: 'Still discoverable on Home / Browse / Map.',
  },
  {
    id: 'ended',
    label: 'Ended',
    description: 'Removed from discovery; detail URL stays live with ended banner.',
  },
  {
    id: 'archived',
    label: 'Archived (90+ days)',
    description: 'Same ended UX; would drop from sitemap and use noindex.',
  },
  {
    id: 'cancelled',
    label: 'Cancelled',
    description: 'Separate message; removed from discovery.',
  },
] as const

export const EXPERIMENT_TIME_PRESETS = [
  { id: 'live', label: 'Live now', offsetDays: 0 },
  { id: 'day-after', label: 'Day after event', offsetDays: 1 },
  { id: 'archive', label: '91 days after end', offsetDays: 91 },
] as const

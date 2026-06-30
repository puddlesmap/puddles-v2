import type { BrowseFilters } from '../utils/filters'

export type ExpansionWatchSourceContext =
  | 'empty_state'
  | 'feedback_add_neighborhood'
  | 'footer_about'
  | 'browse_inline_card'

export interface ExpansionWatchPayload {
  email: string
  requestedLocation: string
  sourceContext: ExpansionWatchSourceContext
  selectedCity?: string
  selectedFilters?: Partial<BrowseFilters>
  submittedAt: string
}

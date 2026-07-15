import type { BrowseFilters } from '../utils/filters'

export type ExpansionWatchSourceContext =
  | 'empty_state'
  | 'feedback_add_neighborhood'
  | 'footer_about'
  | 'browse_inline_card'
  | 'welcome_popup'
  | 'welcome_floating_cta'
  | 'welcome_about'

export interface ExpansionWatchPayload {
  email: string
  requestedLocation: string
  sourceContext: ExpansionWatchSourceContext
  selectedCity?: string
  selectedFilters?: Partial<BrowseFilters>
  submittedAt: string
}

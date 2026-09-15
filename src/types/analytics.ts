export type EventOpenSource =
  | 'discovery'
  | 'browse_list'
  | 'browse_map'
  | 'home'
  | 'city_landing'
  | 'direct'

export type EventDetailPresentation = 'overlay' | 'page'

export type EventOpenMode = 'soft_navigation' | 'hard_load'

export type EventDescPlacement = 'before_meta' | 'after_meta'

export interface EventDetailAnalyticsContext {
  presentation?: EventDetailPresentation
  open_mode?: EventOpenMode
  desc_placement?: EventDescPlacement
}

export type FilterContext = 'home' | 'browse'

export type ViewMode = 'list' | 'map'

export type ShareSubmissionType = 'event_tip' | 'idea' | 'feedback'

export type ActivityEngagementAction =
  | 'visit_official_page_clicked'
  | 'add_to_calendar_clicked'
  | 'open_route_clicked'
  | 'activity_shared'

export type AnalyticsProps = Record<string, string | number | boolean>

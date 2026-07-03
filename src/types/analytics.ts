export type EventOpenSource =
  | 'discovery'
  | 'browse_list'
  | 'browse_map'
  | 'home'
  | 'city_landing'

export type FilterContext = 'home' | 'browse'

export type ViewMode = 'list' | 'map'

export type ShareSubmissionType = 'event_tip' | 'idea' | 'feedback'

export type ActivityEngagementAction =
  | 'visit_official_page_clicked'
  | 'add_to_calendar_clicked'
  | 'open_route_clicked'
  | 'activity_shared'

export type AnalyticsProps = Record<string, string | number | boolean>

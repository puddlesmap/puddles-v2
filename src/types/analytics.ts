export type EventOpenSource =
  | 'discovery'
  | 'browse_list'
  | 'browse_map'
  | 'home'
  | 'city_landing'

export type BrowseCityChangeSource = 'filter' | 'pill' | 'bridge'

export type BrowseFilterKind = 'day' | 'time' | 'age' | 'type'

export type ShareTab = 'activity' | 'idea'

export type AnalyticsProps = Record<string, string | number | boolean>

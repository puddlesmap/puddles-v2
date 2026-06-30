import type { Event } from '../../types/event'
import type { BrowseFilters } from '../../utils/filters'
import { hasGoogleMapsApiKey } from '../../utils/googleMaps'
import { BrowseGoogleMapView } from './BrowseGoogleMapView'
import { BrowseLeafletMapView } from './BrowseLeafletMapView'

interface BrowseMapViewProps {
  events: Event[]
  feedKey: string
  browseFilters: BrowseFilters
  onOpenEvent: (event: Event) => void
}

export function BrowseMapView({ browseFilters, ...props }: BrowseMapViewProps) {
  if (hasGoogleMapsApiKey()) {
    return <BrowseGoogleMapView browseFilters={browseFilters} {...props} />
  }

  return <BrowseLeafletMapView browseFilters={browseFilters} {...props} />
}

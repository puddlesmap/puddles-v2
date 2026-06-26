import type { Event } from '../../types/event'
import { hasGoogleMapsApiKey } from '../../utils/googleMaps'
import { BrowseGoogleMapView } from './BrowseGoogleMapView'
import { BrowseLeafletMapView } from './BrowseLeafletMapView'

interface BrowseMapViewProps {
  events: Event[]
  feedKey: string
  onOpenEvent: (event: Event) => void
}

export function BrowseMapView(props: BrowseMapViewProps) {
  if (hasGoogleMapsApiKey()) {
    return <BrowseGoogleMapView {...props} />
  }

  return <BrowseLeafletMapView {...props} />
}

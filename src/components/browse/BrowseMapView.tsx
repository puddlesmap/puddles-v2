import type { Event } from '../../types/event'
import type { BrowseFilters } from '../../utils/filters'
import type { MapInteractionMode } from '../../hooks/useBrowseMapInteraction'
import { hasGoogleMapsApiKey } from '../../utils/googleMaps'
import { BrowseGoogleMapView } from './BrowseGoogleMapView'
import { BrowseLeafletMapView } from './BrowseLeafletMapView'

interface BrowseMapViewProps {
  events: Event[]
  feedKey: string
  browseFilters: BrowseFilters
  onOpenEvent: (event: Event) => void
  interactionMode?: MapInteractionMode
}

export function BrowseMapView({ browseFilters, interactionMode = 'default', ...props }: BrowseMapViewProps) {
  if (hasGoogleMapsApiKey()) {
    return (
      <BrowseGoogleMapView
        browseFilters={browseFilters}
        interactionMode={interactionMode}
        {...props}
      />
    )
  }

  return (
    <BrowseLeafletMapView
      browseFilters={browseFilters}
      interactionMode={interactionMode}
      {...props}
    />
  )
}

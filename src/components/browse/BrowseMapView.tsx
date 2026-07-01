import type { Event } from '../../types/event'
import type { BrowseFilters } from '../../utils/filters'
import type { MapInteractionMode, MapOpenEventHandler } from '../../hooks/useBrowseMapInteraction'
import type { BrowseReturnSnapshot } from '../../utils/browseReturnState'
import { hasGoogleMapsApiKey } from '../../utils/googleMaps'
import { BrowseGoogleMapView } from './BrowseGoogleMapView'
import { BrowseLeafletMapView } from './BrowseLeafletMapView'

interface BrowseMapViewProps {
  events: Event[]
  feedKey: string
  browseFilters: BrowseFilters
  onOpenEvent: MapOpenEventHandler
  interactionMode?: MapInteractionMode
  restoreSnapshot?: BrowseReturnSnapshot | null
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

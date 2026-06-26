import type { Map as LeafletMap } from 'leaflet'

function LocateIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden>
      <circle cx="10" cy="10" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M10 2.5v2.25M10 15.25V17.5M2.5 10h2.25M15.25 10H17.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

interface MapControlsProps {
  map?: LeafletMap | null
  onZoomIn?: () => void
  onZoomOut?: () => void
  zoomEnabled?: boolean
  showSearchArea: boolean
  locationMessage: string | null
  isLocating: boolean
  onSearchArea: () => void
  onLocate: () => void
  onDismissMessage: () => void
}

export function MapControls({
  map,
  onZoomIn,
  onZoomOut,
  zoomEnabled,
  showSearchArea,
  locationMessage,
  isLocating,
  onSearchArea,
  onLocate,
  onDismissMessage,
}: MapControlsProps) {
  const canZoom = zoomEnabled ?? Boolean(map)

  function handleZoomIn() {
    if (onZoomIn) {
      onZoomIn()
      return
    }
    map?.zoomIn()
  }

  function handleZoomOut() {
    if (onZoomOut) {
      onZoomOut()
      return
    }
    map?.zoomOut()
  }

  return (
    <div className="browse-map-controls" onClick={(event) => event.stopPropagation()}>
      {showSearchArea && (
        <button type="button" className="browse-map-search-area-btn" onClick={onSearchArea}>
          Search this area
        </button>
      )}

      {locationMessage && (
        <div className="browse-map-toast" role="status">
          <span>{locationMessage}</span>
          <button type="button" onClick={onDismissMessage} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      <div className="browse-map-control-stack">
        <button
          type="button"
          className="browse-map-control-btn"
          onClick={handleZoomIn}
          aria-label="Zoom in"
          disabled={!canZoom}
        >
          +
        </button>
        <button
          type="button"
          className="browse-map-control-btn"
          onClick={handleZoomOut}
          aria-label="Zoom out"
          disabled={!canZoom}
        >
          −
        </button>
        <button
          type="button"
          className="browse-map-control-btn browse-map-control-btn--locate"
          onClick={onLocate}
          aria-label="Go to my location"
          disabled={isLocating}
          title="Current location"
        >
          <LocateIcon />
        </button>
      </div>
    </div>
  )
}

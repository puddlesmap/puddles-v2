import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import { StaticMap } from '@vis.gl/react-google-maps'
import type { Event } from '../../types/event'
import { createEventPinIcon } from '../browse/mapPins'
import { MapFitBounds, MapFitEvents, MapFitPoints } from '../browse/MapSearchAreaDetector'
import {
  BROWSE_MAP_BOUNDS_PADDING,
  BROWSE_MAP_DEFAULT_ZOOM,
  BROWSE_MAP_SINGLE_EVENT_ZOOM,
  HOME_MAP_PREVIEW_BOUNDS_PADDING,
  HOME_MAP_PREVIEW_DEFAULT_ZOOM,
  HOME_MAP_PREVIEW_SINGLE_EVENT_ZOOM,
  type HomeMapViewport,
} from '../browse/mapViewConfig'
import type { MapBoundsBox } from '../../utils/mapBounds'
import {
  getBoundsFromPoints,
  getEventsMapCenter,
  getEventsWithCoordinates,
  getMapViewportForBounds,
} from '../../utils/mapBounds'
import { buildDiscoveryStaticMapUrl, hasGoogleMapsApiKey } from '../../utils/googleMaps'
import 'leaflet/dist/leaflet.css'

const MAP_TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

function getBoundsCenter(bounds: MapBoundsBox): [number, number] {
  return [(bounds.north + bounds.south) / 2, (bounds.east + bounds.west) / 2]
}

function MapSizeFix() {
  const map = useMap()

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      map.invalidateSize({ animate: false })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [map])

  return null
}

interface DiscoveryMapPreviewProps {
  events: Event[]
  resetKey: string
  /** When false, renders map tiles only (decorative overlay pins live in the parent). */
  showEventMarkers?: boolean
  /** Wider initial bounds for compact home preview cards. */
  looseFraming?: boolean
  areaBounds?: MapBoundsBox
  anchorPoints?: Array<{ lat: number; lng: number }>
  boundsPadding?: number
  fixedViewport?: HomeMapViewport
}

export function DiscoveryMapPreview({
  events,
  resetKey,
  showEventMarkers = true,
  looseFraming = false,
  areaBounds,
  anchorPoints,
  boundsPadding,
  fixedViewport,
}: DiscoveryMapPreviewProps) {
  const mappable = getEventsWithCoordinates(events)
  const hasContextFraming = Boolean(areaBounds || anchorPoints?.length || fixedViewport)
  const resolvedBoundsPadding =
    boundsPadding ?? (looseFraming ? HOME_MAP_PREVIEW_BOUNDS_PADDING : BROWSE_MAP_BOUNDS_PADDING)
  const resolvedViewport = (() => {
    if (fixedViewport) {
      return {
        center: fixedViewport.center,
        zoom: fixedViewport.zoom,
        bounds: areaBounds ?? {
          north: fixedViewport.center.lat + 0.07,
          south: fixedViewport.center.lat - 0.07,
          east: fixedViewport.center.lng + 0.09,
          west: fixedViewport.center.lng - 0.09,
        },
      }
    }

    if (anchorPoints && anchorPoints.length > 0) {
      const pointBounds = getBoundsFromPoints(anchorPoints)
      if (!pointBounds) return null
      return getMapViewportForBounds(pointBounds, {
        paddingRatio: resolvedBoundsPadding,
        zoomOffset: 1,
      })
    }

    if (areaBounds) {
      return getMapViewportForBounds(areaBounds, {
        paddingRatio: resolvedBoundsPadding,
        zoomOffset: 1,
      })
    }

    return null
  })()
  const center: [number, number] = resolvedViewport
    ? [resolvedViewport.center.lat, resolvedViewport.center.lng]
    : areaBounds
      ? getBoundsCenter(areaBounds)
      : getEventsMapCenter(mappable)
  const staticMapUrl = buildDiscoveryStaticMapUrl(mappable, {
    looseFraming,
    areaBounds,
    anchorPoints,
    boundsPadding: resolvedBoundsPadding,
    fixedViewport,
  })
  const initialZoom = resolvedViewport?.zoom ?? (looseFraming ? HOME_MAP_PREVIEW_DEFAULT_ZOOM : 12)

  if (!hasContextFraming && mappable.length === 0) return null

  if (hasGoogleMapsApiKey() && staticMapUrl) {
    return (
      <StaticMap
        key={resetKey}
        url={staticMapUrl}
        className="discovery-map-preview-canvas discovery-map-preview-static-map"
      />
    )
  }

  return (
    <MapContainer
      center={center}
      zoom={initialZoom}
      className="discovery-map-preview-canvas"
      zoomControl={false}
      attributionControl={false}
      dragging={false}
      touchZoom={false}
      doubleClickZoom={false}
      scrollWheelZoom={false}
      boxZoom={false}
      keyboard={false}
    >
      <TileLayer url={MAP_TILE_URL} subdomains={['a', 'b', 'c', 'd']} maxZoom={20} />
      <MapSizeFix />
      {anchorPoints && anchorPoints.length > 0 ? (
        <MapFitPoints
          points={anchorPoints}
          resetKey={resetKey}
          boundsPadding={resolvedBoundsPadding}
          singlePointZoom={looseFraming ? HOME_MAP_PREVIEW_SINGLE_EVENT_ZOOM : BROWSE_MAP_SINGLE_EVENT_ZOOM}
        />
      ) : fixedViewport ? null : areaBounds ? (
        <MapFitBounds
          bounds={areaBounds}
          resetKey={resetKey}
          boundsPadding={resolvedBoundsPadding}
        />
      ) : (
        <MapFitEvents
          events={mappable}
          resetKey={resetKey}
          boundsPadding={looseFraming ? HOME_MAP_PREVIEW_BOUNDS_PADDING : undefined}
          defaultZoom={looseFraming ? HOME_MAP_PREVIEW_DEFAULT_ZOOM : BROWSE_MAP_DEFAULT_ZOOM}
          singleEventZoom={looseFraming ? HOME_MAP_PREVIEW_SINGLE_EVENT_ZOOM : BROWSE_MAP_SINGLE_EVENT_ZOOM}
        />
      )}
      {showEventMarkers
        ? mappable.map((event) => (
            <Marker
              key={event.id}
              position={[event.lat, event.lng]}
              icon={createEventPinIcon(false, false)}
              interactive={false}
            />
          ))
        : null}
    </MapContainer>
  )
}

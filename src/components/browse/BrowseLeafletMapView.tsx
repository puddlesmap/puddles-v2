import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Event } from '../../types/event'
import { EventCard } from '../EventCard'
import { MapControls } from './MapControls'
import { MapInstanceCapture } from './MapInstanceCapture'
import { MapFitEvents, MapSearchAreaDetector } from './MapSearchAreaDetector'
import { MapUserLocation } from './MapUserLocation'
import { createEventPinIcon } from './mapPins'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useUserLocation } from '../../hooks/useUserLocation'
import {
  boundsBoxFromLeaflet,
  filterEventsInBounds,
  getEventsMapCenter,
  getEventsWithCoordinates,
} from '../../utils/mapBounds'
import 'leaflet/dist/leaflet.css'

interface BrowseMapViewProps {
  events: Event[]
  feedKey: string
  onOpenEvent: (event: Event) => void
}

const MAP_TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
const MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

const LOCAL_ZOOM = 14

function MapResizeHandler() {
  const map = useMap()

  useEffect(() => {
    function invalidate() {
      map.invalidateSize({ animate: false })
    }

    invalidate()
    window.addEventListener('resize', invalidate)

    const container = map.getContainer()
    const target = container.parentElement ?? container
    const observer = new ResizeObserver(invalidate)
    observer.observe(target)

    return () => {
      window.removeEventListener('resize', invalidate)
      observer.disconnect()
    }
  }, [map])

  return null
}

function MapPanToEvent({
  event,
  panTrigger,
}: {
  event: Event | null
  panTrigger: number
}) {
  const map = useMap()

  useEffect(() => {
    if (!event || panTrigger === 0) return
    if (!Number.isFinite(event.lat) || !Number.isFinite(event.lng)) return
    map.flyTo([event.lat, event.lng], Math.max(map.getZoom(), LOCAL_ZOOM), { duration: 0.45 })
  }, [event, panTrigger, map])

  return null
}

function MapLocateHandler({
  coords,
  trigger,
}: {
  coords: { lat: number; lng: number } | null
  trigger: number
}) {
  const map = useMap()

  useEffect(() => {
    if (!coords || trigger === 0) return
    map.flyTo([coords.lat, coords.lng], LOCAL_ZOOM, { duration: 0.45 })
  }, [coords, trigger, map])

  return null
}

function MapTileLayer() {
  return (
    <TileLayer
      attribution={MAP_TILE_ATTRIBUTION}
      url={MAP_TILE_URL}
      subdomains={['a', 'b', 'c', 'd']}
      maxZoom={20}
    />
  )
}

export function BrowseLeafletMapView({ events, feedKey, onOpenEvent }: BrowseMapViewProps) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const { coords: userCoords, error: locationError, isRequesting, requestLocation, clearError } =
    useUserLocation()

  const [areaBounds, setAreaBounds] = useState<ReturnType<typeof boundsBoxFromLeaflet> | null>(null)
  const [showSearchArea, setShowSearchArea] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null)
  const [panTrigger, setPanTrigger] = useState(0)
  const [locateTrigger, setLocateTrigger] = useState(0)
  const [searchGeneration, setSearchGeneration] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [leafletMap, setLeafletMap] = useState<L.Map | null>(null)

  const handleMapReady = useCallback((map: L.Map) => {
    setLeafletMap(map)
  }, [])

  const displayEvents = useMemo(() => {
    if (!areaBounds) return events
    return filterEventsInBounds(events, areaBounds)
  }, [events, areaBounds])

  const mappableEvents = useMemo(() => getEventsWithCoordinates(displayEvents), [displayEvents])
  const mapCenter = getEventsMapCenter(mappableEvents)
  const selectedEvent = displayEvents.find((event) => event.id === selectedEventId) ?? null

  const resetAreaSearch = useCallback(() => {
    setAreaBounds(null)
    setShowSearchArea(false)
  }, [])

  useEffect(() => {
    setPanTrigger(0)
    setHoveredEventId(null)
    setSearchGeneration(0)
    setLeafletMap(null)
    resetAreaSearch()
  }, [feedKey, resetAreaSearch])

  useEffect(() => {
    if (events.length === 0) {
      setSelectedEventId(null)
      return
    }

    setSelectedEventId((current) => {
      const pool = areaBounds ? filterEventsInBounds(events, areaBounds) : events
      if (current && pool.some((event) => event.id === current)) return current
      const mappable = getEventsWithCoordinates(pool)
      return mappable[0]?.id ?? pool[0]?.id ?? null
    })
  }, [feedKey, events, areaBounds])

  useEffect(() => {
    if (!selectedEventId) return
    const node = cardRefs.current[selectedEventId]
    node?.scrollIntoView({
      block: 'nearest',
      inline: isMobile ? 'center' : 'nearest',
      behavior: 'smooth',
    })
  }, [selectedEventId, isMobile])

  function handleMobilePreviewScroll() {
    const container = listRef.current
    if (!container) return

    const center = container.scrollLeft + container.clientWidth / 2
    let closestId: string | null = null
    let closestDistance = Number.POSITIVE_INFINITY

    for (const event of mappableEvents) {
      const node = cardRefs.current[event.id]
      if (!node) continue

      const nodeCenter = node.offsetLeft + node.offsetWidth / 2
      const distance = Math.abs(center - nodeCenter)
      if (distance < closestDistance) {
        closestDistance = distance
        closestId = event.id
      }
    }

    if (closestId && closestId !== selectedEventId) {
      setSelectedEventId(closestId)
    }
  }

  function selectEvent(event: Event) {
    setSelectedEventId(event.id)
    setPanTrigger((value) => value + 1)
  }

  function handleCardClick(event: Event) {
    if (selectedEventId === event.id) {
      onOpenEvent(event)
      return
    }
    selectEvent(event)
  }

  function handleCardHover(eventId: string | null) {
    if (isMobile) return
    setHoveredEventId(eventId)
  }

  async function handleLocate() {
    const nextCoords = await requestLocation()
    if (nextCoords) {
      setLocateTrigger((value) => value + 1)
    }
  }

  function handleSearchArea(map: L.Map) {
    const bounds = boundsBoxFromLeaflet(map.getBounds())
    setAreaBounds(bounds)
    setShowSearchArea(false)
    setSearchGeneration((value) => value + 1)
    setSelectedEventId((current) => {
      const inBounds = filterEventsInBounds(events, bounds)
      const mappable = getEventsWithCoordinates(inBounds)
      if (current && inBounds.some((event) => event.id === current)) return current
      return mappable[0]?.id ?? inBounds[0]?.id ?? null
    })
  }

  function renderMapMarkers() {
    return (
      <>
        {mappableEvents.map((event) => {
          const isSelected = selectedEventId === event.id
          const isHovered = hoveredEventId === event.id

          return (
            <Marker
              key={`${event.id}-${isSelected ? 's' : 'n'}-${isHovered ? 'h' : 'n'}`}
              position={[event.lat, event.lng]}
              icon={createEventPinIcon(isSelected, isHovered)}
              zIndexOffset={isSelected ? 1000 : isHovered ? 500 : 0}
              eventHandlers={{
                click: () => selectEvent(event),
                mouseover: () => handleCardHover(event.id),
                mouseout: () => handleCardHover(null),
              }}
            />
          )
        })}
        <MapUserLocation coords={userCoords} />
        <MapFitEvents events={mappableEvents} resetKey={`${feedKey}|${searchGeneration}`} />
        <MapSearchAreaDetector
          resetKey={`${feedKey}|${searchGeneration}`}
          active={!showSearchArea}
          onMovedAway={() => setShowSearchArea(true)}
          onReset={() => setShowSearchArea(false)}
        />
        <MapPanToEvent event={selectedEvent} panTrigger={panTrigger} />
        <MapLocateHandler coords={userCoords} trigger={locateTrigger} />
        <MapInstanceCapture onReady={handleMapReady} />
      </>
    )
  }

  function renderMapControls() {
    return (
      <MapControls
        map={leafletMap}
        showSearchArea={showSearchArea}
        locationMessage={locationError}
        isLocating={isRequesting}
        onSearchArea={() => {
          if (leafletMap) handleSearchArea(leafletMap)
        }}
        onLocate={handleLocate}
        onDismissMessage={clearError}
      />
    )
  }

  const eventCount = displayEvents.length

  if (isMobile) {
    return (
      <div key={feedKey} className="browse-map-shell browse-map-shell--mobile browse-map-enter">
        <p className="browse-map-results-count layout-container">
          {eventCount} {eventCount === 1 ? 'event' : 'events'}
        </p>

        <div className="browse-map-panel-mobile">
          <MapContainer
            center={mapCenter}
            zoom={12}
            className="browse-map-canvas"
            scrollWheelZoom
            zoomControl={false}
          >
            <MapTileLayer />
            <MapResizeHandler />
            {renderMapMarkers()}
          </MapContainer>
          {renderMapControls()}

          {mappableEvents.length > 0 && (
            <div className="browse-map-preview-sheet">
              <div
                ref={listRef}
                className="browse-map-preview"
                onScroll={handleMobilePreviewScroll}
              >
                {mappableEvents.map((event) => {
                  const isSelected = selectedEventId === event.id

                  return (
                    <div
                      key={event.id}
                      ref={(node) => {
                        cardRefs.current[event.id] = node
                      }}
                      className="browse-map-preview-slot"
                      data-event-id={event.id}
                    >
                      <EventCard
                        event={event}
                        variant="map-preview-sheet"
                        discovery
                        selected={isSelected}
                        onClick={() => handleCardClick(event)}
                      />
                    </div>
                  )
                })}
              </div>
              <span className="browse-map-preview-handle" aria-hidden />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div key={feedKey} className="browse-map-shell browse-map-enter">
      <div className="browse-map-split">
        <aside className="browse-map-results">
          <div className="browse-map-results-inner">
            <p className="browse-results-count">
              {eventCount} {eventCount === 1 ? 'event' : 'events'}
            </p>
            <div ref={listRef} className="browse-map-grid">
              {displayEvents.length === 0 ? (
                <p className="browse-map-empty">No events in this map area.</p>
              ) : (
                displayEvents.map((event) => {
                  const isSelected = selectedEventId === event.id
                  const isHovered = hoveredEventId === event.id

                  return (
                    <div
                      key={event.id}
                      ref={(node) => {
                        cardRefs.current[event.id] = node
                      }}
                      className="browse-map-card-slot"
                      onMouseEnter={() => handleCardHover(event.id)}
                      onMouseLeave={() => handleCardHover(null)}
                    >
                      <EventCard
                        event={event}
                        variant="map-grid"
                        discovery
                        selected={isSelected}
                        hovered={isHovered}
                        onClick={() => handleCardClick(event)}
                      />
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </aside>

        <div className="browse-map-map">
          <MapContainer
            center={mapCenter}
            zoom={12}
            className="browse-map-canvas"
            scrollWheelZoom
            zoomControl={false}
          >
            <MapTileLayer />
            <MapResizeHandler />
            {renderMapMarkers()}
          </MapContainer>
          {renderMapControls()}
        </div>
      </div>
    </div>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Event } from '../../types/event'
import type { BrowseFilters } from '../../utils/filters'
import { getBrowseResultsSummary } from '../../utils/browseResultsCopy'
import { EventCard } from '../EventCard'
import { MapControls } from './MapControls'
import { MapInstanceCapture } from './MapInstanceCapture'
import { MapFitEvents, MapSearchAreaDetector } from './MapSearchAreaDetector'
import { MapUserLocation } from './MapUserLocation'
import { createEventPinIcon } from './mapPins'
import {
  BROWSE_MAP_DEFAULT_ZOOM,
  BROWSE_MAP_FOCUS_ZOOM,
} from './mapViewConfig'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useBrowseMapListTwoColumn } from '../../hooks/useBrowseMapListTwoColumn'
import { useBrowseMapInteraction } from '../../hooks/useBrowseMapInteraction'
import { useUserLocation } from '../../hooks/useUserLocation'
import {
  boundsBoxFromLeaflet,
  filterEventsInBounds,
  getEventsMapCenter,
} from '../../utils/mapBounds'
import 'leaflet/dist/leaflet.css'

interface BrowseLeafletMapViewProps {
  events: Event[]
  feedKey: string
  browseFilters: BrowseFilters
  onOpenEvent: (event: Event) => void
  interactionMode?: 'default' | 'connected'
}

const MAP_TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
const MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

const LOCAL_ZOOM = BROWSE_MAP_FOCUS_ZOOM

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

export function BrowseLeafletMapView({
  events,
  feedKey,
  browseFilters,
  onOpenEvent,
  interactionMode = 'default',
}: BrowseLeafletMapViewProps) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const { coords: userCoords, error: locationError, isRequesting, requestLocation, clearError } =
    useUserLocation()

  const [areaBounds, setAreaBounds] = useState<ReturnType<typeof boundsBoxFromLeaflet> | null>(null)
  const [showSearchArea, setShowSearchArea] = useState(false)
  const [locateTrigger, setLocateTrigger] = useState(0)
  const [searchGeneration, setSearchGeneration] = useState(0)
  const resultsRef = useRef<HTMLElement>(null)
  const isTwoColumnMapList = useBrowseMapListTwoColumn(resultsRef)
  const [leafletMap, setLeafletMap] = useState<L.Map | null>(null)

  const {
    listRef,
    cardRefs,
    displayEvents,
    mappableEvents,
    mobileCarouselEvents,
    selectedEvent,
    panTrigger,
    mobileLocationLabel,
    markerGroups,
    selectEvent,
    selectLocationGroup,
    handleCardClick,
    handleCardHover,
    handleMobilePreviewScroll,
    isEventSelected,
    isEventFlashing,
    isLocationGroupSelected,
    isLocationGroupHovered,
    hoveredEventId,
    setSelectedEventId,
    setFocusedLocationKey,
  } = useBrowseMapInteraction({
    events,
    feedKey,
    areaBounds,
    isMobile,
    onOpenEvent,
    interactionMode,
  })

  const handleMapReady = useCallback((map: L.Map) => {
    setLeafletMap(map)
  }, [])

  const mapCenter = getEventsMapCenter(mappableEvents)

  const resetAreaSearch = useCallback(() => {
    setAreaBounds(null)
    setShowSearchArea(false)
  }, [])

  useEffect(() => {
    setSearchGeneration(0)
    setLeafletMap(null)
    resetAreaSearch()
  }, [feedKey, resetAreaSearch])

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
      const mappable = inBounds.filter((event) => Number.isFinite(event.lat) && Number.isFinite(event.lng))
      if (current && inBounds.some((event) => event.id === current)) return current
      return mappable[0]?.id ?? inBounds[0]?.id ?? null
    })
    setFocusedLocationKey(null)
  }

  function renderMapMarkers() {
    if (markerGroups) {
      return (
        <>
          {markerGroups.map((group) => {
            const representative = group.events[0]
            const isSelected = isLocationGroupSelected(group)
            const isHovered = isLocationGroupHovered(group)

            return (
              <Marker
                key={`${group.key}-${isSelected ? 's' : 'n'}-${isHovered ? 'h' : 'n'}`}
                position={[representative.lat, representative.lng]}
                icon={createEventPinIcon(isSelected, isHovered)}
                zIndexOffset={isSelected ? 1000 : isHovered ? 500 : 0}
                eventHandlers={{
                  click: () => selectLocationGroup(group),
                  mouseover: () => handleCardHover(representative.id),
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

    return (
      <>
        {mappableEvents.map((event) => {
          const isSelected = isEventSelected(event.id)
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
  const resultsSummary = getBrowseResultsSummary(
    eventCount,
    browseFilters.city,
    browseFilters.day,
  )

  if (isMobile) {
    return (
      <div key={feedKey} className="browse-map-shell browse-map-shell--mobile browse-map-enter">
        <p className="browse-map-results-count layout-container">
          {resultsSummary}
        </p>

        <div className="browse-map-panel-mobile">
          <MapContainer
            center={mapCenter}
            zoom={BROWSE_MAP_DEFAULT_ZOOM}
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
              {mobileLocationLabel ? (
                <p className="browse-map-preview-location-label">{mobileLocationLabel}</p>
              ) : null}
              <div
                ref={listRef}
                className="browse-map-preview"
                onScroll={handleMobilePreviewScroll}
              >
                {mobileCarouselEvents.map((event) => (
                  <div
                    key={event.id}
                    ref={(node) => {
                      cardRefs.current[event.id] = node
                    }}
                    className={[
                      'browse-map-preview-slot',
                      isEventFlashing(event.id) ? 'browse-map-preview-slot--flash' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    data-event-id={event.id}
                  >
                    <EventCard
                      event={event}
                      variant="map-preview-sheet"
                      discovery
                      selected={isEventSelected(event.id)}
                      onClick={() => handleCardClick(event)}
                    />
                  </div>
                ))}
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
        <aside ref={resultsRef} className="browse-map-results">
          <div className="browse-map-results-inner">
            <p className="browse-results-count">{resultsSummary}</p>
            <div ref={listRef} className="browse-map-grid">
              {displayEvents.length === 0 ? (
                <p className="browse-map-empty">No events in this map area.</p>
              ) : (
                displayEvents.map((event) => (
                  <div
                    key={event.id}
                    ref={(node) => {
                      cardRefs.current[event.id] = node
                    }}
                    className={[
                      'browse-map-card-slot',
                      isEventFlashing(event.id) ? 'browse-map-card-slot--flash' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onMouseEnter={() => handleCardHover(event.id)}
                    onMouseLeave={() => handleCardHover(null)}
                  >
                    <EventCard
                      event={event}
                      variant={isTwoColumnMapList ? 'grid' : 'map-grid'}
                      discovery
                      selected={isEventSelected(event.id)}
                      hovered={hoveredEventId === event.id}
                      onClick={() => handleCardClick(event)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        <div className="browse-map-map">
          <MapContainer
            center={mapCenter}
            zoom={BROWSE_MAP_DEFAULT_ZOOM}
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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Map } from '@vis.gl/react-google-maps'
import type { Event } from '../../types/event'
import type { BrowseFilters } from '../../utils/filters'
import { getBrowseResultsSummary } from '../../utils/browseResultsCopy'
import { EventCard } from '../EventCard'
import { GoogleMapProvider } from '../maps/GoogleMapProvider'
import { EventGoogleMarker } from './EventGoogleMarker'
import {
  GoogleMapFitEvents,
  GoogleMapInstanceCapture,
  GoogleMapLocateHandler,
  GoogleMapPanToEvent,
  GoogleMapSearchAreaDetector,
  GoogleUserLocationMarker,
} from './GoogleMapBehaviors'
import { MapControls } from './MapControls'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useBrowseMapListTwoColumn } from '../../hooks/useBrowseMapListTwoColumn'
import { useUserLocation } from '../../hooks/useUserLocation'
import {
  filterEventsInBounds,
  getEventsMapCenter,
  getEventsWithCoordinates,
} from '../../utils/mapBounds'
import { boundsBoxFromGoogle, MUTED_GOOGLE_MAP_STYLES } from '../../utils/googleMaps'
import { BROWSE_MAP_DEFAULT_ZOOM } from './mapViewConfig'

interface BrowseGoogleMapViewProps {
  events: Event[]
  feedKey: string
  browseFilters: BrowseFilters
  onOpenEvent: (event: Event) => void
}

export function BrowseGoogleMapView({ events, feedKey, browseFilters, onOpenEvent }: BrowseGoogleMapViewProps) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const { coords: userCoords, error: locationError, isRequesting, requestLocation, clearError } =
    useUserLocation()

  const [areaBounds, setAreaBounds] = useState<ReturnType<typeof boundsBoxFromGoogle> | null>(null)
  const [showSearchArea, setShowSearchArea] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null)
  const [panTrigger, setPanTrigger] = useState(0)
  const [locateTrigger, setLocateTrigger] = useState(0)
  const [searchGeneration, setSearchGeneration] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<HTMLElement>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const isTwoColumnMapList = useBrowseMapListTwoColumn(resultsRef)
  const [googleMap, setGoogleMap] = useState<google.maps.Map | null>(null)

  const handleMapReady = useCallback((map: google.maps.Map) => {
    setGoogleMap(map)
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
    setGoogleMap(null)
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

  function handleSearchArea(map: google.maps.Map) {
    const bounds = map.getBounds()
    if (!bounds) return

    const nextBounds = boundsBoxFromGoogle(bounds)
    setAreaBounds(nextBounds)
    setShowSearchArea(false)
    setSearchGeneration((value) => value + 1)
    setSelectedEventId((current) => {
      const inBounds = filterEventsInBounds(events, nextBounds)
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
            <EventGoogleMarker
              key={`${event.id}-${isSelected ? 's' : 'n'}-${isHovered ? 'h' : 'n'}`}
              event={event}
              selected={isSelected}
              hovered={isHovered}
              onSelect={() => selectEvent(event)}
              onHover={handleCardHover}
            />
          )
        })}
        <GoogleUserLocationMarker coords={userCoords} />
        <GoogleMapFitEvents events={mappableEvents} resetKey={`${feedKey}|${searchGeneration}`} />
        <GoogleMapSearchAreaDetector
          resetKey={`${feedKey}|${searchGeneration}`}
          active={!showSearchArea}
          onMovedAway={() => setShowSearchArea(true)}
          onReset={() => setShowSearchArea(false)}
        />
        <GoogleMapPanToEvent event={selectedEvent} panTrigger={panTrigger} />
        <GoogleMapLocateHandler coords={userCoords} trigger={locateTrigger} />
        <GoogleMapInstanceCapture onReady={handleMapReady} />
      </>
    )
  }

  function renderMapControls() {
    return (
      <MapControls
        onZoomIn={() => {
          const zoom = googleMap?.getZoom()
          if (zoom !== undefined) googleMap?.setZoom(zoom + 1)
        }}
        onZoomOut={() => {
          const zoom = googleMap?.getZoom()
          if (zoom !== undefined) googleMap?.setZoom(zoom - 1)
        }}
        zoomEnabled={Boolean(googleMap)}
        showSearchArea={showSearchArea}
        locationMessage={locationError}
        isLocating={isRequesting}
        onSearchArea={() => {
          if (googleMap) handleSearchArea(googleMap)
        }}
        onLocate={handleLocate}
        onDismissMessage={clearError}
      />
    )
  }

  function renderGoogleMap(className: string) {
    return (
      <Map
        defaultCenter={{ lat: mapCenter[0], lng: mapCenter[1] }}
        defaultZoom={BROWSE_MAP_DEFAULT_ZOOM}
        className={className}
        gestureHandling="greedy"
        disableDefaultUI
        clickableIcons={false}
        styles={MUTED_GOOGLE_MAP_STYLES}
        backgroundColor="#f5f3ef"
      >
        {renderMapMarkers()}
      </Map>
    )
  }

  const eventCount = displayEvents.length
  const resultsSummary = getBrowseResultsSummary(
    eventCount,
    browseFilters.city,
    browseFilters.day,
  )

  const mapContent = isMobile ? (
    <div key={feedKey} className="browse-map-shell browse-map-shell--mobile browse-map-enter">
      <p className="browse-map-results-count layout-container">
        {resultsSummary}
      </p>

      <div className="browse-map-panel-mobile">
        <GoogleMapProvider>
          <div className="browse-map-canvas browse-map-canvas--google">
            {renderGoogleMap('browse-map-google-inner')}
          </div>
        </GoogleMapProvider>
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
  ) : (
    <div key={feedKey} className="browse-map-shell browse-map-enter">
      <div className="browse-map-split">
        <aside ref={resultsRef} className="browse-map-results">
          <div className="browse-map-results-inner">
            <p className="browse-results-count">{resultsSummary}</p>
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
                        variant={isTwoColumnMapList ? 'grid' : 'map-grid'}
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
          <GoogleMapProvider>
            <div className="browse-map-canvas browse-map-canvas--google">
              {renderGoogleMap('browse-map-google-inner')}
            </div>
          </GoogleMapProvider>
          {renderMapControls()}
        </div>
      </div>
    </div>
  )

  return mapContent
}

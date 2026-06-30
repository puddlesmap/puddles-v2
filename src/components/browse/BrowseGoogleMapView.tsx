import { useCallback, useEffect, useRef, useState } from 'react'
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
import { useBrowseMapInteraction } from '../../hooks/useBrowseMapInteraction'
import { useUserLocation } from '../../hooks/useUserLocation'
import {
  filterEventsInBounds,
  getEventsMapCenter,
} from '../../utils/mapBounds'
import { boundsBoxFromGoogle, MUTED_GOOGLE_MAP_STYLES } from '../../utils/googleMaps'
import { BROWSE_MAP_DEFAULT_ZOOM } from './mapViewConfig'

interface BrowseGoogleMapViewProps {
  events: Event[]
  feedKey: string
  browseFilters: BrowseFilters
  onOpenEvent: (event: Event) => void
  interactionMode?: 'default' | 'connected'
}

export function BrowseGoogleMapView({
  events,
  feedKey,
  browseFilters,
  onOpenEvent,
  interactionMode = 'default',
}: BrowseGoogleMapViewProps) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const { coords: userCoords, error: locationError, isRequesting, requestLocation, clearError } =
    useUserLocation()

  const [areaBounds, setAreaBounds] = useState<ReturnType<typeof boundsBoxFromGoogle> | null>(null)
  const [showSearchArea, setShowSearchArea] = useState(false)
  const [locateTrigger, setLocateTrigger] = useState(0)
  const [searchGeneration, setSearchGeneration] = useState(0)
  const resultsRef = useRef<HTMLElement>(null)
  const isTwoColumnMapList = useBrowseMapListTwoColumn(resultsRef)
  const [googleMap, setGoogleMap] = useState<google.maps.Map | null>(null)

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

  const handleMapReady = useCallback((map: google.maps.Map) => {
    setGoogleMap(map)
  }, [])

  const mapCenter = getEventsMapCenter(mappableEvents)

  const resetAreaSearch = useCallback(() => {
    setAreaBounds(null)
    setShowSearchArea(false)
  }, [])

  useEffect(() => {
    setSearchGeneration(0)
    setGoogleMap(null)
    resetAreaSearch()
  }, [feedKey, resetAreaSearch])

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
              <EventGoogleMarker
                key={`${group.key}-${isSelected ? 's' : 'n'}-${isHovered ? 'h' : 'n'}`}
                event={representative}
                selected={isSelected}
                hovered={isHovered}
                onSelect={() => selectLocationGroup(group)}
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

    return (
      <>
        {mappableEvents.map((event) => {
          const isSelected = isEventSelected(event.id)
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

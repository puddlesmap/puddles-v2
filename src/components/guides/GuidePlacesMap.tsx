import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Map, useApiIsLoaded, useMap } from '@vis.gl/react-google-maps'
import {
  HALLOWEEN_GUIDE_PLACES,
  type GuideMapCategory,
  type GuidePlace,
} from '../../data/halloweenGuide'
import { GoogleMapProvider } from '../maps/GoogleMapProvider'
import { GoogleMapStyles } from '../browse/GoogleMapBehaviors'
import { hasGoogleMapsApiKey, MUTED_GOOGLE_MAP_STYLES } from '../../utils/googleMaps'

const TRADITION_FILL = '#e07a3d'
const NEIGHBORHOOD_FILL = '#66c5f9'
const HOLIDAY_FILL = '#1D743F'
const HOLIDAY_ALT_FILL = '#E39B7B'
const NEUTRAL_FILL = '#1D743F'
const PIN_SPREAD = 24

type VenueCluster = {
  key: string
  lat: number
  lng: number
  places: GuidePlace[]
  color: string
  label: string
}

function placeId(idPrefix: string, slug: string) {
  return `${idPrefix}-${slug}`
}

function pinUrl(fill: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 44" width="28" height="44">
    <path fill="${fill}" d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 30 14 30s14-19.5 14-30C28 6.268 21.732 0 14 0z"/>
    <circle fill="#ffffff" cx="14" cy="13.5" r="5.5"/>
  </svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function mapBounds(points: { lat: number; lng: number }[]) {
  const lats = points.map((p) => p.lat)
  const lngs = points.map((p) => p.lng)
  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs),
    padding: 56,
  }
}

function colorForPlace(
  place: GuidePlace,
  categories: GuideMapCategory[] | undefined,
  pinTheme: 'halloween' | 'holiday',
) {
  if (categories?.length && place.categoryId) {
    return categories.find((c) => c.id === place.categoryId)?.color ?? NEUTRAL_FILL
  }
  if (pinTheme === 'holiday') {
    return place.group === 'tradition' ? HOLIDAY_FILL : HOLIDAY_ALT_FILL
  }
  return place.group === 'tradition' ? TRADITION_FILL : NEIGHBORHOOD_FILL
}

function venueColor(
  group: GuidePlace[],
  categories: GuideMapCategory[] | undefined,
  pinTheme: 'halloween' | 'holiday',
) {
  const colors = [...new Set(group.map((p) => colorForPlace(p, categories, pinTheme)))]
  if (colors.length === 1) return colors[0]
  return NEUTRAL_FILL
}

function venueLabel(group: GuidePlace[]) {
  return group[0].venue || group[0].city || group[0].name
}

function clusterKey(place: GuidePlace) {
  if (place.venueKey) return place.venueKey
  return `${place.lat.toFixed(4)},${place.lng.toFixed(4)}`
}

function buildClusters(
  places: GuidePlace[],
  categories: GuideMapCategory[] | undefined,
  pinTheme: 'halloween' | 'holiday',
): VenueCluster[] {
  const byKey: Record<string, GuidePlace[]> = {}
  for (const place of places) {
    const key = clusterKey(place)
    if (byKey[key]) byKey[key].push(place)
    else byKey[key] = [place]
  }
  return Object.entries(byKey).map(([key, group]) => ({
    key,
    lat: group[0].lat,
    lng: group[0].lng,
    places: group,
    color: venueColor(group, categories, pinTheme),
    label: venueLabel(group),
  }))
}

function tipShiftX(venues: VenueCluster[], venue: VenueCluster) {
  const index = venues.indexOf(venue)
  const earlier = venues.filter((other, otherIndex) => {
    if (otherIndex >= index) return false
    return Math.abs(other.lat - venue.lat) < 0.008 && Math.abs(other.lng - venue.lng) < 0.008
  })
  if (earlier.length === 0) return 0
  return PIN_SPREAD * (earlier.length % 2 === 0 ? 1 : -1) * Math.ceil(earlier.length / 1)
}

function FitBounds({ pointsKey, points }: { pointsKey: string; points: { lat: number; lng: number }[] }) {
  const map = useMap()
  useEffect(() => {
    if (!map || points.length === 0 || typeof google === 'undefined') return
    const bounds = new google.maps.LatLngBounds()
    for (const p of points) bounds.extend(p)
    map.fitBounds(bounds, 56)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional key
  }, [map, pointsKey])
  return null
}

function VenueMarkers({
  venues,
  selectedSlug,
  onSelect,
  apiLoaded,
}: {
  venues: VenueCluster[]
  selectedSlug: string | null
  onSelect: (slug: string | null) => void
  apiLoaded: boolean
}) {
  const map = useMap()
  const markersRef = useRef<google.maps.Marker[]>([])

  useEffect(() => {
    if (!map || !apiLoaded || typeof google === 'undefined') return

    markersRef.current.forEach((marker) => {
      google.maps.event.clearInstanceListeners(marker)
      marker.setMap(null)
    })
    markersRef.current = []

    const size = new google.maps.Size(28, 44)
    const markers = venues.map((venue) => {
      const shiftX = tipShiftX(venues, venue)
      const marker = new google.maps.Marker({
        map,
        position: { lat: venue.lat, lng: venue.lng },
        icon: {
          url: pinUrl(venue.color),
          scaledSize: size,
          anchor: new google.maps.Point(14 - shiftX, 44),
        },
        zIndex: venue.places.some((p) => p.slug === selectedSlug)
          ? 1000
          : venue.places.length > 1
            ? 5
            : 1,
        title:
          venue.places.length > 1
            ? `${venue.places.length} events at ${venue.label}`
            : venue.places[0].name,
      })
      marker.addListener('click', () => onSelect(venue.places[0].slug))
      return marker
    })
    markersRef.current = markers

    return () => {
      markers.forEach((marker) => {
        google.maps.event.clearInstanceListeners(marker)
        marker.setMap(null)
      })
      markersRef.current = []
    }
  }, [map, apiLoaded, venues, onSelect, selectedSlug])

  return null
}

function VenueEventCard({ place, idPrefix }: { place: GuidePlace; idPrefix: string }) {
  const venue = place.venue || place.city
  return (
    <div className="guide-map__event-block">
      <p className="guide-map__event-row-title">{place.name}</p>
      {place.date ? <p className="guide-map__event-row-meta">{place.date}</p> : null}
      {venue ? <p className="guide-map__event-row-meta">{venue}</p> : null}
      <a className="guide-map__more" href={`#${placeId(idPrefix, place.slug)}`}>
        Read in guide →
      </a>
    </div>
  )
}

function VenuePreviewBody({
  venue,
  idPrefix,
  onClose,
}: {
  venue: VenueCluster
  idPrefix: string
  onClose?: () => void
}) {
  const [eventIndex, setEventIndex] = useState(0)
  const multi = venue.places.length > 1
  const total = venue.places.length
  const safeIndex = multi ? Math.min(eventIndex, total - 1) : 0
  const place = venue.places[safeIndex]

  useEffect(() => {
    setEventIndex(0)
  }, [venue.key])

  const goPrev = () => setEventIndex((i) => (i - 1 + total) % total)
  const goNext = () => setEventIndex((i) => (i + 1) % total)

  return (
    <div className={`guide-map__popup${multi ? ' guide-map__popup--multi' : ''}`}>
      {onClose ? (
        <button type="button" className="guide-map__popup-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      ) : null}
      {multi ? (
        <p className="guide-map__popup-count" aria-live="polite">
          {safeIndex + 1}/{total}
        </p>
      ) : null}
      <VenueEventCard place={place} idPrefix={idPrefix} />
      {multi ? (
        <div className="guide-map__popup-nav">
          <button
            type="button"
            className="guide-map__popup-nav-btn"
            onClick={goPrev}
            aria-label="Previous event"
          >
            ‹
          </button>
          <button
            type="button"
            className="guide-map__popup-nav-btn"
            onClick={goNext}
            aria-label="Next event"
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  )
}

type PinAnchor = { x: number; y: number; preferLeft: boolean }

/** Reports container-pixel position of a lat/lng so the sheet can sit beside the pin on desktop. */
function PinAnchorReporter({
  lat,
  lng,
  onAnchor,
}: {
  lat: number
  lng: number
  onAnchor: (anchor: PinAnchor | null) => void
}) {
  const map = useMap()

  useEffect(() => {
    if (!map || typeof google === 'undefined') {
      onAnchor(null)
      return
    }

    class GuideProjectionOverlay extends google.maps.OverlayView {
      onAdd() {}
      draw() {}
      onRemove() {}
    }
    const overlay = new GuideProjectionOverlay()
    overlay.setMap(map)

    const update = () => {
      const div = map.getDiv()
      if (!div) return
      const projection = overlay.getProjection()
      const point = projection?.fromLatLngToContainerPixel(new google.maps.LatLng(lat, lng))
      if (!point) return
      const preferLeft = point.x > div.clientWidth * 0.62
      onAnchor({ x: point.x, y: point.y, preferLeft })
    }

    const idleListener = map.addListener('idle', update)
    const boundsListener = map.addListener('bounds_changed', update)
    // First paint after overlay projection is ready
    const ready = window.setTimeout(update, 0)

    return () => {
      window.clearTimeout(ready)
      idleListener.remove()
      boundsListener.remove()
      overlay.setMap(null)
      onAnchor(null)
    }
  }, [map, lat, lng, onAnchor])

  return null
}

function GuidePlacesMapCanvas({
  idPrefix,
  places,
  selectedSlug,
  onSelect,
  pinTheme,
  categories,
}: {
  idPrefix: string
  places: GuidePlace[]
  selectedSlug: string | null
  onSelect: (slug: string | null) => void
  pinTheme: 'halloween' | 'holiday'
  categories?: GuideMapCategory[]
}) {
  const apiLoaded = useApiIsLoaded()
  const venues = useMemo(
    () => buildClusters(places, categories, pinTheme),
    [places, categories, pinTheme],
  )
  const selectedVenue = venues.find((v) => v.places.some((p) => p.slug === selectedSlug)) ?? null
  const pointsKey = useMemo(
    () => venues.map((v) => `${v.key}:${v.lat},${v.lng}`).join('|'),
    [venues],
  )
  const defaultBounds = useMemo(
    () => mapBounds(venues.length > 0 ? venues : places),
    [venues, places],
  )
  const [pinAnchor, setPinAnchor] = useState<PinAnchor | null>(null)
  const [desktop, setDesktop] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const sync = () => setDesktop(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const onAnchor = useCallback((anchor: PinAnchor | null) => {
    setPinAnchor(anchor)
  }, [])

  const multi = Boolean(selectedVenue && selectedVenue.places.length > 1)
  const pinStyle =
    desktop && selectedVenue && pinAnchor
      ? {
          left: `${pinAnchor.x}px`,
          top: `${pinAnchor.y}px`,
          right: 'auto' as const,
          bottom: 'auto' as const,
          marginInline: 0,
          transform: pinAnchor.preferLeft
            ? 'translate(calc(-100% - 14px), -70%)'
            : 'translate(14px, -70%)',
        }
      : undefined

  return (
    <>
      <Map
        defaultBounds={defaultBounds}
        className="guide-map__canvas"
        gestureHandling="cooperative"
        disableDefaultUI
        zoomControl
        clickableIcons={false}
        renderingType="RASTER"
        styles={MUTED_GOOGLE_MAP_STYLES}
        backgroundColor="#f8f9fb"
        onClick={() => onSelect(null)}
      >
        <GoogleMapStyles styles={MUTED_GOOGLE_MAP_STYLES} />
        <FitBounds pointsKey={pointsKey} points={venues} />
        <VenueMarkers
          venues={venues}
          selectedSlug={selectedSlug}
          onSelect={onSelect}
          apiLoaded={apiLoaded}
        />
        {selectedVenue && desktop ? (
          <PinAnchorReporter lat={selectedVenue.lat} lng={selectedVenue.lng} onAnchor={onAnchor} />
        ) : null}
      </Map>
      {selectedVenue ? (
        <div
          className={`guide-map__sheet${multi ? ' guide-map__sheet--multi' : ''}${
            desktop && pinAnchor ? ' guide-map__sheet--pin' : ''
          }`}
          style={pinStyle}
          role="dialog"
          aria-label={selectedVenue.label}
        >
          <VenuePreviewBody
            venue={selectedVenue}
            idPrefix={idPrefix}
            onClose={() => onSelect(null)}
          />
        </div>
      ) : null}
    </>
  )
}

export function GuidePlacesMap({
  idPrefix,
  places = HALLOWEEN_GUIDE_PLACES,
  caption = 'Famous streets and neighborhoods. Pins mark the area, not a specific house.',
  compact = false,
  pinTheme = 'halloween',
  showLegend = true,
  selectedSlug: controlledSlug,
  onSelectSlug,
  categories,
  categorySelect,
  defaultCategoryId,
}: {
  idPrefix: string
  places?: GuidePlace[]
  caption?: string
  compact?: boolean
  pinTheme?: 'halloween' | 'holiday'
  showLegend?: boolean
  selectedSlug?: string | null
  onSelectSlug?: (slug: string | null) => void
  categories?: GuideMapCategory[]
  /** When `single`, only one category is visible at a time (no Show all). */
  categorySelect?: 'single'
  defaultCategoryId?: string
}) {
  const [ready, setReady] = useState(false)
  const [internalSlug, setInternalSlug] = useState<string | null>(null)
  const selectedSlug = controlledSlug !== undefined ? controlledSlug : internalSlug
  const onSelect = onSelectSlug ?? setInternalSlug

  const useCategories = Boolean(categories && categories.length > 0)
  const singleSelect = categorySelect === 'single' && useCategories

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(() => {
    if (!categories?.length) return null
    if (defaultCategoryId && categories.some((c) => c.id === defaultCategoryId)) {
      return defaultCategoryId
    }
    return categories[0].id
  })

  useEffect(() => {
    if (!categories?.length) {
      setActiveCategoryId(null)
      return
    }
    if (defaultCategoryId && categories.some((c) => c.id === defaultCategoryId)) {
      setActiveCategoryId(defaultCategoryId)
      return
    }
    setActiveCategoryId(categories[0].id)
  }, [categories, defaultCategoryId])

  useEffect(() => {
    setReady(true)
  }, [])

  const visiblePlaces = useMemo(() => {
    if (!singleSelect || !activeCategoryId) return places
    return places.filter((p) => p.categoryId === activeCategoryId)
  }, [places, singleSelect, activeCategoryId])

  useEffect(() => {
    if (!selectedSlug) return
    if (!visiblePlaces.some((p) => p.slug === selectedSlug)) {
      onSelect(null)
    }
  }, [visiblePlaces, selectedSlug, onSelect])

  if (places.length === 0) return null

  const showFilterLegend = showLegend && singleSelect && categories

  return (
    <figure className={`guide-map${compact ? ' guide-map--compact' : ''}`}>
      {caption ? <figcaption className="guide-map__caption">{caption}</figcaption> : null}
      <div className="guide-map__frame">
        {ready && hasGoogleMapsApiKey() ? (
          <GoogleMapProvider>
            <GuidePlacesMapCanvas
              idPrefix={idPrefix}
              places={visiblePlaces}
              selectedSlug={selectedSlug}
              onSelect={onSelect}
              pinTheme={pinTheme}
              categories={categories}
            />
          </GoogleMapProvider>
        ) : (
          <div className="guide-map__canvas" />
        )}
      </div>
      {showFilterLegend ? (
        <div className="guide-map__legend-bar">
          <ul className="guide-map__legend guide-map__legend--filter">
            {categories.map((cat) => {
              const pressed = activeCategoryId === cat.id
              return (
                <li key={cat.id}>
                  <button
                    type="button"
                    className={`guide-map__legend-btn${pressed ? ' is-active' : ''}`}
                    aria-pressed={pressed}
                    onClick={() => setActiveCategoryId(cat.id)}
                  >
                    <span
                      className="guide-map__swatch"
                      style={{ background: cat.color }}
                      aria-hidden="true"
                    />
                    <span className="guide-map__legend-label">{cat.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : showLegend && !useCategories ? (
        <ul className="guide-map__legend">
          {pinTheme === 'holiday' ? (
            <>
              <li>
                <span className="guide-map__swatch guide-map__swatch--holiday-featured" />
                Special outings
              </li>
              <li>
                <span className="guide-map__swatch guide-map__swatch--holiday-community" />
                Close-by &amp; community
              </li>
            </>
          ) : (
            <>
              <li>
                <span className="guide-map__swatch guide-map__swatch--tradition" />
                Traditions
              </li>
              <li>
                <span className="guide-map__swatch guide-map__swatch--neighborhood" />
                Neighborhoods
              </li>
            </>
          )}
        </ul>
      ) : null}
    </figure>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { InfoWindow, Map, Marker, useApiIsLoaded } from '@vis.gl/react-google-maps'
import { HALLOWEEN_GUIDE_PLACES, type GuidePlace } from '../../data/halloweenGuide'
import { GoogleMapProvider } from '../maps/GoogleMapProvider'
import { GoogleMapStyles } from '../browse/GoogleMapBehaviors'
import { hasGoogleMapsApiKey, MUTED_GOOGLE_MAP_STYLES } from '../../utils/googleMaps'

const TRADITION_FILL = '#e07a3d'
const NEIGHBORHOOD_FILL = '#66c5f9'

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

const PIN_SPREAD = 24

/** Pixel shift so nearby pins stay visible at the Bay Area zoom. */
function tipShiftX(place: GuidePlace) {
  const index = HALLOWEEN_GUIDE_PLACES.indexOf(place)
  const earlier = HALLOWEEN_GUIDE_PLACES.filter((other, otherIndex) => {
    if (otherIndex >= index) return false
    return Math.abs(other.lat - place.lat) < 0.008 && Math.abs(other.lng - place.lng) < 0.008
  })
  if (earlier.length === 0) return 0
  if (place.group === 'tradition') return -PIN_SPREAD * earlier.length
  return PIN_SPREAD
}

function mapBounds() {
  const lats = HALLOWEEN_GUIDE_PLACES.map((place) => place.lat)
  const lngs = HALLOWEEN_GUIDE_PLACES.map((place) => place.lng)
  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs),
    padding: 48,
  }
}

function GuidePlacesMapCanvas({ idPrefix }: { idPrefix: string }) {
  const apiLoaded = useApiIsLoaded()
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const selected = HALLOWEEN_GUIDE_PLACES.find((place) => place.slug === selectedSlug) ?? null
  const bounds = useMemo(() => mapBounds(), [])
  const icons = useMemo(() => {
    if (!apiLoaded || typeof google === 'undefined') return null
    const size = new google.maps.Size(28, 44)
    const anchor = new google.maps.Point(14, 44)
    return {
      tradition: { url: pinUrl(TRADITION_FILL), scaledSize: size, anchor },
      neighborhood: { url: pinUrl(NEIGHBORHOOD_FILL), scaledSize: size, anchor },
    }
  }, [apiLoaded])

  return (
    <Map
      defaultBounds={bounds}
      className="guide-map__canvas"
      gestureHandling="cooperative"
      disableDefaultUI
      zoomControl
      clickableIcons={false}
      renderingType="RASTER"
      styles={MUTED_GOOGLE_MAP_STYLES}
      backgroundColor="#f8f9fb"
    >
      <GoogleMapStyles styles={MUTED_GOOGLE_MAP_STYLES} />
      {icons
        ? [...HALLOWEEN_GUIDE_PLACES]
            .sort((a, b) => Number(a.group === 'tradition') - Number(b.group === 'tradition'))
            .map((place) => {
              const base = place.group === 'tradition' ? icons.tradition : icons.neighborhood
              const shiftX = tipShiftX(place)
              const icon =
                shiftX === 0 ? base : { ...base, anchor: new google.maps.Point(14 - shiftX, 44) }
              return (
                <Marker
                  key={place.slug}
                  position={{ lat: place.lat, lng: place.lng }}
                  icon={icon}
                  zIndex={selectedSlug === place.slug ? 1000 : place.group === 'tradition' ? 5 : 1}
                  onClick={() => setSelectedSlug(place.slug)}
                />
              )
            })
        : null}
      {selected ? (
        <InfoWindow
          position={{ lat: selected.lat, lng: selected.lng }}
          pixelOffset={[0, -40]}
          onCloseClick={() => setSelectedSlug(null)}
          headerDisabled
        >
          <PlacePopup place={selected} idPrefix={idPrefix} />
        </InfoWindow>
      ) : null}
    </Map>
  )
}

function PlacePopup({ place, idPrefix }: { place: GuidePlace; idPrefix: string }) {
  return (
    <div className="guide-map__popup">
      <p className="guide-map__popup-name">{place.name}</p>
      <p className="guide-map__popup-status">{place.status}</p>
      <a className="guide-map__more" href={`#${placeId(idPrefix, place.slug)}`}>
        Read more
      </a>
    </div>
  )
}

export function GuidePlacesMap({ idPrefix }: { idPrefix: string }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  return (
    <figure className="guide-map">
      <figcaption className="guide-map__caption">
        Famous streets and neighborhoods. Pins mark the area, not a specific house.
      </figcaption>
      <div className="guide-map__frame">
        {ready && hasGoogleMapsApiKey() ? (
          <GoogleMapProvider>
            <GuidePlacesMapCanvas idPrefix={idPrefix} />
          </GoogleMapProvider>
        ) : (
          <div className="guide-map__canvas" />
        )}
      </div>
      <ul className="guide-map__legend">
        <li>
          <span className="guide-map__swatch guide-map__swatch--tradition" />
          Traditions
        </li>
        <li>
          <span className="guide-map__swatch guide-map__swatch--neighborhood" />
          Neighborhoods
        </li>
      </ul>
    </figure>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import { HALLOWEEN_GUIDE_PLACES, type GuidePlace } from '../../data/halloweenGuide'
import { buildEventPinSvg } from '../browse/mapPins'
import { getLeafletBasemap } from '../../utils/cartoBasemap'
import 'leaflet/dist/leaflet.css'

const TRADITION_FILL = '#e07a3d'
const NEIGHBORHOOD_FILL = '#66c5f9'

function pinIcon(fill: string) {
  return L.divIcon({
    className: 'guide-map-pin',
    html: buildEventPinSvg(fill),
    iconSize: [28, 44],
    iconAnchor: [14, 44],
    popupAnchor: [0, -36],
  })
}

function placeId(idPrefix: string, slug: string) {
  return `${idPrefix}-${slug}`
}

function GuidePlacesMapCanvas({ idPrefix }: { idPrefix: string }) {
  const basemap = getLeafletBasemap()
  const traditionIcon = useMemo(() => pinIcon(TRADITION_FILL), [])
  const neighborhoodIcon = useMemo(() => pinIcon(NEIGHBORHOOD_FILL), [])
  const bounds = useMemo(
    () => L.latLngBounds(HALLOWEEN_GUIDE_PLACES.map((place) => [place.lat, place.lng])),
    [],
  )

  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={{ padding: [28, 28] }}
      scrollWheelZoom={false}
      className="guide-map__canvas"
    >
      <TileLayer
        url={basemap.url}
        attribution={basemap.attribution}
        subdomains={basemap.subdomains}
      />
      {HALLOWEEN_GUIDE_PLACES.map((place) => (
        <PlaceMarker
          key={place.slug}
          place={place}
          idPrefix={idPrefix}
          traditionIcon={traditionIcon}
          neighborhoodIcon={neighborhoodIcon}
        />
      ))}
    </MapContainer>
  )
}

function PlaceMarker({
  place,
  idPrefix,
  traditionIcon,
  neighborhoodIcon,
}: {
  place: GuidePlace
  idPrefix: string
  traditionIcon: L.DivIcon
  neighborhoodIcon: L.DivIcon
}) {
  return (
    <Marker
      position={[place.lat, place.lng]}
      icon={place.group === 'tradition' ? traditionIcon : neighborhoodIcon}
      eventHandlers={{
        click: () => {
          document.getElementById(placeId(idPrefix, place.slug))?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        },
      }}
    >
      <Popup>
        <strong>{place.name}</strong>
        <br />
        {place.status}
      </Popup>
    </Marker>
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
        {ready ? <GuidePlacesMapCanvas idPrefix={idPrefix} /> : <div className="guide-map__canvas" />}
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

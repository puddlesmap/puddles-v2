import L from 'leaflet'

export const EVENT_MARKER_SRC = '/spotlight-marker-large.png'

const MARKER_ASPECT = 44 / 28

export function getEventPinDimensions(selected: boolean, hovered: boolean) {
  if (selected) {
    const width = 28
    return { width, height: Math.round(width * MARKER_ASPECT) }
  }
  if (hovered) {
    const width = 24
    return { width, height: Math.round(width * MARKER_ASPECT) }
  }
  const width = 22
  return { width, height: Math.round(width * MARKER_ASPECT) }
}

function eventPinHtml(selected: boolean, hovered: boolean) {
  const stateClasses = [
    'puddles-event-marker',
    hovered ? 'puddles-event-marker--hover' : '',
    selected ? 'puddles-event-marker--selected' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return `<span class="${stateClasses}"><img src="${EVENT_MARKER_SRC}" alt="" class="puddles-event-marker__img" /></span>`
}

export function createEventPinIcon(selected: boolean, hovered: boolean) {
  const { width, height } = getEventPinDimensions(selected, hovered)

  return L.divIcon({
    className: 'puddles-event-marker-wrap',
    html: eventPinHtml(selected, hovered),
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
  })
}

export function createUserLocationIcon() {
  return L.divIcon({
    className: 'puddles-user-location-marker-wrap',
    html: `
      <span class="puddles-user-location-marker">
        <span class="puddles-user-location-marker__ring" aria-hidden="true"></span>
        <span class="puddles-user-location-marker__dot" aria-hidden="true"></span>
      </span>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  })
}

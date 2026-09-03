import L from 'leaflet'

/**
 * Pin fills — default matches brand / previous light puddle blue.
 * Selected is only slightly deeper (brand-dark), not a navy shift.
 */
export const EVENT_PIN_FILL = {
  default: '#66c5f9',
  hover: '#66c5f9',
  selected: '#4db8f2',
} as const

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

function pinFill(selected: boolean, hovered: boolean): string {
  if (selected) return EVENT_PIN_FILL.selected
  if (hovered) return EVENT_PIN_FILL.hover
  return EVENT_PIN_FILL.default
}

/** Teardrop pin with white center — used when we need a tinted selected state (Google). */
export function buildEventPinSvg(fill: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 44" width="28" height="44" aria-hidden="true">
  <path fill="${fill}" d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 30 14 30s14-19.5 14-30C28 6.268 21.732 0 14 0z"/>
  <circle fill="#ffffff" cx="14" cy="13.5" r="5.5"/>
</svg>`
}

export function getEventPinDataUrl(selected: boolean, hovered: boolean): string {
  // Keep the PNG for default/hover so unselected pins match the previous design.
  if (!selected) return EVENT_MARKER_SRC
  const svg = buildEventPinSvg(pinFill(selected, hovered))
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function eventPinHtml(selected: boolean, hovered: boolean) {
  const stateClasses = [
    'puddles-event-marker',
    hovered ? 'puddles-event-marker--hover' : '',
    selected ? 'puddles-event-marker--selected' : '',
  ]
    .filter(Boolean)
    .join(' ')

  // Leaflet: always use the PNG; selected deepens slightly via CSS filter.
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

import { Link } from 'react-router-dom'
import { DiscoveryMapPreview } from '../discovery/DiscoveryMapPreview'
import { PUDDLES_SPOTLIGHT_MARKER_SRC } from '../../pages/experimentShared'
import type { Event } from '../../types/event'
import type { TemporalTab } from '../../utils/dates'
import {
  getHomeMapFallbackPinPositions,
  getHomeMapPinPositions,
  getHomeMapPreviewLabelRefined,
  getHomeMapPreviewStatus,
  type HomeWhereMode,
} from '../../utils/homeMapPreview'

interface HomeMapPreviewProps {
  events: Event[]
  resetKey: string
  whereMode: HomeWhereMode
  temporalTab: TemporalTab
  eventCount: number
  hasNearbyCoords: boolean
  isRequesting: boolean
  onNavigateToMap: () => void
  statusVariant?: 'default' | 'refined'
}

export function HomeMapPreview({
  events,
  resetKey,
  whereMode,
  temporalTab,
  eventCount,
  hasNearbyCoords,
  isRequesting,
  onNavigateToMap,
  statusVariant = 'default',
}: HomeMapPreviewProps) {
  const statusContext = {
    whereMode,
    temporalTab,
    eventCount,
    hasNearbyCoords,
    isRequesting,
  }
  const status =
    statusVariant === 'refined'
      ? getHomeMapPreviewLabelRefined(whereMode)
      : getHomeMapPreviewStatus(statusContext)

  const mappableEvents = events.filter(
    (event) => Number.isFinite(event.lat) && Number.isFinite(event.lng),
  )
  const pinPositions =
    mappableEvents.length > 0
      ? getHomeMapPinPositions(events)
      : getHomeMapFallbackPinPositions(Math.min(eventCount, 5))

  const showPins = eventCount > 0 && !isRequesting
  const showMapLayer = mappableEvents.length > 0

  return (
    <Link
      to="/browse?view=map"
      className="home-map-preview-card"
      aria-label={`${status}. View map`}
      onClick={onNavigateToMap}
    >
      <div className="home-map-preview__canvas">
        {showMapLayer ? (
          <div className="home-map-preview__map-layer">
            <DiscoveryMapPreview events={events} resetKey={resetKey} showEventMarkers={false} />
          </div>
        ) : (
          <div className="home-map-preview__placeholder" />
        )}
        <div className="home-map-preview__wash" />

        {showPins ? (
          <div className="home-map-preview__pins" aria-hidden>
            {pinPositions.map((pin, index) => (
              <img
                key={`marker-${index}`}
                src={PUDDLES_SPOTLIGHT_MARKER_SRC}
                alt=""
                className={[
                  'home-map-preview__marker-pin',
                  pin.isMain ? 'home-map-preview__marker-pin--main' : 'home-map-preview__marker-pin--secondary',
                ].join(' ')}
                width={pin.isMain ? 28 : 20}
                height={pin.isMain ? 28 : 20}
                decoding="async"
                style={{ top: `${pin.top}%`, left: `${pin.left}%` }}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="home-map-preview__footer">
        <p className="home-map-preview__status">{status}</p>
        <span className="home-map-preview__cta">View map →</span>
      </div>
    </Link>
  )
}

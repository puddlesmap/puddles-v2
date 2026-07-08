import { Link } from 'react-router-dom'
import { DiscoveryMapPreview } from '../discovery/DiscoveryMapPreview'
import { PUDDLES_SPOTLIGHT_MARKER_SRC } from '../../pages/experimentShared'
import type { Event } from '../../types/event'
import type { TemporalTab } from '../../utils/dates'
import type { UserLocationCoords } from '../../hooks/useUserLocation'
import {
  getHomeMapDecorativePinPositions,
  getHomeMapPreviewLabelRefined,
  getHomeMapPreviewStatus,
  resolveHomeMapPreviewFraming,
  type HomeWhereMode,
} from '../../utils/homeMapPreview'

interface HomeMapPreviewProps {
  events: Event[]
  resetKey: string
  whereMode: HomeWhereMode
  temporalTab: TemporalTab
  eventCount: number
  hasNearbyCoords: boolean
  userCoords?: UserLocationCoords | null
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
  userCoords = null,
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

  const framing = resolveHomeMapPreviewFraming(whereMode, events, userCoords)
  const pinPositions = getHomeMapDecorativePinPositions(eventCount, whereMode, framing.viewport)

  const showPins = eventCount > 0 && !isRequesting
  const showMapLayer = !isRequesting

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
            <DiscoveryMapPreview
              events={events}
              resetKey={resetKey}
              showEventMarkers={false}
              areaBounds={framing.areaBounds}
              anchorPoints={framing.anchorPoints}
              boundsPadding={framing.boundsPadding}
              fixedViewport={framing.viewport}
            />
          </div>
        ) : (
          <div className="home-map-preview__placeholder" />
        )}

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

        <div className="home-map-preview__footer">
          <p className="home-map-preview__status">{status}</p>
          <span className="home-map-preview__cta">View map →</span>
        </div>
      </div>
    </Link>
  )
}

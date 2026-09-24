import type { Event } from '../types/event'
import { getSeasonalEditorialBadgeForEvent } from '../utils/seasonalEditorialBadges'
import { eventToBrowseCard } from '../utils/browseEventCard'
import { formatEventCardTitleParts } from '../utils/eventCardTitle'
import { DiscoveryV3Card } from './experiment/DiscoveryV3Card'

interface BrowseEventCardProps {
  event: Event
  onClick?: () => void
  selected?: boolean
  hovered?: boolean
  /** Show Fall / Halloween / Holiday Pick when the event qualifies. Default on for browse feeds. */
  seasonalEditorial?: boolean
  /**
   * `map-sheet` — compact horizontal card for mobile map preview (more map visible).
   * Default is the full vertical Discovery v3 card.
   */
  density?: 'default' | 'map-sheet'
  /**
   * Append ` · {venue}` to the card title when it adds place context.
   * Card-only — event detail still uses `event.title`. Default off.
   */
  appendVenueToTitle?: boolean
  /** Append ` · {venue}` after date · time on the card when line. Default off. */
  appendVenueToWhen?: boolean
  /** Venue as its own line under a 2-line reserved title. Default off. */
  showVenueBelowTitle?: boolean
  /**
   * Card-only: venue inline after date · time at 390px+, own line under the title below 390.
   * Default off.
   */
  venueResponsive?: boolean
}

/** Production browse card — Discovery v3 · Option 2 (city-soft). */
export function BrowseEventCard({
  event,
  onClick,
  selected = false,
  hovered = false,
  seasonalEditorial = true,
  density = 'default',
  appendVenueToTitle = false,
  appendVenueToWhen = false,
  showVenueBelowTitle = false,
  venueResponsive = false,
  /** Override “today” for seasonal-run date labels (review mockups). */
  asOf,
}: BrowseEventCardProps & { asOf?: Date }) {
  const badge = seasonalEditorial ? getSeasonalEditorialBadgeForEvent(event) : null
  const card = eventToBrowseCard(event, badge, asOf ?? new Date())
  const titleParts = appendVenueToTitle ? formatEventCardTitleParts(event) : null

  const venue = event.venue?.trim() || null
  const showVenueLine = showVenueBelowTitle || venueResponsive

  return (
    <DiscoveryV3Card
      {...card}
      title={titleParts?.title ?? card.title}
      titleVenue={titleParts?.venue}
      datetimeVenue={appendVenueToWhen || venueResponsive ? venue : null}
      showVenueBelowTitle={showVenueBelowTitle}
      venueLine={showVenueLine ? venue : null}
      venueResponsive={venueResponsive}
      event={event}
      onClick={onClick}
      selected={selected}
      hovered={hovered}
      compactPillars
      bodyLayout="city-soft"
      density={density}
    />
  )
}

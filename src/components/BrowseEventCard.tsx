import type { Event } from '../types/event'
import { formatSavedDayPill } from '../utils/dates'
import { getSeasonalEditorialBadgeForEvent } from '../utils/seasonalEditorialBadges'
import { eventToBrowseCard } from '../utils/browseEventCard'
import { formatEventCardTitleParts } from '../utils/eventCardTitle'
import { getSeasonalAvailability } from '../utils/formatSeasonalSchedule'
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
  /** Heart overlay. Default on. */
  showSaveHeart?: boolean
  /** Soft blue day pill on media (Saved). Default off. */
  showMediaDayPill?: boolean
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
  showSaveHeart = true,
  showMediaDayPill = false,
  /** Override “today” for seasonal-run date labels (review mockups). */
  asOf,
}: BrowseEventCardProps & { asOf?: Date }) {
  const now = asOf ?? new Date()
  const badge = seasonalEditorial ? getSeasonalEditorialBadgeForEvent(event) : null
  const card = eventToBrowseCard(event, badge, now)
  const titleParts = appendVenueToTitle ? formatEventCardTitleParts(event) : null

  const venue = event.venue?.trim() || null
  const city = event.city?.trim() || ''
  const showVenueLine = showVenueBelowTitle || venueResponsive
  /** Venue · city under the title; keep date/time untruncated above. */
  const venueBelowLabel = showVenueBelowTitle
    ? [venue, city].filter(Boolean).join(' · ') || null
    : showVenueLine
      ? venue
      : null
  /** Avoid repeating city in chips when it already sits on the venue line. */
  const pillarCity = showVenueBelowTitle ? '' : card.city

  const mediaDayLabel = showMediaDayPill
    ? formatSavedDayPill(
        getSeasonalAvailability(event, now).nextRelevantYmd || event.date || '',
        now,
      )
    : null

  return (
    <DiscoveryV3Card
      {...card}
      city={pillarCity}
      title={titleParts?.title ?? card.title}
      titleVenue={titleParts?.venue}
      datetimeVenue={appendVenueToWhen || venueResponsive ? venue : null}
      showVenueBelowTitle={showVenueBelowTitle}
      venueLine={venueBelowLabel}
      venueResponsive={venueResponsive}
      showSaveHeart={showSaveHeart}
      mediaDayLabel={mediaDayLabel}
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

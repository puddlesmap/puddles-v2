import type { Event } from '../types/event'
import { getSeasonalEditorialBadgeForEvent } from '../utils/seasonalEditorialBadges'
import { eventToBrowseCard } from '../utils/browseEventCard'
import { DiscoveryV3Card } from './experiment/DiscoveryV3Card'

interface BrowseEventCardProps {
  event: Event
  onClick?: () => void
  selected?: boolean
  hovered?: boolean
  /** Show Fall / Halloween / Holiday Pick when the event qualifies. Default on for browse feeds. */
  seasonalEditorial?: boolean
}

/** Production browse card — Discovery v3 · Option 2 (city-soft). */
export function BrowseEventCard({
  event,
  onClick,
  selected = false,
  hovered = false,
  seasonalEditorial = true,
}: BrowseEventCardProps) {
  const badge = seasonalEditorial ? getSeasonalEditorialBadgeForEvent(event) : null
  const card = eventToBrowseCard(event, badge)

  return (
    <DiscoveryV3Card
      {...card}
      event={event}
      onClick={onClick}
      selected={selected}
      hovered={hovered}
      compactPillars
      bodyLayout="city-soft"
    />
  )
}

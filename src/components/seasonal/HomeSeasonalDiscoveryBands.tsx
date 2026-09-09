import { useMemo } from 'react'
import type { Event } from '../../types/event'
import {
  getActiveSeasonalCollections,
  resolveFeaturedSeasonalEvents,
} from '../../data/seasonalDiscovery'
import { SeasonalDiscoveryModule } from './SeasonalDiscoveryModule'

interface HomeSeasonalDiscoveryBandsProps {
  onEventClick: (event: Event) => void
  /** Override catalog for launch preview / staging. */
  catalog?: Event[]
  /** Override “today” for dual-theme review. */
  asOf?: Date
  /**
   * `compact` — title + description with map-sheet preview cards (mobile dock).
   * Default is the full home band cards.
   */
  variant?: 'default' | 'compact'
  /** Cap featured cards (compact dock). */
  maxEvents?: number
  className?: string
}

/** Renders every date-active seasonal collection as a Home band (supports dual themes). */
export function HomeSeasonalDiscoveryBands({
  onEventClick,
  catalog,
  asOf,
  variant = 'default',
  maxEvents,
  className = '',
}: HomeSeasonalDiscoveryBandsProps) {
  const collections = useMemo(
    () => getActiveSeasonalCollections(asOf ?? new Date()),
    [asOf],
  )

  const featuredBySlug = useMemo(() => {
    const map = new Map<string, Event[]>()
    for (const collection of collections) {
      const events = catalog
        ? resolveFeaturedSeasonalEvents(collection, catalog)
        : resolveFeaturedSeasonalEvents(collection)
      map.set(collection.slug, typeof maxEvents === 'number' ? events.slice(0, maxEvents) : events)
    }
    return map
  }, [collections, catalog, maxEvents])

  if (collections.length === 0) return null

  const isCompact = variant === 'compact'

  return (
    <div
      className={['home-seasonal-bands', isCompact ? 'home-seasonal-bands--compact' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {collections.map((collection) => (
        <SeasonalDiscoveryModule
          key={`${collection.slug}${isCompact ? '-compact' : ''}`}
          collection={collection}
          events={featuredBySlug.get(collection.slug) ?? []}
          onEventClick={onEventClick}
          bandLayout="home"
          homeBandEyebrow="timing"
          homeBandCopyTone="neutral"
          cardDensity={isCompact ? 'map-sheet' : 'default'}
          asOf={asOf}
        />
      ))}
    </div>
  )
}

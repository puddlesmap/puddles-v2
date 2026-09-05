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
}

/** Renders every date-active seasonal collection as a Home band (supports dual themes). */
export function HomeSeasonalDiscoveryBands({
  onEventClick,
  catalog,
  asOf,
}: HomeSeasonalDiscoveryBandsProps) {
  const collections = useMemo(
    () => getActiveSeasonalCollections(asOf ?? new Date()),
    [asOf],
  )

  const featuredBySlug = useMemo(() => {
    const map = new Map<string, Event[]>()
    for (const collection of collections) {
      map.set(
        collection.slug,
        catalog
          ? resolveFeaturedSeasonalEvents(collection, catalog)
          : resolveFeaturedSeasonalEvents(collection),
      )
    }
    return map
  }, [collections, catalog])

  if (collections.length === 0) return null

  return (
    <div className="home-seasonal-bands">
      {collections.map((collection) => (
        <SeasonalDiscoveryModule
          key={collection.slug}
          collection={collection}
          events={featuredBySlug.get(collection.slug) ?? []}
          onEventClick={onEventClick}
          bandLayout="home"
          homeBandEyebrow="timing"
          homeBandCopyTone="neutral"
          asOf={asOf}
        />
      ))}
    </div>
  )
}

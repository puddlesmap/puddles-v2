import { Link } from 'react-router-dom'
import {
  getSiblingGuides,
  type GuideCatalogEntry,
} from '../../data/guidesCatalog'
import {
  getSeasonalCollection,
  type SeasonalCollectionSlug,
} from '../../data/seasonalDiscovery'
import { AirbnbTeaser } from '../../views/guidesHomeMockups/GuideHomeShared'
import '../../views/guides-home.css'
import './moreFromCollectionGuides.css'

function titleWithEmoji(guide: GuideCatalogEntry): GuideCatalogEntry {
  if (guide.slug === 'holiday-lights-traditions' && !guide.title.includes('✨')) {
    return { ...guide, title: `${guide.title} ✨` }
  }
  if (guide.slug === 'holiday-stories-play' && !guide.title.includes('🎭')) {
    return { ...guide, title: `${guide.title} 🎭` }
  }
  if (guide.slug === 'hello-new-year' && !guide.title.includes('🎉')) {
    return { ...guide, title: `${guide.title} 🎉` }
  }
  return guide
}

/** Compact sibling guide cards for the end of an individual guide. */
export function MoreFromCollectionGuides({
  collectionSlug,
  currentSlug,
}: {
  collectionSlug: SeasonalCollectionSlug
  currentSlug: string
}) {
  const collection = getSeasonalCollection(collectionSlug)
  const siblings = getSiblingGuides(collectionSlug, currentSlug).map(titleWithEmoji)
  if (!collection || siblings.length === 0) return null

  return (
    <section className="more-from-collection" aria-label={`More from ${collection.subtitle}`}>
      <h3 className="more-from-collection__heading">More from {collection.subtitle}</h3>
      <ul className="more-from-collection__list">
        {siblings.map((guide) => (
          <li key={guide.slug}>
            <AirbnbTeaser guide={guide} />
          </li>
        ))}
      </ul>
      <p className="more-from-collection__all">
        <Link to="/guides">View all guides →</Link>
      </p>
    </section>
  )
}

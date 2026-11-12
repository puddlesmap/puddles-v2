import { Link } from 'react-router-dom'
import { getGuideBySlug } from '../../data/guidesCatalog'
import {
  getSeasonalCollection,
  seasonalCollectionPath,
} from '../../data/seasonalDiscovery'

function titleCaseLabel(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** Predictable parent link: seasonal hub when linked, else Guides Home. */
export function GuideParentNav({ guideSlug }: { guideSlug: string }) {
  const guide = getGuideBySlug(guideSlug)
  const collection = guide?.collectionSlug
    ? getSeasonalCollection(guide.collectionSlug)
    : undefined

  const to = collection ? seasonalCollectionPath(collection.slug) : '/guides'
  const label = collection ? titleCaseLabel(collection.subtitle) : 'All guides'

  return (
    <nav className="guide-page__context" aria-label="Guide navigation">
      <Link className="guide-page__back" to={to}>
        ← {label}
      </Link>
    </nav>
  )
}

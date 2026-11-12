import { Link } from 'react-router-dom'
import { GUIDES_CATALOG } from '../../data/guidesCatalog'
import {
  HOLIDAY_GUIDE_ILLUSTRATION,
  HOLIDAY_GUIDE_PATH,
  HOLIDAY_GUIDE_TITLE,
} from '../../data/holidayGuide'
import {
  HOLIDAY_STORIES_GUIDE_COVER,
  HOLIDAY_STORIES_GUIDE_DEK,
  HOLIDAY_STORIES_GUIDE_PATH,
  HOLIDAY_STORIES_GUIDE_TITLE,
} from '../../data/holidayStoriesGuide'
import {
  HELLO_NEW_YEAR_GUIDE_COVER,
  HELLO_NEW_YEAR_GUIDE_DEK,
  HELLO_NEW_YEAR_GUIDE_PATH,
  HELLO_NEW_YEAR_GUIDE_TITLE,
} from '../../data/helloNewYearGuide'
import './holiday-magic-guides-panel.css'

/** Hub-only featured dek — shorter than the guide article dek. */
const LIGHTS_HUB_DEK = 'Train rides, Santa visits & festive outings.'

type PanelGuide = {
  slug: string
  title: string
  dek: string
  imageSrc: string
  imageClay?: boolean
  href: string | null
  live: boolean
}

function catalogLive(slug: string, path: string): { live: boolean; href: string | null } {
  const entry = GUIDES_CATALOG.find((g) => g.slug === slug)
  if (entry?.status === 'live' && entry.href) {
    return { live: true, href: `${entry.href}?entry=collection` }
  }
  if (entry?.status === 'live') {
    return { live: true, href: `${path}?entry=collection` }
  }
  return { live: false, href: null }
}

function buildPanelGuides(): { featured: PanelGuide; supporting: PanelGuide[] } {
  const lights = catalogLive('holiday-lights-traditions', HOLIDAY_GUIDE_PATH)
  const stories = catalogLive('holiday-stories-play', HOLIDAY_STORIES_GUIDE_PATH)
  const newYear = catalogLive('hello-new-year', HELLO_NEW_YEAR_GUIDE_PATH)

  const featured: PanelGuide = {
    slug: 'holiday-lights-traditions',
    title: `${HOLIDAY_GUIDE_TITLE} ✨`,
    dek: LIGHTS_HUB_DEK,
    imageSrc: HOLIDAY_GUIDE_ILLUSTRATION,
    imageClay: true,
    href: lights.href ?? `${HOLIDAY_GUIDE_PATH}?entry=collection`,
    live: true,
  }

  const supporting: PanelGuide[] = [
    {
      slug: 'holiday-stories-play',
      title: `${HOLIDAY_STORIES_GUIDE_TITLE} 🎭`,
      dek: HOLIDAY_STORIES_GUIDE_DEK,
      imageSrc: HOLIDAY_STORIES_GUIDE_COVER,
      href: stories.href,
      live: stories.live,
    },
    {
      slug: 'hello-new-year',
      title: `${HELLO_NEW_YEAR_GUIDE_TITLE} 🎉`,
      dek: HELLO_NEW_YEAR_GUIDE_DEK,
      imageSrc: HELLO_NEW_YEAR_GUIDE_COVER,
      href: newYear.href,
      live: newYear.live,
    },
  ]

  return { featured, supporting }
}

function GuideChevron() {
  return (
    <svg
      className="hmg-guide-row__chevron"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FeaturedRow({ guide }: { guide: PanelGuide }) {
  if (!guide.href) return null
  return (
    <Link
      className="hmg-guide-featured"
      to={guide.href}
      aria-label={`${guide.title}. Explore guide`}
    >
      <img className="hmg-guide-featured__media" src={guide.imageSrc} alt="" decoding="async" />
      <span className="hmg-guide-featured__copy">
        <span className="hmg-guide-featured__title">{guide.title}</span>
        <span className="hmg-guide-featured__dek">{guide.dek}</span>
        <span className="hmg-guide-featured__cta">Explore guide →</span>
      </span>
    </Link>
  )
}

function CompactRow({ guide }: { guide: PanelGuide }) {
  const mediaClass = [
    'hmg-guide-row__media',
    guide.imageClay ? 'hmg-guide-row__media--clay' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const body = (
    <>
      <img className={mediaClass} src={guide.imageSrc} alt="" decoding="async" />
      <span className="hmg-guide-row__copy">
        <span className="hmg-guide-row__title">{guide.title}</span>
        {guide.live ? <span className="hmg-guide-row__dek">{guide.dek}</span> : null}
      </span>
      {guide.live && guide.href ? (
        <GuideChevron />
      ) : (
        <span className="hmg-guide-row__soon">Coming soon</span>
      )}
    </>
  )

  if (guide.live && guide.href) {
    return (
      <Link className="hmg-guide-row" to={guide.href} aria-label={`${guide.title}. Explore guide`}>
        {body}
      </Link>
    )
  }

  return (
    <div className="hmg-guide-row hmg-guide-row--soon" aria-label={`${guide.title}. Coming soon`}>
      {body}
    </div>
  )
}

/** Panel of Holiday Magic companion guides on the seasonal hub. */
export function HolidayMagicGuidesPanel() {
  const { featured, supporting } = buildPanelGuides()

  return (
    <section className="hmg-guides" aria-labelledby="hmg-guides-label">
      <p id="hmg-guides-label" className="hmg-guides__eyebrow">
        Explore the guides
      </p>
      <div className="hmg-guides__panel">
        <FeaturedRow guide={featured} />
        {supporting.map((guide) => (
          <CompactRow key={guide.slug} guide={guide} />
        ))}
      </div>
    </section>
  )
}

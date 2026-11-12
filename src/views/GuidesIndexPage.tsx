import { Link } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { getFeaturedGuide, getGuidesHomeLibrary } from '../data/guidesCatalog'
import { HOLIDAY_GUIDE_DEK } from '../data/holidayGuide'
import { getSeasonalCollection, seasonalCollectionPath } from '../data/seasonalDiscovery'
import { seasonalReturnLinkState } from '../utils/seasonalReturnNav'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import { AirbnbTeaser, GuidesLetterSection } from './guidesHomeMockups/GuideHomeShared'
import './guides-home.css'

const GUIDES_TITLE_ICON = '/brand/guides-title-icon.png'

const GUIDES_INTRO_DEK =
  'Seasonal ideas, places to explore, and helpful tips for getting out with little ones, ages 0–5.'

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** Live /guides — Airbnb hero layout with Puddles chrome. */
export function GuidesIndexPage() {
  const featured = getFeaturedGuide()
  const library = getGuidesHomeLibrary()
  const featuredIsLive = featured.status === 'live' && Boolean(featured.href)
  const featuredCollection = featured.collectionSlug
    ? getSeasonalCollection(featured.collectionSlug)
    : undefined

  return (
    <div className="about-page-shell">
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />
      <div className="abn">
        <header className="abn-intro">
          <h1 className="abn-intro__title">
            <span className="abn-intro__title-word">Guides</span>
            <img
              className="abn-intro__title-icon"
              src={GUIDES_TITLE_ICON}
              alt=""
              width={64}
              height={64}
              decoding="async"
            />
          </h1>
          <p>{GUIDES_INTRO_DEK}</p>
        </header>

        <article className="abn-hero">
          <div className="abn-hero__card">
            <div className="abn-hero__copy">
              <p className="abn-hero__eyebrow">Featured guide</p>
              <h2>{featured.title}</h2>
              <p>{HOLIDAY_GUIDE_DEK}</p>
              {featuredIsLive ? (
                <Link className="abn-pill" to={featured.href!}>
                  Read guide
                </Link>
              ) : (
                <span className="abn-pill is-soon">Coming soon</span>
              )}
              {featuredCollection ? (
                <div className="abn-hero__collection">
                  <p className="abn-hero__collection-label">
                    Part of the {titleCase(featuredCollection.subtitle)} collection
                  </p>
                  <Link
                    className="abn-hero__collection-link"
                    to={seasonalCollectionPath(featuredCollection.slug)}
                    state={seasonalReturnLinkState('/guides', 'Guides')}
                  >
                    Explore the collection →
                  </Link>
                </div>
              ) : null}
            </div>
            <div className="abn-hero__media" aria-hidden="true">
              <img src={featured.cover} alt="" />
            </div>
          </div>
        </article>

        {library.length > 0 ? (
          <section className="abn-topics abn-topics--library" id="abn-topics">
            <div className="abn-topics__head">
              <h2>More guides</h2>
            </div>
            <ul className="abn-topics__library">
              {library.map((guide) => (
                <li key={guide.slug}>
                  <AirbnbTeaser guide={guide} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <GuidesLetterSection />
      </div>
      <Footer fullBleed className="mt-0" />
    </div>
  )
}

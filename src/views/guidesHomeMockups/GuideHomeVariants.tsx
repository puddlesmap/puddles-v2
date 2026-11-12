import { Link } from 'react-router-dom'
import {
  GUIDES_CATALOG,
  getFeaturedGuide,
  getGuideStream,
  getGuidesBySeason,
  showGuideSeasonSections,
} from '../../data/guidesCatalog'
import {
  AirbnbExclusive,
  AirbnbTeaser,
  GuideCardLink,
  GuidesLetterSection,
} from './GuideHomeShared'

const TOPICS = [
  { id: 'all', label: 'All' },
  { id: 'fall', label: 'Fall' },
  { id: 'winter', label: 'Winter' },
  { id: 'spring', label: 'Spring' },
  { id: 'summer', label: 'Summer' },
] as const

function AirbnbNav() {
  return (
    <header className="abn-nav">
      <div className="abn-nav__inner">
        <Link className="abn-nav__brand" to="/">
          <span className="abn-nav__mark" aria-hidden>
            P
          </span>
          Guides
        </Link>
        <nav className="abn-nav__links" aria-label="Guides menu">
          <a href="#abn-latest">About us</a>
          <a href="#abn-topics">Seasons</a>
          <Link to="/browse">Browse events</Link>
          <a href="#abn-about">Contact</a>
        </nav>
        <div className="abn-nav__tools">
          <span className="abn-nav__lang">English</span>
          <button type="button" className="abn-nav__search" aria-label="Search">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M10.4 10.4 14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}

function BalletNav() {
  return (
    <header className="sfn-nav">
      <button type="button" className="sfn-nav__menu" aria-label="Open menu">
        <span />
        <span />
      </button>
      <Link className="sfn-nav__brand" to="/">
        PUDDLES
        <span>THE TOT MAP</span>
      </Link>
      <div className="sfn-nav__tools">
        <span className="sfn-nav__search">Search</span>
        <Link className="sfn-nav__ghost" to="/browse">
          Browse
        </Link>
        <Link className="sfn-nav__solid" to="/guides/halloween-with-little-ones">
          Read guide
        </Link>
      </div>
    </header>
  )
}

/** 1 · Airbnb Newsroom — hero + latest + topics (gated like live /guides) */
export function GuideHomeAirbnbNews() {
  const featured = getFeaturedGuide()
  const latest = getGuideStream().slice(0, 4)
  const seasons = getGuidesBySeason()
  const showSeasonSections = showGuideSeasonSections()

  return (
    <div className="abn">
      <AirbnbNav />
      <article className="abn-hero">
        <div className="abn-hero__copy">
          <time dateTime={featured.sortKey}>{featured.posted}</time>
          <h1>{featured.title}</h1>
          <p>{featured.dek}</p>
          {featured.href ? (
            <Link className="abn-pill" to={featured.href}>
              Read more
            </Link>
          ) : (
            <span className="abn-pill is-soon">Coming soon</span>
          )}
        </div>
        <div className="abn-hero__media">
          <img src={featured.cover} alt="" />
        </div>
      </article>

      <section className="abn-latest" id="abn-latest">
        <h2>Latest guides</h2>
        <ul>
          {latest.map((guide) => (
            <li key={guide.slug}>
              <AirbnbTeaser guide={guide} />
            </li>
          ))}
        </ul>
      </section>

      {showSeasonSections ? (
        <>
          <section className="abn-exclusive-band">
            <div className="abn-exclusive-band__head">
              <h2>Guides through the year</h2>
              <p>Seasonal planning for ages 0–5 — from spring walks to holiday lights.</p>
            </div>
            <ul>
              {GUIDES_CATALOG.slice(0, 3).map((guide) => (
                <li key={guide.slug}>
                  <AirbnbExclusive guide={guide} />
                </li>
              ))}
            </ul>
          </section>

          <section className="abn-topics" id="abn-topics">
            <h2>Guides by season</h2>
            <div className="abn-tabs" role="tablist" aria-label="Season">
              {TOPICS.map((tab, i) => (
                <a
                  key={tab.id}
                  href={`#abn-${tab.id}`}
                  className={i === 0 ? 'is-on' : undefined}
                  role="tab"
                >
                  {tab.label}
                </a>
              ))}
            </div>
            {seasons.map((group) => (
              <div key={group.season} className="abn-topic-block" id={`abn-${group.season}`}>
                <ul>
                  {group.guides.map((guide) => (
                    <li key={guide.slug}>
                      <AirbnbTeaser guide={guide} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </>
      ) : null}

      <GuidesLetterSection />
    </div>
  )
}

/** 2 · Airbnb feed — no giant hero; tabs first */
export function GuideHomeAirbnbFeed() {
  const featured = getFeaturedGuide()
  const rest = getGuideStream()
  const showSeasonSections = showGuideSeasonSections()

  return (
    <div className="abn">
      <AirbnbNav />
      <section className="abn-latest abn-latest--lead" id="abn-latest">
        <h2>Latest guides</h2>
        <div className="abn-leadrow">
          <GuideCardLink guide={featured} className="abn-leadcard">
            <span className="abn-leadcard__media">
              <img src={featured.cover} alt="" />
            </span>
            <time dateTime={featured.sortKey}>{featured.posted}</time>
            <h3>{featured.title}</h3>
            <p>{featured.dek}</p>
          </GuideCardLink>
          <ul className="abn-leadlist">
            {rest.slice(0, 3).map((guide) => (
              <li key={guide.slug}>
                <AirbnbTeaser guide={guide} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {showSeasonSections ? (
        <>
          <section className="abn-exclusive-band">
            <div className="abn-exclusive-band__head">
              <h2>Exclusively in Guides</h2>
              <p>Long-form planning you will not find as a single event card.</p>
            </div>
            <ul>
              {GUIDES_CATALOG.slice(0, 3).map((guide) => (
                <li key={guide.slug}>
                  <AirbnbExclusive guide={guide} />
                </li>
              ))}
            </ul>
          </section>

          <section className="abn-topics" id="abn-topics">
            <h2>Guides by season</h2>
            <div className="abn-tabs" role="tablist">
              {TOPICS.map((tab, i) => (
                <span key={tab.id} className={i === 0 ? 'is-on' : undefined} role="tab">
                  {tab.label}
                </span>
              ))}
            </div>
            <ul className="abn-topic-block">
              {GUIDES_CATALOG.map((guide) => (
                <li key={guide.slug}>
                  <AirbnbTeaser guide={guide} />
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      <GuidesLetterSection />
    </div>
  )
}

/** 3 · SF Ballet home — stacked full-bleed panels */
export function GuideHomeBalletHome() {
  const featured = getFeaturedGuide()
  const panels = [featured, ...getGuideStream().slice(0, 3)]

  return (
    <div className="sfn">
      <BalletNav />
      <section className="sfn-hero">
        <img src={featured.cover} alt="" />
        <div className="sfn-hero__copy">
          <p>2026 · South Peninsula</p>
          <h1>LOCAL GUIDES</h1>
          <p className="sfn-hero__sub">Seasonal planning for little ones</p>
          <div className="sfn-pills">
            <Link className="sfn-pill" to="/guides/halloween-with-little-ones">
              Read featured
            </Link>
            <a className="sfn-pill sfn-pill--ghost" href="#sfn-upcoming">
              View the year
            </a>
          </div>
        </div>
      </section>

      <p className="sfn-kicker" id="sfn-upcoming">
        Upcoming guides
      </p>
      {panels.map((guide) => (
        <section key={guide.slug} className="sfn-panel">
          <img src={guide.cover} alt="" />
          <div className="sfn-panel__copy">
            <h2>{guide.title}</h2>
            <p>{guide.posted}</p>
            <div className="sfn-pills">
              {guide.href ? (
                <Link className="sfn-pill" to={guide.href}>
                  Read
                </Link>
              ) : (
                <span className="sfn-pill sfn-pill--ghost">Coming soon</span>
              )}
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}

/** 4 · SF Ballet season listing — date + poster + facts */
export function GuideHomeBalletSeason() {
  const guides = [...GUIDES_CATALOG].sort((a, b) => b.sortKey.localeCompare(a.sortKey))

  return (
    <div className="sfn sfn--season">
      <BalletNav />
      <header className="sfn-season-head">
        <p>2026 season</p>
        <h1>GUIDES</h1>
        <nav className="sfn-season-tabs" aria-label="Filter">
          <a href="#sfn-all" className="is-on">
            All
          </a>
          <a href="#sfn-fall">Fall</a>
          <a href="#sfn-winter">Winter</a>
        </nav>
      </header>
      <ul className="sfn-season-grid" id="sfn-all">
        {guides.map((guide) => (
          <li
            key={guide.slug}
            id={
              guide.season === 'fall' ? 'sfn-fall' : guide.season === 'winter' ? 'sfn-winter' : undefined
            }
          >
            <GuideCardLink guide={guide} className="sfn-season-card">
              <span className="sfn-season-card__media">
                <img src={guide.cover} alt="" loading="lazy" />
              </span>
              <span className="sfn-season-card__date">{guide.posted.toUpperCase()}</span>
              <h2>{guide.title}</h2>
              <span className="sfn-season-card__cta">{guide.status === 'live' ? 'Read' : 'Soon'}</span>
            </GuideCardLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** 5 · Hybrid — Ballet panel, then Airbnb latest + topics */
export function GuideHomeHybrid() {
  const featured = getFeaturedGuide()
  const latest = getGuideStream().slice(0, 4)
  const showSeasonSections = showGuideSeasonSections()

  return (
    <div className="hyb">
      <BalletNav />
      <section className="sfn-hero sfn-hero--short">
        <img src={featured.cover} alt="" />
        <div className="sfn-hero__copy">
          <p>{featured.posted}</p>
          <h1>{featured.title}</h1>
          <div className="sfn-pills">
            {featured.href ? (
              <Link className="sfn-pill" to={featured.href}>
                Read more
              </Link>
            ) : null}
          </div>
        </div>
      </section>
      <div className="hyb-airbnb">
        <section className="abn-latest">
          <h2>Latest guides</h2>
          <ul>
            {latest.map((guide) => (
              <li key={guide.slug}>
                <AirbnbTeaser guide={guide} />
              </li>
            ))}
          </ul>
        </section>
        {showSeasonSections ? (
          <section className="abn-topics">
            <h2>Guides by season</h2>
            <div className="abn-tabs">
              {TOPICS.map((tab, i) => (
                <span key={tab.id} className={i === 0 ? 'is-on' : undefined}>
                  {tab.label}
                </span>
              ))}
            </div>
            <ul className="abn-topic-block">
              {GUIDES_CATALOG.map((guide) => (
                <li key={guide.slug}>
                  <AirbnbTeaser guide={guide} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  )
}

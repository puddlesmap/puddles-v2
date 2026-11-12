import { Link } from 'react-router-dom'
import {
  HALLOWEEN_EVENTS_HREF,
  HALLOWEEN_GUIDE_POSTED,
  HALLOWEEN_GUIDE_READ,
} from '../data/halloweenGuide'

export const GUIDE_SECTION_CARDS = [
  {
    slug: 'free',
    title: 'Free celebrations close to home',
    date: 'Oct 24 mornings',
    image: 'https://www.losaltosca.gov/ImageRepository/Document?documentID=2763',
  },
  {
    slug: 'schools',
    title: 'School carnivals & costume parties',
    date: 'Oct 24 afternoons',
    image: '/events/witches-delight-2026.png',
  },
  {
    slug: 'daytime',
    title: 'Trick-or-treat before Halloween night',
    date: 'Oct 28–30',
    image: 'https://www.menlopark.gov/files/sharedassets/public/v/1/library-and-community-services/images/events/children-in-costume-on-santa-cruz-avenue-sidewalk-for-halloween-hoopla-downtown-merchant-trick-or-treating-and-parade.jpg',
  },
  {
    slug: 'patches',
    title: 'Pumpkin patches worth a little drive',
    date: 'Through October',
    image: 'https://www.gamblegarden.org/wp-content/uploads/2018/09/mini-pumpkins-890x890.jpg',
  },
  {
    slug: 'traditions',
    title: 'Famous Halloween traditions',
    date: 'Oct 31 evening',
    image: '/events/halloween-bray-parade-2026.jpg',
  },
  {
    slug: 'before',
    title: 'Before trick-or-treating with little ones',
    date: 'Planning tips',
    image: 'https://www.gamblegarden.org/wp-content/uploads/2018/09/mini-pumpkins-890x890.jpg',
  },
] as const

const BENTO = [
  {
    slug: 'free',
    label: 'Free mornings',
    title: 'Monster Bash & Hoopla',
    tone: 'sun',
    span: 'wide',
  },
  {
    slug: 'schools',
    label: 'Afternoon energy',
    title: 'Witches’ Delight',
    tone: 'plum',
    span: 'tall',
    image: '/events/witches-delight-2026.png',
  },
  {
    slug: 'patches',
    label: 'Go at your pace',
    title: 'Pumpkin farms',
    tone: 'mint',
    span: 'square',
  },
  {
    slug: 'daytime',
    label: 'Set hours',
    title: 'Downtown trick-or-treat',
    tone: 'coral',
    span: 'square',
  },
] as const

export function GuideNewsroomHero({
  cover,
  idPrefix,
}: {
  cover: string
  idPrefix: string
}) {
  return (
    <header className="gfm-news-hero gfm-bleed">
      <img src={cover} alt="" />
      <div className="gfm-news-hero__shade" aria-hidden />
      <div className="gfm-news-hero__inner">
        <p className="gfm-news-hero__date">{HALLOWEEN_GUIDE_POSTED}</p>
        <h1>Halloween with Little Ones</h1>
        <p className="gfm-news-hero__dek">
          A parent guide to parades, patches, and trick-or-treat plans for ages 0–5 across the South
          Peninsula.
        </p>
        <Link className="gfm-news-hero__cta" to={HALLOWEEN_EVENTS_HREF}>
          Browse Halloween events →
        </Link>
      </div>
      <nav className="gfm-news-index" aria-label="Stories in this guide">
        <p className="gfm-news-index__label">In this guide</p>
        <ul>
          {GUIDE_SECTION_CARDS.map((card) => (
            <li key={card.slug}>
              <a href={`#${idPrefix}-${card.slug}`}>
                <img src={card.image} alt="" />
                <span>
                  <span className="gfm-news-index__date">{card.date}</span>
                  <span className="gfm-news-index__title">{card.title}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}

export function GuideBentoHighlights({ idPrefix }: { idPrefix: string }) {
  return (
    <section className="gfm-bento gfm-bleed" aria-label="Quick picks">
      <div className="gfm-bento__head">
        <h2>Pick your kind of spooky</h2>
        <p>{HALLOWEEN_GUIDE_READ} · Tap a tile to jump</p>
      </div>
      <ul className="gfm-bento__grid">
        {BENTO.map((tile) => (
          <li key={tile.slug} className={`gfm-bento__tile gfm-bento__tile--${tile.span} tone-${tile.tone}`}>
            <a href={`#${idPrefix}-${tile.slug}`}>
              {'image' in tile && tile.image ? <img src={tile.image} alt="" /> : null}
              <span className="gfm-bento__label">{tile.label}</span>
              <span className="gfm-bento__title">{tile.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function GuideGridBand() {
  return (
    <section className="gfm-grid-band gfm-bleed" aria-label="Guide at a glance">
      <div className="gfm-grid-band__inner">
        <div className="gfm-grid-band__cell gfm-grid-band__cell--meta">
          <p className="gfm-grid-band__kicker">October guide</p>
          <p className="gfm-grid-band__stat">
            <span>Region</span>
            <strong>South Peninsula &amp; nearby</strong>
          </p>
          <p className="gfm-grid-band__stat">
            <span>Best for</span>
            <strong>Ages 0–5</strong>
          </p>
        </div>
        <div className="gfm-grid-band__cell gfm-grid-band__cell--accent">
          <p>Peak weekends</p>
          <strong>Oct 24 · Oct 30 · Oct 31</strong>
        </div>
        <div className="gfm-grid-band__cell">
          <p>Free city festivals</p>
          <strong>Saturday mornings</strong>
        </div>
        <div className="gfm-grid-band__cell">
          <p>School carnivals</p>
          <strong>Saturday afternoons</strong>
        </div>
        <div className="gfm-grid-band__cell gfm-grid-band__cell--wide">
          <p>One neighborhood walk on Halloween night is enough—verify participation before you go.</p>
        </div>
      </div>
    </section>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import {
  HALLOWEEN_COLLECTION_PATH,
  HALLOWEEN_EVENTS_HREF,
  HALLOWEEN_GUIDE_COVER,
  HALLOWEEN_GUIDE_PATH,
  HALLOWEEN_GUIDE_POSTED,
} from '../data/halloweenGuide'
import { GUIDE_SECTION_CARDS } from './experimentGuideFullMockupsChrome'
import {
  GuideFactsAside,
  GuidePhotoGallery,
  GuideShowtimeStrip,
  GuideVisitBlock,
} from './experimentGuideTinyDancesChrome'
import { HalloweenGuideDraft } from './experimentLocalGuidesDraft'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import './guide-page.css'
import './experiment-guide-layout-studies.css'
import './experiment-guide-tiny-dances.css'
import './experiment-guide-content-mockups.css'

const VARIANTS = [
  {
    id: 'abn-article',
    name: '1 · Airbnb article',
    note: 'Date · headline · pill · 24px cover · 40rem body',
  },
  {
    id: 'abn-index',
    name: '2 · In this guide',
    note: 'Newsroom head + 3-col section cards',
  },
  {
    id: 'ballet',
    name: '3 · Ballet production',
    note: 'Full-bleed overlay · facts rail',
  },
  {
    id: 'visit',
    name: '4 · Plan your visit',
    note: 'Bleed · FAQ · gallery',
  },
  {
    id: 'hybrid',
    name: '5 · Hybrid',
    note: 'Airbnb title + bleed photo + column body',
  },
] as const

type VariantId = (typeof VARIANTS)[number]['id']

function AirbnbHead({ pillHref, pillLabel }: { pillHref: string; pillLabel: string }) {
  return (
    <header className="gct-abn-head">
      <time>{HALLOWEEN_GUIDE_POSTED.replace(/^Posted /, '')}</time>
      <h1>Halloween with Little Ones</h1>
      <p>
        Halloween falls on Saturday, October 31 this year, but the fun starts well before. Parades,
        patches, and trick-or-treat plans for ages 0–5 on the South Peninsula.
      </p>
      <Link className="gct-abn-pill" to={pillHref}>
        {pillLabel}
      </Link>
    </header>
  )
}

function InThisGuide({ idPrefix }: { idPrefix: string }) {
  return (
    <nav className="gct-index" aria-label="In this guide">
      <h2>In this guide</h2>
      <ul>
        {GUIDE_SECTION_CARDS.map((card) => (
          <li key={card.slug}>
            <a href={`#${idPrefix}-${card.slug}`}>
              <img src={card.image} alt="" />
              <time>{card.date}</time>
              <h3>{card.title}</h3>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function GuideBody({
  variant,
  idPrefix,
}: {
  variant: VariantId
  idPrefix: string
}) {
  const draft = {
    idPrefix,
    cover: HALLOWEEN_GUIDE_COVER,
    heading: 'h1' as const,
    rail: false,
    suppressHero: true,
    suppressCover: true,
  }

  if (variant === 'abn-article') {
    return (
      <div className="gct-gutter">
        <AirbnbHead pillHref={HALLOWEEN_EVENTS_HREF} pillLabel="Browse events" />
        <img className="gct-abn-cover" src={HALLOWEEN_GUIDE_COVER} alt="" />
        <HalloweenGuideDraft {...draft} jumps />
      </div>
    )
  }

  if (variant === 'abn-index') {
    return (
      <div className="gct-gutter">
        <AirbnbHead pillHref={HALLOWEEN_EVENTS_HREF} pillLabel="Browse events" />
        <InThisGuide idPrefix={idPrefix} />
        <HalloweenGuideDraft {...draft} jumps={false} />
      </div>
    )
  }

  if (variant === 'ballet') {
    return (
      <>
        <header className="gct-ballet-hero">
          <img src={HALLOWEEN_GUIDE_COVER} alt="" />
          <div className="gct-ballet-hero__copy">
            <p>October guide · South Peninsula</p>
            <h1>Halloween with Little Ones</h1>
            <div className="gct-pills">
              <Link className="gct-pill" to={HALLOWEEN_EVENTS_HREF}>
                Browse events
              </Link>
              <a className="gct-pill gct-pill--ghost" href={`#${idPrefix}-kind`}>
                Sections
              </a>
            </div>
          </div>
        </header>
        <HalloweenGuideDraft
          {...draft}
          jumps
          railAside={<GuideFactsAside />}
        />
      </>
    )
  }

  if (variant === 'visit') {
    return (
      <>
        <header className="gct-ballet-hero">
          <img src={HALLOWEEN_GUIDE_COVER} alt="" />
          <div className="gct-ballet-hero__copy">
            <p>Plan your visit</p>
            <h1>Halloween with Little Ones</h1>
            <div className="gct-pills">
              <Link className="gct-pill" to={HALLOWEEN_EVENTS_HREF}>
                Browse events
              </Link>
            </div>
          </div>
        </header>
        <HalloweenGuideDraft
          {...draft}
          jumps
          showMap
          afterCover={<GuideShowtimeStrip />}
          afterBody={
            <>
              <GuideVisitBlock />
              <GuidePhotoGallery />
            </>
          }
        />
      </>
    )
  }

  return (
    <>
      <div className="gct-hybrid-hero">
        <div>
          <time>{HALLOWEEN_GUIDE_POSTED.replace(/^Posted /, '')}</time>
          <h1>Halloween with Little Ones</h1>
          <p>
            A parent guide to parades, patches, and trick-or-treat plans for ages 0–5 across the
            South Peninsula.
          </p>
          <Link className="gct-abn-pill" to={HALLOWEEN_EVENTS_HREF}>
            Browse events
          </Link>
        </div>
        <div className="gct-hybrid-hero__media">
          <img src={HALLOWEEN_GUIDE_COVER} alt="" />
        </div>
      </div>
      <HalloweenGuideDraft {...draft} jumps />
    </>
  )
}

export function ExperimentGuideContentMockupsPage() {
  const [variant, setVariant] = useState<VariantId>('abn-article')
  const current = VARIANTS.find((v) => v.id === variant) ?? VARIANTS[0]
  const skin = variant === 'ballet' || variant === 'visit' ? 'tiny-split' : 'column'

  return (
    <>
      <div className="gct-lab" role="region" aria-label="Guide content mockups">
        <div className="gct-lab__inner">
          <p className="gct-lab__tag">Guide article · {current.note}</p>
          <div className="gct-lab__buttons">
            {VARIANTS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={variant === item.id ? 'is-on' : undefined}
                aria-pressed={variant === item.id}
                onClick={() => {
                  setVariant(item.id)
                  window.scrollTo({ top: 0, behavior: 'instant' })
                }}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`guide-page gct-page gct-page--${variant}`}>
        <AppHeader
          logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
          logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
          showBrandName={false}
        />
        <article className={`guide-page skin skin--${skin}`}>
          <GuideBody variant={variant} idPrefix="gct" />
        </article>
        <Footer fullBleed className="mt-0" />
      </div>

      <p className="gct-lab__tag" style={{ textAlign: 'center', padding: '1rem', background: '#111' }}>
        Live article:{' '}
        <Link to={HALLOWEEN_GUIDE_PATH} style={{ color: '#ffd6a8' }}>
          {HALLOWEEN_GUIDE_PATH}
        </Link>
        {' · '}
        <Link to={HALLOWEEN_COLLECTION_PATH} style={{ color: '#ffd6a8' }}>
          Halloween events
        </Link>
      </p>
    </>
  )
}

/** Same page as /experiment/guide-tiny-dances */
export { ExperimentGuideContentMockupsPage as ExperimentGuideTinyDancesPage }

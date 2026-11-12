import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GuideEditorialHero } from '../components/guides/GuideEditorialHero'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import {
  HALLOWEEN_EVENTS_HREF,
  HALLOWEEN_GUIDE_COVER,
  HALLOWEEN_GUIDE_POSTED,
  HALLOWEEN_GUIDE_READ,
} from '../data/halloweenGuide'
import { HALLOWEEN_GUIDE_SECTION_CARDS } from '../data/halloweenGuideSectionCards'
import { useGuideFloatingChrome } from '../hooks/useGuideFloatingChrome'
import type { GuideLifecycleState } from '../utils/guideLifecycle'
import { HalloweenGuideDraft } from './experimentLocalGuidesDraft'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import './guide-page.css'
import './experiment-guide-layout-studies.css'
import './experiment-guide-content-mockups.css'
import './guide-editorial-hero.css'

const INTRO =
  'Halloween falls on Saturday, October 31 this year, but the fun starts well before. Parades, patches, and trick-or-treat plans for ages 0–5 on the South Peninsula.'

const PAST_NOTE =
  'This season has ended. The recommendations below are from Halloween 2026 and are kept here for inspiration and planning.'

/**
 * Design-preview only — editorial intro experiment for Halloween Guide.
 * Does not change the production `/guides/halloween-with-little-ones` page.
 */
export function DesignPreviewHalloweenGuidePage() {
  const [previewStatus, setPreviewStatus] = useState<GuideLifecycleState>('past')
  const { showTop } = useGuideFloatingChrome()

  return (
    <div className="guide-page gct-page gct-page--abn-index halloween-guide-dimmed geh-preview-shell">
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />

      <div className="geh-preview-toolbar" role="group" aria-label="Mockup season preview">
        <p className="geh-preview-toolbar__label">Mockup preview</p>
        <div className="geh-preview-toolbar__toggle">
          <button
            type="button"
            className={previewStatus === 'past' ? 'is-on' : undefined}
            aria-pressed={previewStatus === 'past'}
            onClick={() => setPreviewStatus('past')}
          >
            Past season
          </button>
          <button
            type="button"
            className={previewStatus === 'active' ? 'is-on' : undefined}
            aria-pressed={previewStatus === 'active'}
            onClick={() => setPreviewStatus('active')}
          >
            Active season
          </button>
        </div>
      </div>

      <article className="guide-page skin skin--column">
        <div className="geh-preview-gutter">
          <Link className="guide-page__back" to="/guides">
            ← All Guides
          </Link>
          <GuideEditorialHero
            title="Halloween with Little Ones"
            description={INTRO}
            publicationDate={HALLOWEEN_GUIDE_POSTED.replace(/^Posted /, '')}
            readingTime={HALLOWEEN_GUIDE_READ}
            heroImage={HALLOWEEN_GUIDE_COVER}
            seasonalStatus={previewStatus}
            pastSeasonNote={PAST_NOTE}
            primaryCta={{
              label: 'Browse events',
              href: HALLOWEEN_EVENTS_HREF,
            }}
          />
          <nav className="gct-index gct-index--thumbs" id="guide-index" aria-label="In this guide">
            <h2>In this guide</h2>
            <ul>
              {HALLOWEEN_GUIDE_SECTION_CARDS.map((card) => (
                <li key={card.slug}>
                  <a href={`#guide-${card.slug}`}>
                    <img src={card.image} alt="" style={{ objectPosition: card.focus }} />
                    <span>
                      <time>{card.date}</time>
                      <h3>{card.title}</h3>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <HalloweenGuideDraft
          idPrefix="guide"
          jumps={false}
          rail={false}
          cover={HALLOWEEN_GUIDE_COVER}
          showMap
          heading="h1"
          suppressHero
          suppressCover
          hideEventsCta
        />
      </article>

      <Footer fullBleed className="mt-0" />
      <a
        className={`gsl-totop gsl-totop--exclusive${showTop ? ' is-visible' : ''}`}
        href="#guide-index"
        aria-label="Back to sections"
        aria-hidden={!showTop}
        tabIndex={showTop ? 0 : -1}
      >
        <svg width="18" height="12" viewBox="0 5.5 20 8.5" aria-hidden="true">
          <path
            d="M4.5 12.25 10 6.75 15.5 12.25"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Top</span>
      </a>
    </div>
  )
}

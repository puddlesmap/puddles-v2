import { useState } from 'react'
import { createPortal } from 'react-dom'
import { GuideRelatedFooter } from '../components/guides/GuideRelatedFooter'
import { MoreFromCollectionGuides } from '../components/guides/MoreFromCollectionGuides'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import {
  HELLO_NEW_YEAR_CTA_LABEL,
  HELLO_NEW_YEAR_EVENTS_HREF,
} from '../data/helloNewYearGuide'
import { useGuideFloatingChrome } from '../hooks/useGuideFloatingChrome'
import { HelloNewYearGuideDraft } from './HelloNewYearGuideDraft'
import { HelloNewYearGuideIntro } from './HelloNewYearGuideIntro'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import './guide-page.css'
import './experiment-guide-layout-studies.css'
import './experiment-guide-content-mockups.css'
import './holiday-guide-ambience.css'

export function HelloNewYearGuidePage() {
  const [mapSlug, setMapSlug] = useState<string | null>(null)
  const { showTop } = useGuideFloatingChrome()

  return (
    <div className="guide-page gct-page gct-page--abn-index holiday-guide-dimmed">
      <div className="holiday-guide-blobs" aria-hidden="true">
        <span className="holiday-guide-blob holiday-guide-blob--1" />
        <span className="holiday-guide-blob holiday-guide-blob--2" />
        <span className="holiday-guide-blob holiday-guide-blob--3" />
        <span className="holiday-guide-blob holiday-guide-blob--4" />
        <span className="holiday-guide-blob holiday-guide-blob--5" />
        <span className="holiday-guide-blob holiday-guide-blob--6" />
      </div>
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />
      <article className="guide-page skin skin--column">
        <HelloNewYearGuideIntro
          idPrefix="guide"
          indexId="guide-index"
          selectedMapSlug={mapSlug}
          onSelectMapSlug={setMapSlug}
        />
        <HelloNewYearGuideDraft
          idPrefix="guide"
          afterBody={
            <>
              <MoreFromCollectionGuides
                collectionSlug="holiday-magic"
                currentSlug="hello-new-year"
              />
              <GuideRelatedFooter
                relatedGuides={[]}
                seasonalHref={HELLO_NEW_YEAR_EVENTS_HREF}
                seasonalLinkLabel={HELLO_NEW_YEAR_CTA_LABEL}
              />
            </>
          }
        />
      </article>
      <Footer fullBleed className="mt-0" />
      {createPortal(
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
        </a>,
        document.body,
      )}
    </div>
  )
}

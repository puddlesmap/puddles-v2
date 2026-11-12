import { useState } from 'react'
import { createPortal } from 'react-dom'
import { GuideRelatedFooter } from '../components/guides/GuideRelatedFooter'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import {
  HOLIDAY_STORIES_CTA_LABEL,
  HOLIDAY_STORIES_EVENTS_HREF,
  HOLIDAY_STORIES_RELATED,
} from '../data/holidayStoriesGuide'
import { useGuideFloatingChrome } from '../hooks/useGuideFloatingChrome'
import { HolidayStoriesGuideDraft } from './HolidayStoriesGuideDraft'
import { HolidayStoriesGuideIntro } from './HolidayStoriesGuideIntro'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import './guide-page.css'
import './experiment-guide-layout-studies.css'
import './experiment-guide-content-mockups.css'
import './holiday-guide-ambience.css'

export function HolidayStoriesGuidePage() {
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
        <HolidayStoriesGuideIntro
          idPrefix="guide"
          indexId="guide-index"
          selectedMapSlug={mapSlug}
          onSelectMapSlug={setMapSlug}
        />
        <HolidayStoriesGuideDraft
          idPrefix="guide"
          afterBody={
            <GuideRelatedFooter
              relatedGuides={[...HOLIDAY_STORIES_RELATED]}
              seasonalHref={HOLIDAY_STORIES_EVENTS_HREF}
              seasonalLinkLabel={HOLIDAY_STORIES_CTA_LABEL}
            />
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

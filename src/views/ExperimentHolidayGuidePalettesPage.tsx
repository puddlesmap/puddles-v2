import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { GuideRelatedFooter } from '../components/guides/GuideRelatedFooter'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import {
  HOLIDAY_EVENTS_HREF,
  HOLIDAY_GUIDE_COVER,
  HOLIDAY_GUIDE_CTA_LABEL,
  HOLIDAY_GUIDE_OUTING_IMAGES,
  HOLIDAY_GUIDE_RELATED,
} from '../data/holidayGuide'
import { useGuideFloatingChrome } from '../hooks/useGuideFloatingChrome'
import { HolidayGuideDraft } from './HolidayGuideDraft'
import { HolidayGuideIntro } from './HolidayGuideIntro'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import './guide-page.css'
import './experiment-guide-layout-studies.css'
import './experiment-guide-content-mockups.css'
import './holiday-guide-ambience.css'
import './experiment-holiday-guide-palettes.css'

const PALETTES = [
  {
    id: 'snow',
    name: 'C · Let it snow',
    ref: 'Snowman poster',
    note: 'Cream bg · white panels · orange titles — full guide, color only',
  },
  {
    id: 'atelier',
    name: 'D · Atelier',
    ref: 'Noël à l’atelier',
    note: 'Periwinkle bg · forest cards · cream titles — full guide, color only',
  },
] as const

type PaletteId = (typeof PALETTES)[number]['id']

function FullHolidayGuidePalette({ palette }: { palette: PaletteId }) {
  const [mapSlug, setMapSlug] = useState<string | null>(null)
  const { showTop } = useGuideFloatingChrome()

  return (
    <div
      className={`guide-page gct-page gct-page--abn-index holiday-guide-dimmed holiday-guide-palette holiday-guide-palette--${palette}`}
    >
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
        <HolidayGuideIntro
          idPrefix="guide"
          indexId="guide-index"
          selectedMapSlug={mapSlug}
          onSelectMapSlug={setMapSlug}
        />
        <HolidayGuideDraft
          idPrefix="guide"
          jumps={false}
          rail={false}
          cover={HOLIDAY_GUIDE_COVER}
          heading="h1"
          suppressHero
          suppressCover
          hideEventsCta
          suppressClosing
          linkFinder
          imageOverrides={HOLIDAY_GUIDE_OUTING_IMAGES}
          afterBody={
            <GuideRelatedFooter
              relatedGuides={[...HOLIDAY_GUIDE_RELATED]}
              seasonalHref={HOLIDAY_EVENTS_HREF}
              seasonalLinkLabel={HOLIDAY_GUIDE_CTA_LABEL}
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

export function ExperimentHolidayGuidePalettesPage() {
  const [palette, setPalette] = useState<PaletteId>('snow')
  const current = PALETTES.find((p) => p.id === palette) ?? PALETTES[0]

  return (
    <>
      <div className="hgp-lab" role="region" aria-label="Holiday guide palette mockups">
        <div className="hgp-lab__inner">
          <p className="hgp-lab__tag">
            {current.ref} — {current.note}
          </p>
          <div className="hgp-lab__buttons">
            {PALETTES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={palette === item.id ? 'is-on' : undefined}
                aria-pressed={palette === item.id}
                onClick={() => {
                  setPalette(item.id)
                  window.scrollTo({ top: 0, behavior: 'instant' })
                }}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <FullHolidayGuidePalette key={palette} palette={palette} />

      <p
        className="hgp-lab__tag"
        style={{ textAlign: 'center', padding: '1rem', background: '#111', margin: 0 }}
      >
        Color-only mockups — live guide:{' '}
        <Link to="/guides/holiday-lights-traditions" style={{ color: '#ffd6a8' }}>
          /guides/holiday-lights-traditions
        </Link>
      </p>
    </>
  )
}

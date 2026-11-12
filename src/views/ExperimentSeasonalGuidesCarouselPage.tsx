import { Link, useSearchParams } from 'react-router-dom'
import {
  SeasonalGuidesCarousel,
  type SeasonalCarouselGuide,
} from '../components/guides/SeasonalGuidesCarousel'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { orderGuidesForCollectionHub } from '../data/guideHubFeatured'
import { getSeasonalCollection } from '../data/seasonalDiscovery'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import './experiment-seasonal-discovery.css'
import './experiment-seasonal-guides-carousel.css'

type MockId = 'flat' | 'lime-island' | 'lime-carousel' | 'lime-grid'

const MOCKS: {
  id: MockId
  label: string
  note: string
  surface: 'flat' | 'lime-island'
  desktopMode: 'featured' | 'carousel' | 'card-grid'
}[] = [
  {
    id: 'lime-grid',
    label: 'Lime + card grid (live)',
    note: 'Shipped on Holiday Magic — full-width cards, narrower supporting.',
    surface: 'lime-island',
    desktopMode: 'card-grid',
  },
  {
    id: 'lime-island',
    label: 'Lime + featured rows',
    note: 'Lime island + desktop featured + supporting rows.',
    surface: 'lime-island',
    desktopMode: 'featured',
  },
  {
    id: 'lime-carousel',
    label: 'Lime + desktop carousel',
    note: 'Lime island + swipe carousel with peek.',
    surface: 'lime-island',
    desktopMode: 'carousel',
  },
  {
    id: 'flat',
    label: 'Flat (alt)',
    note: 'No island — desktop featured + supporting.',
    surface: 'flat',
    desktopMode: 'featured',
  },
]

function parseMock(value: string | null): MockId {
  if (
    value === 'lime-island' ||
    value === 'lime-carousel' ||
    value === 'lime-grid' ||
    value === 'flat'
  ) {
    return value
  }
  return 'lime-grid'
}

function hubGuides(): SeasonalCarouselGuide[] {
  return orderGuidesForCollectionHub('holiday-magic').map((guide) => {
    if (guide.slug === 'holiday-lights-traditions') {
      return {
        ...guide,
        displayTitle: `${guide.title} ✨`,
        hubDek: 'Train rides, Santa visits & festive outings.',
      }
    }
    if (guide.slug === 'holiday-stories-play') {
      return { ...guide, displayTitle: `${guide.title} 🎭` }
    }
    if (guide.slug === 'hello-new-year') {
      return { ...guide, displayTitle: `${guide.title} 🎉` }
    }
    return guide
  })
}

/** Preview of Explore-the-guides layout mockups. */
export function ExperimentSeasonalGuidesCarouselPage() {
  const [params] = useSearchParams()
  const mockId = parseMock(params.get('surface'))
  const mock = MOCKS.find((row) => row.id === mockId) ?? MOCKS[0]!
  const collection = getSeasonalCollection('holiday-magic')
  const guides = hubGuides()
  const useLime = mock.surface === 'lime-island'

  return (
    <div className="about-page-shell sgc-mock">
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />
      <main className="sgc-mock__main">
        <p className="sgc-mock__banner">
          Preview · Explore the guides — flat, lime island, carousel, or full-width card grid
        </p>

        <div className="sgc-mock__variants" role="tablist" aria-label="Guide section mockups">
          {MOCKS.map((option) => {
            const active = option.id === mock.id
            return (
              <Link
                key={option.id}
                role="tab"
                aria-selected={active}
                className={`sgc-mock__variant${active ? ' is-active' : ''}`}
                to={`/experiment/seasonal-guides-carousel?surface=${option.id}`}
              >
                <span className="sgc-mock__variant-label">{option.label}</span>
                <span className="sgc-mock__variant-note">{option.note}</span>
              </Link>
            )
          })}
        </div>

        <section
          className={[
            'sgc-mock__hub',
            'seasonal-collection-page',
            'seasonal-collection-page--holiday-magic',
            'seasonal-collection-page--holiday-magic-reverse',
            useLime ? 'sgc-mock__hub--lime-island' : 'sgc-mock__hub--flat',
          ].join(' ')}
          aria-label="Holiday Magic hub preview"
        >
          <Link to="/seasonal/holiday-magic" className="seasonal-collection-back">
            ← Open live Holiday Magic hub
          </Link>
          <header className="seasonal-collection-hero">
            <p className="seasonal-collection-hero__eyebrow">
              {collection?.timingLabel ?? 'November – January'}
            </p>
            <div className="seasonal-collection-hero__title-row">
              <h1 className="seasonal-collection-hero__title">
                {collection?.subtitle ?? 'Holiday magic'}
              </h1>
              {collection?.illustrationSrc ? (
                <img
                  src={collection.illustrationSrc}
                  alt=""
                  className="seasonal-collection-hero__illustration"
                  width={52}
                  height={52}
                  decoding="async"
                />
              ) : null}
            </div>
            <p className="seasonal-collection-hero__subtitle">
              {collection?.moduleTagline ??
                'Lights, festive shows & family outings for little ones.'}
            </p>
          </header>

          <div
            className={[
              'hmg-guides-carousel',
              useLime ? 'sgc-mock-surface--lime-island' : null,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <SeasonalGuidesCarousel guides={guides} desktopMode={mock.desktopMode} />
          </div>

          <div className="sgc-mock__events-placeholder" aria-hidden>
            <p>Event collection continues below (unchanged on the live hub)</p>
          </div>
        </section>
      </main>
      <Footer fullBleed className="mt-0" />
    </div>
  )
}

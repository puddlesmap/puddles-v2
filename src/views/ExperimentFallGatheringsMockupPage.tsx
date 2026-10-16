import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { PageContainer } from '../components/layout/PageContainer'
import { SeasonalEmDashTagline } from '../components/seasonal/SeasonalDiscoveryModuleHeader'
import { SEASONAL_THEME_SCHEDULE } from '../data/seasonalDiscovery'
import {
  PUDDLES_WORDMARK_LOGO_SRC,
  PUDDLES_WORDMARK_LOGO_SRC_2X,
} from './experimentShared'

const FALL_GATHERINGS = SEASONAL_THEME_SCHEDULE.find((entry) => entry.theme === 'Fall gatherings')

export function ExperimentFallGatheringsMockupPage() {
  const entry = FALL_GATHERINGS

  return (
    <div
      className="home-experiment-shell home-experiment-shell--refined home-experiment-shell--hello-fall-collection home-experiment-shell--seasonal-puddles-aligned"
      style={
        {
          '--seasonal-accent-bg': 'linear-gradient(135deg, #fff6ee 0%, #f6e4cf 48%, #f3ebe6 100%)',
          '--seasonal-accent-eyebrow': entry?.eyebrow ?? '#b45309',
          '--seasonal-accent-border': '#e7cbb0',
          '--seasonal-accent-glow': 'rgba(180, 83, 9, 0.16)',
          '--seasonal-accent-title': '#7c2d12',
          '--seasonal-accent-description': '#9a3412',
          '--seasonal-accent-cta': '#7c2d12',
        } as CSSProperties
      }
    >
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />

      <PageContainer className="seasonal-collection-page home-experiment-page--refined layout-container seasonal-collection-page--hello-fall seasonal-collection-page--split">
        <div
          className="seasonal-collection-page__inner"
          style={
            {
              '--seasonal-accent-eyebrow': entry?.eyebrow ?? '#b45309',
              '--seasonal-accent-bg': '#fff6ee',
              '--seasonal-accent-border': '#e7cbb0',
              '--seasonal-accent-glow': 'rgba(180, 83, 9, 0.16)',
            } as CSSProperties
          }
        >
          <p className="seasonal-mockup-banner">Mockup · not on the public site</p>
          <Link to="/admin/seasonal-calendar" className="seasonal-collection-back">
            ← Back to Seasonal
          </Link>

          <header className="seasonal-collection-hero">
            <p className="seasonal-collection-hero__eyebrow">November</p>
            <div className="seasonal-collection-hero__title-row">
              <h1 className="seasonal-collection-hero__title">
                {entry?.moduleTitle ?? 'Fall gatherings with little ones'}
              </h1>
              <img
                src={entry?.illustrationSrc ?? '/seasonal/thanksgiving-fall-outings.png'}
                alt=""
                className="seasonal-collection-hero__illustration"
                width={52}
                height={52}
                decoding="async"
              />
            </div>
            <SeasonalEmDashTagline
              text="Gatherings, harvest days, and short outings for little ones — close to home or worth a little drive."
              className="seasonal-collection-hero__description"
            />
          </header>

          <div className="seasonal-collection-sections">
            <section className="seasonal-collection-band" aria-labelledby="fall-gatherings-close">
              <header className="seasonal-collection-band__header">
                <h2 id="fall-gatherings-close" className="seasonal-collection-band__title">
                  Close to home
                </h2>
                <p className="seasonal-collection-band__subtitle">
                  Palo Alto · Los Altos · Mountain View · Sunnyvale
                </p>
              </header>
              <p className="seasonal-mockup-empty">Events for this collection are not chosen yet.</p>
            </section>
            <section
              className="seasonal-collection-band seasonal-collection-band--secondary"
              aria-labelledby="fall-gatherings-drive"
            >
              <header className="seasonal-collection-band__header">
                <h2 id="fall-gatherings-drive" className="seasonal-collection-band__title">
                  Worth a little drive
                </h2>
                <p className="seasonal-collection-band__subtitle">
                  Harvest days and gatherings a little farther afield.
                </p>
              </header>
              <p className="seasonal-mockup-empty">Events for this collection are not chosen yet.</p>
            </section>
          </div>
        </div>
      </PageContainer>

      <Footer fullBleed className="mt-0" />
    </div>
  )
}

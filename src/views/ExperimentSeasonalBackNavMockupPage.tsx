import { Link } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { SeasonalBrowseCategoriesPreview } from '../components/seasonal/SeasonalBrowseCategoriesPreview'
import { SeasonalDiscoveryModule } from '../components/seasonal/SeasonalDiscoveryModule'
import {
  getComingNextSeasonalTeaser,
  getSeasonalCollectionForExperiment,
  getUpcomingSeasonalCollectionForExperiment,
  resolveFeaturedSeasonalEvents,
} from '../data/seasonalDiscovery'
import './experiment-home-apricot-band.css'

function ComingNextPreview({ asOf }: { asOf: string }) {
  const teaser = getComingNextSeasonalTeaser(new Date(`${asOf}T12:00:00-07:00`))

  if (!teaser) {
    return (
      <p className="home-apricot-mockup-rules__meta">
        As of {asOf}: Coming next hidden (outside 14-day window before Oct 6).
      </p>
    )
  }

  return (
    <aside className="seasonal-next-preview" aria-label="Next seasonal theme">
      <p className="seasonal-next-preview__eyebrow">Coming next</p>
      <div className="seasonal-next-preview__row">
        <img
          src={teaser.illustrationSrc}
          alt=""
          className="seasonal-next-preview__illustration"
          width={72}
          height={72}
          decoding="async"
        />
        <div className="seasonal-next-preview__copy">
          <h2 className="seasonal-next-preview__title">{teaser.subtitle}</h2>
          <p className="seasonal-next-preview__tagline">{teaser.moduleTagline}</p>
        </div>
      </div>
    </aside>
  )
}

/**
 * Review mockup: ← Back home, Browse without lede, Coming next date-gated (no Preview link).
 */
export function ExperimentSeasonalBackNavMockupPage() {
  const collection = getSeasonalCollectionForExperiment()
  const featured = resolveFeaturedSeasonalEvents(collection)
  const halloween = getUpcomingSeasonalCollectionForExperiment()

  return (
    <div className="home-apricot-mockup-rules" style={{ marginTop: '1.25rem', maxWidth: 800 }}>
      <p className="home-apricot-mockup-rules__eyebrow">Review mockup · not deployed</p>
      <h1 className="home-apricot-mockup-rules__title">Seasonal back nav &amp; Coming next</h1>
      <p className="home-apricot-mockup-rules__lede">
        Back home on the collection, Browse chips without the catalog lede, Coming next only in
        the last 2 weeks before Halloween (no Preview link).{' '}
        <Link to="/experiment/seasonal-discovery/hello-fall">Hello Fall collection</Link>
        {' · '}
        <Link to="/">Home</Link>
        {' · '}
        <Link to="/experiment/seasonal-discovery">Seasonal index</Link>
      </p>

      <section className="home-apricot-mockup-specimens" aria-labelledby="mock-back-heading">
        <h2 id="mock-back-heading" className="home-apricot-mockup-rules__col-title">
          1. Collection back link
        </h2>
        <div
          style={
            {
              '--seasonal-accent-eyebrow': collection.accent.eyebrow,
              padding: '1rem 1.15rem',
              maxWidth: 720,
              background: collection.accent.background,
              borderRadius: 12,
            } as CSSProperties
          }
        >
          <Link to="/" className="seasonal-collection-back">
            ← Back home
          </Link>
          <p className="home-apricot-mockup-rules__meta" style={{ marginTop: '0.65rem' }}>
            Goes to <code>/</code> (production Home with Fall band).
          </p>
        </div>
      </section>

      <section className="home-apricot-mockup-specimens" aria-labelledby="mock-browse-heading">
        <h2 id="mock-browse-heading" className="home-apricot-mockup-rules__col-title">
          2. Browse by activity (lede removed)
        </h2>
        <SeasonalBrowseCategoriesPreview />
      </section>

      <section className="home-apricot-mockup-specimens" aria-labelledby="mock-coming-heading">
        <h2 id="mock-coming-heading" className="home-apricot-mockup-rules__col-title">
          3. Coming next timing
        </h2>
        <div style={{ display: 'grid', gap: '1.15rem', marginTop: '0.65rem' }}>
          <ComingNextPreview asOf="2026-09-04" />
          <div>
            <p className="home-apricot-mockup-rules__meta" style={{ marginBottom: '0.5rem' }}>
              As of 2026-09-22 (within 14 days of Oct 6) — teaser only, no Preview Halloween link:
            </p>
            <ComingNextPreview asOf="2026-09-22" />
          </div>
          <div>
            <p className="home-apricot-mockup-rules__meta" style={{ marginBottom: '0.5rem' }}>
              Old Preview CTA (removed from product):
            </p>
            <aside className="seasonal-next-preview" aria-hidden>
              <p className="seasonal-next-preview__eyebrow">Coming next</p>
              <div className="seasonal-next-preview__row">
                <img
                  src={halloween.illustrationSrc}
                  alt=""
                  className="seasonal-next-preview__illustration"
                  width={72}
                  height={72}
                />
                <div className="seasonal-next-preview__copy">
                  <h2 className="seasonal-next-preview__title">{halloween.subtitle}</h2>
                  <p className="seasonal-next-preview__tagline">{halloween.moduleTagline}</p>
                </div>
                <span
                  className="seasonal-next-preview__cta"
                  style={{ opacity: 0.45, textDecoration: 'line-through' }}
                >
                  Preview Halloween →
                </span>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="home-apricot-mockup-specimens" aria-labelledby="mock-empty-heading">
        <h2 id="mock-empty-heading" className="home-apricot-mockup-rules__col-title">
          4. Empty featured band (shell kept)
        </h2>
        <SeasonalDiscoveryModule
          collection={collection}
          events={[]}
          onEventClick={() => undefined}
          bandLayout="home"
          homeBandEyebrow="timing"
          homeBandCopyTone="neutral"
        />
        <p className="home-apricot-mockup-rules__meta" style={{ marginTop: '0.65rem' }}>
          Live band still uses {featured.length} featured{' '}
          {featured.length === 1 ? 'card' : 'cards'} when resolve succeeds.
        </p>
      </section>
    </div>
  )
}

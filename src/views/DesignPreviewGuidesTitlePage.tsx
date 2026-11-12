import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'
import './guides-title-explorations.css'

const PIN = '/brand/puddles-pin-3d.png'

const DEK =
  'Local discoveries, thoughtful recommendations, and helpful tips for families with children ages 0–5.'

/**
 * Design-preview only — Guides H1 lockup explorations with the 3D pin.
 * Production `/guides` is unchanged until a variant is chosen.
 */
export function DesignPreviewGuidesTitlePage() {
  return (
    <div className="gte-page about-page-shell">
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />
      <p className="gte-banner">Design preview · Guides title lockups · noindex</p>

      <div className="gte-variants">
        <section className="gte-card gte-a" aria-labelledby="gte-a-label">
          <p className="gte-card__label" id="gte-a-label">
            A · Control
          </p>
          <h1 className="gte-title">Guides</h1>
          <p className="gte-dek">{DEK}</p>
          <p className="gte-card__note">Plain page title as on live /guides today.</p>
        </section>

        <section className="gte-card gte-b" aria-labelledby="gte-b-label">
          <p className="gte-card__label" id="gte-b-label">
            B · Pin in white circle
          </p>
          <div className="gte-b__row">
            <span className="gte-pin-circle" aria-hidden="true">
              <img src={PIN} alt="" />
            </span>
            <h1 className="gte-title">Guides</h1>
          </div>
          <p className="gte-dek">{DEK}</p>
          <p className="gte-card__note">3D pin sits in a white circle to the left of the title.</p>
        </section>

        <section className="gte-card gte-c" aria-labelledby="gte-c-label">
          <p className="gte-card__label" id="gte-c-label">
            C · Pin alone
          </p>
          <div className="gte-c__row">
            <img className="gte-pin-bare" src={PIN} alt="" />
            <h1 className="gte-title">Guides</h1>
          </div>
          <p className="gte-dek">{DEK}</p>
          <p className="gte-card__note">Larger bare pin mark, no circle background.</p>
        </section>

        <section className="gte-card gte-d" aria-labelledby="gte-d-label">
          <p className="gte-card__label" id="gte-d-label">
            D · Soft pill lockup
          </p>
          <div className="gte-d__pill">
            <img src={PIN} alt="" />
            <h1 className="gte-title">Guides</h1>
          </div>
          <p className="gte-dek">{DEK}</p>
          <p className="gte-card__note">Pin + title inside a cream pill, like a product badge.</p>
        </section>

        <section className="gte-card gte-e" aria-labelledby="gte-e-label">
          <p className="gte-card__label" id="gte-e-label">
            E · Stacked masthead
          </p>
          <div className="gte-e__stack">
            <img src={PIN} alt="" />
            <h1 className="gte-title">Guides</h1>
          </div>
          <p className="gte-dek">{DEK}</p>
          <p className="gte-card__note">Editorial stack: pin above the Guides title.</p>
        </section>
      </div>

      <Footer fullBleed className="mt-0" />
    </div>
  )
}

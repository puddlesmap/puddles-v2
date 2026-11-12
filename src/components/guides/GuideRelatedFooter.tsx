import { Link } from 'react-router-dom'
import { openPuddlesPicksSignup } from '../picks/PuddlesPicksHome'
import '../picks/puddles-picks-home.css'
import './guideRelatedFooter.css'

export type GuideRelatedRow = {
  title: string
  dek: string
  href?: string | null
}

function ComingSoonIcon() {
  return (
    <svg className="grf-coming" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M8 3.5v3M16 3.5v3M3.5 9.5h17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="12" cy="15" r="1.35" fill="currentColor" />
    </svg>
  )
}

function seasonalLinkParts(label: string) {
  const trimmed = label.trim()
  if (trimmed.endsWith('→')) {
    return { text: trimmed.slice(0, -1).trimEnd(), showArrow: true }
  }
  return { text: trimmed, showArrow: true }
}

export function GuideRelatedFooter({
  relatedGuides,
  seasonalHref,
  seasonalLinkLabel = 'Explore holiday activities →',
  disclaimer = "Event details may change. Check the organizer's latest information before heading out.",
}: {
  relatedGuides: GuideRelatedRow[]
  seasonalHref: string
  seasonalLinkLabel?: string
  disclaimer?: string
}) {
  const visible = relatedGuides.filter(Boolean)
  if (visible.length === 0 && !seasonalHref) return null

  const allPublished = visible.length > 0 && visible.every((g) => Boolean(g.href))
  const relatedHeading = allPublished ? 'More guides to explore' : 'More guides on the way'
  const seasonal = seasonalLinkParts(seasonalLinkLabel)

  return (
    <aside className="grf" aria-label="More from Puddles">
      {visible.length > 0 ? (
        <section className="grf-related">
          <h3 className="grf-heading">{relatedHeading}</h3>
          <ul className="grf-related__list">
            {visible.map((guide) => {
              const inner = (
                <>
                  <span className="grf-related__copy">
                    <span className="grf-related__title">{guide.title}</span>
                    <span className="grf-related__dek">{guide.dek}</span>
                  </span>
                  {guide.href ? (
                    <span className="grf-related__chev" aria-hidden="true">
                      →
                    </span>
                  ) : (
                    <ComingSoonIcon />
                  )}
                </>
              )
              return (
                <li key={guide.title}>
                  {guide.href ? (
                    <Link className="grf-related__row is-link" to={guide.href}>
                      {inner}
                    </Link>
                  ) : (
                    <div className="grf-related__row">{inner}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      <section
        className="grf-newsletter community-cta-card community-cta-card--neutral about-cta-section picks-home-share"
        aria-label="Puddles Picks"
      >
        <p className="picks-home-kicker">Puddles Picks · Coming soon</p>
        <h3 className="cta-title">More good plans, delivered.</h3>
        <p className="cta-body">
          Discover local family outings and monthly parent guides, right in your inbox.
        </p>
        <div className="community-cta-card-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => openPuddlesPicksSignup('guide')}
          >
            Join the list
          </button>
        </div>
      </section>

      <p className="grf-seasonal">
        <Link className="grf-seasonal__link" to={seasonalHref}>
          <span>{seasonal.text}</span>
          {seasonal.showArrow ? <span aria-hidden="true">→</span> : null}
        </Link>
      </p>
      <p className="grf-disclaimer">{disclaimer}</p>
    </aside>
  )
}

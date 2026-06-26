import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CommunityCtaCard } from '../components/brand/CommunityCtaCard'
import {
  ABOUT_COMMUNITY_PARAS,
  ABOUT_COMMUNITY_TITLE,
  ABOUT_CTA_BODY,
  ABOUT_CTA_TITLE,
  ABOUT_PILLARS,
} from './aboutShared'

interface AboutPageContentProps {
  trailing?: ReactNode
}

export function AboutPageContent({ trailing }: AboutPageContentProps) {
  return (
    <>
      <div className="about-main">
        <section className="about-features" aria-label="What Puddles offers">
          {ABOUT_PILLARS.map((pillar) => (
            <article key={pillar.title} className="about-feature">
              <div className="about-feature-copy">
                <h2 className="about-feature-title">{pillar.title}</h2>
                <p className="about-feature-body">{pillar.copy}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="about-community" aria-labelledby="about-community-title">
          <div className="about-community-copy">
            <h2 id="about-community-title" className="about-community-title">
              {ABOUT_COMMUNITY_TITLE}
            </h2>
            {ABOUT_COMMUNITY_PARAS.map((paragraph) => (
              <p key={paragraph} className="about-community-para">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="about-community-cta">
            <CommunityCtaCard className="about-cta-card" title={ABOUT_CTA_TITLE} body={ABOUT_CTA_BODY}>
              <Link to="/share" className="btn-primary">
                Share with us
              </Link>
            </CommunityCtaCard>
            <Link to="/" className="about-secondary-link">
              Or find something nearby →
            </Link>
          </div>
        </section>
      </div>

      <footer className="about-footer-band">
        <p className="about-privacy-note">
          Puddles uses privacy-friendly analytics to understand how the site is used. We do not
          collect personal information or use advertising cookies.
        </p>
        {trailing}
      </footer>
    </>
  )
}

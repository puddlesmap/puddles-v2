import { Link } from 'react-router-dom'
import { HALLOWEEN_GUIDE_COVER, HALLOWEEN_GUIDE_PATH } from '../../data/halloweenGuide'

const GUIDE_HREF = `${HALLOWEEN_GUIDE_PATH}?entry=collection`

const GUIDE_TITLE = 'Halloween with Little Ones'
const GUIDE_DEK =
  'Halloween plans for ages 0–5: free costume celebrations, hands-on crafts, daytime trick-or-treating, pumpkin patches, and local neighborhood traditions.'

function GuideCopy({ ctaClass = 'local-guide-card__cta' }: { ctaClass?: string }) {
  return (
    <span className="local-guide-card__copy">
      <span className="local-guide-card__eyebrow">October guide</span>
      <span className="local-guide-card__title">{GUIDE_TITLE}</span>
      <span className="local-guide-card__dek">{GUIDE_DEK}</span>
      <span className={ctaClass}>Explore guide →</span>
    </span>
  )
}

export function LocalGuideCard({ href = GUIDE_HREF }: { href?: string } = {}) {
  return (
    <section className="local-guide-teaser" aria-labelledby="local-guide-teaser-title">
      <h2 id="local-guide-teaser-title" className="local-guide-teaser__label">
        Local Guides
      </h2>
      <Link className="local-guide-card" to={href}>
        <img src={HALLOWEEN_GUIDE_COVER} alt="" />
        <GuideCopy />
      </Link>
    </section>
  )
}

export type GuideCardVariant = 3 | 4 | 5

export function parseGuideCard(value: string | null): GuideCardVariant | null {
  if (value === '3' || value === '4' || value === '5') return Number(value) as GuideCardVariant
  return null
}

function LeadCard() {
  return (
    <Link className="local-guide-card local-guide-card--lead" to={GUIDE_HREF}>
      <span className="local-guide-card__lead">
        <span className="local-guide-card__eyebrow">October guide</span>
        <span className="local-guide-card__title">{GUIDE_TITLE}</span>
      </span>
      <img src={HALLOWEEN_GUIDE_COVER} alt="" />
      <span className="local-guide-card__aside">
        <span className="local-guide-card__dek">{GUIDE_DEK}</span>
        <span className="local-guide-card__cta">Explore guide →</span>
      </span>
    </Link>
  )
}

function PosterCard() {
  return (
    <Link className="local-guide-card local-guide-card--poster" to={GUIDE_HREF}>
      <img src={HALLOWEEN_GUIDE_COVER} alt="" />
      <GuideCopy ctaClass="local-guide-card__pill" />
    </Link>
  )
}

function FeatureCard() {
  return (
    <Link className="local-guide-feature" to={GUIDE_HREF}>
      <span className="local-guide-feature__kicker">October guide</span>
      <span className="local-guide-feature__title">{GUIDE_TITLE}</span>
      <span className="local-guide-feature__card">
        <img src={HALLOWEEN_GUIDE_COVER} alt="" />
        <span className="local-guide-feature__copy">
          <span className="local-guide-card__dek">{GUIDE_DEK}</span>
          <span className="local-guide-card__pill">Explore guide →</span>
        </span>
      </span>
    </Link>
  )
}

export function LocalGuideCardVariant({ variant }: { variant: GuideCardVariant }) {
  return (
    <div className="local-guide-teaser local-guide-teaser--solo">
      {variant === 3 ? <LeadCard /> : null}
      {variant === 4 ? <PosterCard /> : null}
      {variant === 5 ? <FeatureCard /> : null}
    </div>
  )
}

export function LocalGuideCardOptions() {
  return (
    <div className="lg-compare">
      <p className="lg-opt-label">1 · Current</p>
      <LocalGuideCard />

      <p className="lg-opt-label">2 · Text left, image right</p>
      <Link className="local-guide-card local-guide-card--flip" to={GUIDE_HREF}>
        <GuideCopy />
        <img src={HALLOWEEN_GUIDE_COVER} alt="" />
      </Link>

      <p className="lg-opt-label">3 · Title up, image with description</p>
      <LeadCard />

      <p className="lg-opt-label">4 · Photo on top</p>
      <PosterCard />

      <p className="lg-opt-label">5 · Guide name as the heading</p>
      <FeatureCard />
    </div>
  )
}

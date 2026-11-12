import { Link } from 'react-router-dom'
import type { GuideCatalogEntry } from '../../data/guidesCatalog'

export function GuideCardLink({
  guide,
  className,
  children,
}: {
  guide: GuideCatalogEntry
  className?: string
  children: React.ReactNode
}) {
  if (guide.status === 'live' && guide.href) {
    return (
      <Link className={className} to={guide.href}>
        {children}
      </Link>
    )
  }
  return <div className={`${className ?? ''} is-soon`.trim()}>{children}</div>
}

export function SoonBadge() {
  return <span className="ghm-soon">Coming soon</span>
}

export function AirbnbTeaser({ guide }: { guide: GuideCatalogEntry }) {
  const isLive = guide.status === 'live'
  return (
    <GuideCardLink guide={guide} className="abn-teaser">
      <span className="abn-teaser__media">
        <img src={guide.cover} alt="" loading="lazy" />
      </span>
      {isLive ? (
        <time dateTime={guide.sortKey}>{guide.posted}</time>
      ) : (
        <SoonBadge />
      )}
      <h3>{guide.title}</h3>
    </GuideCardLink>
  )
}

export function AirbnbExclusive({ guide }: { guide: GuideCatalogEntry }) {
  const isLive = guide.status === 'live'
  return (
    <GuideCardLink guide={guide} className="abn-exclusive">
      <img src={guide.cover} alt="" loading="lazy" />
      <div>
        <h3>{guide.title}</h3>
        {isLive ? <time dateTime={guide.sortKey}>{guide.posted}</time> : <SoonBadge />}
      </div>
    </GuideCardLink>
  )
}

export function GuidesLetterSection() {
  return (
    <section className="abn-letter" id="abn-about" aria-labelledby="abn-letter-title">
      <div className="abn-letter__inner">
        <h2 id="abn-letter-title">Curated for ages 0–5</h2>
        <p>
          Finding things to do together should feel easier. Discover local favorites, thoughtful
          recommendations, and helpful tips for making the most of your time together.
        </p>
        <Link className="abn-letter__cta" to="/about">
          Meet Puddles →
        </Link>
      </div>
    </section>
  )
}

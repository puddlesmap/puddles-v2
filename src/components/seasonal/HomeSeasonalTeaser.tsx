import { Link } from 'react-router-dom'
import type { CSSProperties, ReactNode } from 'react'
import type { Event } from '../../types/event'
import type { SeasonalCollection } from '../../data/seasonalDiscovery'
import { SeasonalEmDashTagline } from './SeasonalDiscoveryModuleHeader'
import { getEventImageUrl } from '../../utils/eventImages'
import { getSeasonalAvailability } from '../../utils/formatSeasonalSchedule'

export type HomeSeasonalTeaserProof = 'none' | 'photo-strip' | 'micro' | 'featured'

interface HomeSeasonalTeaserProps {
  collection: SeasonalCollection
  href: string
  /** Full-bleed Home top band vs inline strip before results. */
  variant?: 'band' | 'inline'
  /** Visual proof of what’s inside — never a full event feed. */
  proof?: HomeSeasonalTeaserProof
  /** Inline Home B copy: short CompactCopy vs title-with-art + full tagline. */
  inlineCopy?: 'compact' | 'title'
  events?: Event[]
  pickCount?: number
  /** Larger title, with the seasonal image on the last line of the title. */
  prominent?: boolean
  /** Keeps two copies of the same teaser from sharing one heading id. */
  idSuffix?: string
  /** Mock/preview override — production Home leaves this unset. */
  ctaLabelOverride?: string
  /** Optional uppercase cue rendered inside the band above the timing eyebrow. */
  supportLabel?: string | null
  /** Optional second CTA (mock dual-path). When set, band uses nested links instead of one wrap. */
  secondaryCtaLabel?: string | null
  secondaryHref?: string
  /**
   * Optional count line between dek and proof (mock/production).
   * Pass a preformatted string; omit when counts are unavailable.
   */
  countMeta?: string | null
}

function formatTeaserDate(ymd: string): string {
  const parsed = new Date(`${ymd}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return ymd
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Compact “Sep 19 · Half Moon Bay” / “Open today · city” line for teaser previews. */
export function formatSeasonalTeaserMeta(event: Event, now: Date = new Date()): string {
  const city = event.city?.trim() ?? ''
  const avail = getSeasonalAvailability(event, now)
  if (avail.openToday) return city ? `Open today · ${city}` : 'Open today'
  const ymd = avail.nextRelevantYmd || event.date
  const dateLabel = formatTeaserDate(ymd)
  return city ? `${dateLabel} · ${city}` : dateLabel
}

function teaserCtaLabel(
  proof: HomeSeasonalTeaserProof,
  collection: SeasonalCollection,
  pickCount: number,
  variant: 'band' | 'inline',
  inlineCopy: 'compact' | 'title',
): string {
  const count = pickCount > 0 ? String(pickCount) : ''
  if (inlineCopy === 'title') {
    if (collection.slug === 'hello-fall') {
      return count ? `Explore ${count} fall picks →` : 'Explore fall picks →'
    }
    return count ? `Explore ${count} picks →` : 'See the collection →'
  }
  if (proof === 'none' || (proof === 'photo-strip' && variant === 'inline')) {
    return count ? `Explore ${count} activities →` : 'Explore activities →'
  }
  if (proof === 'photo-strip') {
    if (collection.slug === 'holiday-magic') {
      return 'Explore holiday activities →'
    }
    if (collection.slug === 'hello-fall') {
      return count ? `Explore ${count} fall picks →` : 'Explore fall picks →'
    }
    return count ? `Explore ${count} picks →` : 'See the collection →'
  }
  if (proof === 'featured') {
    return collection.slug === 'hello-fall' ? 'See all fall outings →' : 'See all outings →'
  }
  if (proof === 'micro') {
    return count ? `Explore ${count} events →` : 'Explore events →'
  }
  return collection.ctaLabel || 'See the collection'
}

function PhotoStrip({ events }: { events: Event[] }) {
  const photos = events.slice(0, 5)
  if (photos.length === 0) return null

  return (
    <div className="home-seasonal-teaser__photos home-seasonal-teaser__proof" aria-hidden>
      {photos.map((event) => (
        <img
          key={event.id}
          src={getEventImageUrl(event)}
          alt=""
          className="home-seasonal-teaser__photo"
          width={120}
          height={88}
          decoding="async"
        />
      ))}
    </div>
  )
}

function MicroPreviews({ events }: { events: Event[] }) {
  const rows = events.slice(0, 2)
  if (rows.length === 0) return null

  return (
    <ul className="home-seasonal-teaser__micros home-seasonal-teaser__proof">
      {rows.map((event) => (
        <li key={event.id}>
          <span className="home-seasonal-teaser__micro">
            <img
              src={getEventImageUrl(event)}
              alt=""
              className="home-seasonal-teaser__micro-photo"
              width={56}
              height={56}
              decoding="async"
            />
            <span className="home-seasonal-teaser__micro-copy">
              <span className="home-seasonal-teaser__micro-title">{event.title}</span>
              <span className="home-seasonal-teaser__micro-meta">{formatSeasonalTeaserMeta(event)}</span>
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}

function FeaturedThumbs({ events }: { events: Event[] }) {
  const [featured, ...rest] = events
  if (!featured) return null
  const thumbs = rest.slice(0, 2)

  return (
    <div className="home-seasonal-teaser__featured">
      <span className="home-seasonal-teaser__featured-lead">
        <img
          src={getEventImageUrl(featured)}
          alt=""
          className="home-seasonal-teaser__featured-photo"
          width={220}
          height={140}
          decoding="async"
        />
        <span className="home-seasonal-teaser__featured-copy">
          <span className="home-seasonal-teaser__featured-title">{featured.title}</span>
          <span className="home-seasonal-teaser__featured-meta">
            {formatSeasonalTeaserMeta(featured)}
          </span>
        </span>
      </span>
      {thumbs.length > 0 ? (
        <div className="home-seasonal-teaser__featured-thumbs">
          {thumbs.map((event) => (
            <span key={event.id} className="home-seasonal-teaser__featured-thumb">
              <img src={getEventImageUrl(event)} alt="" width={72} height={72} decoding="async" />
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/** Compact Home B tagline — experiment-only; production `moduleTagline` stays unchanged. */
const COMPACT_SEASONAL_TAGLINE = 'Farms, fall fun & seasonal celebrations.'

function CountMetaRow({ text }: { text: string }) {
  return (
    <p className="home-seasonal-teaser__count-meta">
      <svg
        className="home-seasonal-teaser__count-meta-icon"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
      </svg>
      <span>{text}</span>
    </p>
  )
}

function TeaserCopy({
  headingId,
  collection,
  cta,
  supportLabel,
  countMeta,
}: {
  headingId: string
  collection: SeasonalCollection
  cta?: ReactNode
  supportLabel?: string | null
  countMeta?: string | null
}) {
  return (
    <div className="home-seasonal-teaser__copy-col">
      {supportLabel ? <p className="home-seasonal-teaser__support-label">{supportLabel}</p> : null}
      <p className="home-seasonal-teaser__eyebrow">{collection.timingLabel}</p>
      <div className="home-seasonal-teaser__copy">
        <div className="home-seasonal-teaser__title-with-art">
          <h2 id={headingId} className="home-seasonal-teaser__title">
            {collection.subtitle}
          </h2>
          <img
            src={collection.illustrationSrc}
            alt=""
            className="home-seasonal-teaser__title-art"
            width={52}
            height={52}
            decoding="async"
          />
        </div>
        <SeasonalEmDashTagline
          text={collection.moduleTagline}
          className="home-seasonal-teaser__tagline home-seasonal-teaser__tagline--full"
        />
        <p className="home-seasonal-teaser__tagline home-seasonal-teaser__tagline--compact">
          {collection.slug === 'holiday-magic' ? collection.moduleTagline : COMPACT_SEASONAL_TAGLINE}
        </p>
        {countMeta ? <CountMetaRow text={countMeta} /> : null}
        {cta}
      </div>
    </div>
  )
}

function CompactCopy({
  headingId,
  collection,
  cta,
  tagline = COMPACT_SEASONAL_TAGLINE,
}: {
  headingId: string
  collection: SeasonalCollection
  cta?: ReactNode
  tagline?: string
}) {
  return (
    <div className="home-seasonal-teaser__copy">
      <h2 id={headingId} className="home-seasonal-teaser__title">
        {collection.subtitle}
      </h2>
      <p className="home-seasonal-teaser__tagline">{tagline}</p>
      {cta}
    </div>
  )
}

const HALLOWEEN_BANNER_SPARKLES = [
  { top: '16%', left: '78%', size: 2, delay: '0s', duration: '2.8s' },
  { top: '28%', left: '92%', size: 3, delay: '0.7s', duration: '3.3s' },
  { top: '72%', left: '86%', size: 2, delay: '1.2s', duration: '2.6s' },
  { top: '80%', left: '12%', size: 2, delay: '0.4s', duration: '3.1s' },
  { top: '14%', left: '48%', size: 2, delay: '1.6s', duration: '2.9s' },
] as const

function HalloweenBannerSparkles() {
  return (
    <span className="home-seasonal-teaser__sparkles" aria-hidden>
      {HALLOWEEN_BANNER_SPARKLES.map((sparkle) => (
        <span
          key={`${sparkle.top}-${sparkle.left}`}
          className="home-seasonal-teaser__sparkle"
          style={
            {
              top: sparkle.top,
              left: sparkle.left,
              width: sparkle.size,
              height: sparkle.size,
              '--sparkle-delay': sparkle.delay,
              '--sparkle-duration': sparkle.duration,
            } as CSSProperties
          }
        />
      ))}
    </span>
  )
}

/** Compact active-theme teaser — no featured carousel. */
export function HomeSeasonalTeaser({
  collection,
  href,
  variant = 'band',
  proof = 'none',
  inlineCopy = 'compact',
  events = [],
  pickCount = 0,
  prominent = false,
  idSuffix = '',
  ctaLabelOverride,
  supportLabel = null,
  secondaryCtaLabel = null,
  secondaryHref,
  countMeta = null,
}: HomeSeasonalTeaserProps) {
  const headingId = `home-seasonal-teaser-heading-${collection.slug}${idSuffix}`
  const titleCopy = variant === 'inline' && inlineCopy === 'title'
  const showClay = proof === 'none' && !titleCopy
  const ctaLabel =
    ctaLabelOverride ?? teaserCtaLabel(proof, collection, pickCount, variant, inlineCopy)
  const dualCta = Boolean(secondaryCtaLabel)
  const countLine = countMeta?.trim() || null
  const inlinePhotoStrip = proof === 'photo-strip' && variant === 'inline'
  const split = (proof === 'photo-strip' || proof === 'micro') && variant === 'band'
  const halloweenNight = collection.slug === 'halloween-with-little-ones'
  const holidayMagic = collection.slug === 'holiday-magic'
  const compactTagline = halloweenNight || holidayMagic ? collection.moduleTagline : COMPACT_SEASONAL_TAGLINE
  const innerClass = [
    'home-seasonal-teaser__inner',
    variant === 'band' ? 'layout-container' : '',
    split ? 'home-seasonal-teaser__inner--split' : '',
    dualCta ? 'home-seasonal-teaser__inner--dual-cta' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const copyCta = (
    <span className="home-seasonal-teaser__cta home-seasonal-teaser__cta--in-copy">{ctaLabel}</span>
  )
  const proofCta = dualCta ? (
    <span className="home-seasonal-teaser__cta-row home-seasonal-teaser__cta-row--proof">
      <Link className="home-seasonal-teaser__cta home-seasonal-teaser__cta--proof" to={href}>
        {ctaLabel}
      </Link>
      <Link
        className="home-seasonal-teaser__cta home-seasonal-teaser__cta--proof home-seasonal-teaser__cta--secondary"
        to={secondaryHref || href}
      >
        {secondaryCtaLabel}
      </Link>
    </span>
  ) : (
    <span className="home-seasonal-teaser__cta home-seasonal-teaser__cta--proof">{ctaLabel}</span>
  )

  const body = (
    <>
      {halloweenNight ? <HalloweenBannerSparkles /> : null}
      <div className={innerClass}>
        {split ? (
          <>
            <TeaserCopy
              headingId={headingId}
              collection={collection}
              supportLabel={supportLabel}
              countMeta={countLine}
            />
            {proof === 'photo-strip' ? (
              <PhotoStrip events={events} />
            ) : (
              <MicroPreviews events={events} />
            )}
            {proofCta}
          </>
        ) : inlinePhotoStrip ? (
          <>
            {supportLabel ? (
              <p className="home-seasonal-teaser__support-label">{supportLabel}</p>
            ) : null}
            <p className="home-seasonal-teaser__eyebrow">{collection.timingLabel}</p>
            <div className="home-seasonal-teaser__intro">
              <img
                src={collection.illustrationSrc}
                alt=""
                className="home-seasonal-teaser__illustration"
                width={72}
                height={72}
                decoding="async"
              />
              <CompactCopy
                headingId={headingId}
                collection={collection}
                cta={dualCta ? null : copyCta}
                tagline={compactTagline}
              />
            </div>
            {countLine ? <CountMetaRow text={countLine} /> : null}
            <PhotoStrip events={events} />
            {dualCta ? proofCta : null}
          </>
        ) : titleCopy ? (
          <TeaserCopy
            headingId={headingId}
            collection={collection}
            cta={dualCta ? proofCta : copyCta}
            supportLabel={supportLabel}
            countMeta={countLine}
          />
        ) : (
          <>
            {supportLabel ? (
              <p className="home-seasonal-teaser__support-label">{supportLabel}</p>
            ) : null}
            <p className="home-seasonal-teaser__eyebrow">{collection.timingLabel}</p>
            <div className="home-seasonal-teaser__intro">
              {showClay ? (
                <img
                  src={collection.illustrationSrc}
                  alt=""
                  className="home-seasonal-teaser__illustration"
                  width={72}
                  height={72}
                  decoding="async"
                />
              ) : null}
              {variant === 'inline' ? (
                <CompactCopy
                  headingId={headingId}
                  collection={collection}
                  cta={proof === 'none' && !dualCta ? copyCta : null}
                  tagline={compactTagline}
                />
              ) : (
                <div className="home-seasonal-teaser__copy">
                  <h2 id={headingId} className="home-seasonal-teaser__title">
                    {collection.subtitle}
                  </h2>
                  <SeasonalEmDashTagline
                    text={collection.moduleTagline}
                    className="home-seasonal-teaser__tagline"
                  />
                  {countLine ? <CountMetaRow text={countLine} /> : null}
                  {proof === 'none' && !dualCta ? copyCta : null}
                </div>
              )}
            </div>

            {proof === 'featured' ? <FeaturedThumbs events={events} /> : null}
            {proof === 'featured' || dualCta ? proofCta : null}
          </>
        )}
      </div>
    </>
  )

  return (
    <aside
      className={[
        'home-seasonal-teaser',
        variant === 'band' ? 'home-seasonal-teaser--band' : 'home-seasonal-teaser--inline',
        proof !== 'none' ? `home-seasonal-teaser--${proof}` : '',
        titleCopy ? 'home-seasonal-teaser--title-copy' : '',
        halloweenNight ? 'home-seasonal-teaser--halloween-night' : '',
        holidayMagic ? 'home-seasonal-teaser--holiday-magic' : '',
        prominent ? 'home-seasonal-teaser--prominent' : '',
        supportLabel ? 'home-seasonal-teaser--support-label' : '',
        dualCta ? 'home-seasonal-teaser--dual-cta' : '',
        countLine ? 'home-seasonal-teaser--count-meta' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={headingId}
      style={
        {
          '--seasonal-accent-bg': collection.accent.background,
          '--seasonal-accent-eyebrow': collection.accent.eyebrow,
          '--seasonal-accent-border': collection.accent.border,
        } as CSSProperties
      }
    >
      {dualCta ? (
        <div className="home-seasonal-teaser__hit home-seasonal-teaser__hit--static">{body}</div>
      ) : (
        <Link to={href} className="home-seasonal-teaser__hit">
          {body}
        </Link>
      )}
    </aside>
  )
}

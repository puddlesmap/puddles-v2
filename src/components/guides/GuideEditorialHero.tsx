import { Link } from 'react-router-dom'
import type { GuideLifecycleState } from '../../utils/guideLifecycle'

export type GuideEditorialHeroCta = {
  label: string
  href: string
}

export function GuideEditorialHero({
  title,
  description,
  publicationDate,
  readingTime,
  eventCount,
  heroImage,
  seasonalStatus,
  primaryCta,
  pastSeasonNote,
  subtitle,
  tone = 'default',
  metaPlacement = 'above-title',
  hidePublicationDate = false,
}: {
  title: string
  description: string
  publicationDate: string
  readingTime: string
  /** When set, meta shows date · N events · read time. */
  eventCount?: number
  heroImage: string
  seasonalStatus: GuideLifecycleState
  primaryCta?: GuideEditorialHeroCta | null
  pastSeasonNote?: string
  subtitle?: string
  tone?: 'default' | 'holiday'
  /** Where meta (date · read time) sits relative to title/dek. */
  metaPlacement?: 'above-title' | 'below-dek'
  /** Omit date when unpublished / placeholder. */
  hidePublicationDate?: boolean
}) {
  /** Caller decides CTA eligibility (lifecycle + collection events). */
  const showCta = Boolean(primaryCta)
  const isPast = seasonalStatus === 'past'
  const showDate =
    !hidePublicationDate &&
    Boolean(publicationDate) &&
    !/\[Publication date\]/i.test(publicationDate)
  const showEvents = typeof eventCount === 'number' && eventCount > 0
  const classes = [
    'geh',
    showCta ? 'geh--with-cta' : '',
    tone === 'holiday' ? 'geh--holiday' : '',
    metaPlacement === 'below-dek' ? 'geh--meta-below' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const meta = (
    <p className="geh__meta">
      {showDate ? (
        <>
          <time>{publicationDate}</time>
          <span aria-hidden="true">·</span>
        </>
      ) : null}
      {showEvents ? (
        <>
          <span>
            {eventCount} {eventCount === 1 ? 'event' : 'events'}
          </span>
          <span aria-hidden="true">·</span>
        </>
      ) : null}
      <span className="geh__read">
        {metaPlacement === 'below-dek' ? (
          <svg
            className="geh__read-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M12 2.75a9.25 9.25 0 1 1 0 18.5 9.25 9.25 0 0 1 0-18.5Zm0 1.5a7.75 7.75 0 1 0 0 15.5 7.75 7.75 0 0 0 0-15.5Zm.75 3.5a.75.75 0 0 0-1.5 0v4.19l2.72 1.57a.75.75 0 1 0 .76-1.31L12.75 11.3V7.75Z"
            />
          </svg>
        ) : null}
        {readingTime}
      </span>
      {isPast ? <span className="geh__past">· Past season</span> : null}
    </p>
  )

  return (
    <section className={classes} aria-labelledby="geh-title">
      <div className="geh__copy">
        {metaPlacement === 'above-title' ? meta : null}
        {subtitle ? <p className="geh__subtitle">{subtitle}</p> : null}
        <h1 id="geh-title" className="geh__title">
          {title}
        </h1>
        <p className="geh__dek">{description}</p>
        {metaPlacement === 'below-dek' ? meta : null}
        {isPast && pastSeasonNote ? <p className="geh__past-note">{pastSeasonNote}</p> : null}
        {showCta && primaryCta ? (
          <Link className="geh__cta geh__cta--desktop" to={primaryCta.href}>
            {primaryCta.label}
          </Link>
        ) : null}
      </div>
      <div className="geh__media">
        <img src={heroImage} alt="" />
      </div>
      {showCta && primaryCta ? (
        <Link className="geh__cta geh__cta--mobile" to={primaryCta.href}>
          {primaryCta.label}
        </Link>
      ) : null}
    </section>
  )
}

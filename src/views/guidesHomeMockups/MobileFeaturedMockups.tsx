import { Link } from 'react-router-dom'
import { getFeaturedGuide } from '../../data/guidesCatalog'
import { HOLIDAY_GUIDE_DEK } from '../../data/holidayGuide'

function useFeaturedPayload() {
  const featured = getFeaturedGuide()
  const isLive = featured.status === 'live' && Boolean(featured.href)
  return { featured, isLive, dek: HOLIDAY_GUIDE_DEK }
}

function ReadGuideCta({
  href,
  isLive,
  className,
}: {
  href: string | null
  isLive: boolean
  className?: string
}) {
  if (isLive && href) {
    return (
      <Link className={className} to={href}>
        Read guide
      </Link>
    )
  }
  return <span className={`${className ?? ''} is-soon`.trim()}>Coming soon</span>
}

/** A · Magazine cover — tall full-bleed photo, copy over bottom gradient. */
export function MobileFeaturedMagazine() {
  const { featured, isLive, dek } = useFeaturedPayload()
  return (
    <article className="mfm mfm--magazine">
      <div className="mfm__media" aria-hidden="true">
        <img src={featured.cover} alt="" />
      </div>
      <div className="mfm__copy">
        <p className="mfm__eyebrow">Featured guide</p>
        <h2>{featured.title}</h2>
        <p className="mfm__dek">{dek}</p>
        <ReadGuideCta href={featured.href} isLive={isLive} className="mfm__pill" />
      </div>
    </article>
  )
}

/** B · Photo lead — large visible photo first, then title+CTA row and dek. */
export function MobileFeaturedPhotoLead() {
  const { featured, isLive, dek } = useFeaturedPayload()
  return (
    <article className="mfm mfm--photo-lead">
      <div className="mfm__media" aria-hidden="true">
        <img src={featured.cover} alt="" />
      </div>
      <div className="mfm__copy">
        <p className="mfm__eyebrow">Featured guide</p>
        <div className="mfm__title-row">
          <h2>{featured.title}</h2>
          <ReadGuideCta href={featured.href} isLive={isLive} className="mfm__pill" />
        </div>
        <p className="mfm__dek">{dek}</p>
      </div>
    </article>
  )
}

/** C · Overlap strip — tall photo with solid content panel overlapping lower third. */
export function MobileFeaturedOverlap() {
  const { featured, isLive, dek } = useFeaturedPayload()
  return (
    <article className="mfm mfm--overlap">
      <div className="mfm__media" aria-hidden="true">
        <img src={featured.cover} alt="" />
      </div>
      <div className="mfm__copy">
        <p className="mfm__eyebrow">Featured guide</p>
        <h2>{featured.title}</h2>
        <p className="mfm__dek">{dek}</p>
        <ReadGuideCta href={featured.href} isLive={isLive} className="mfm__pill" />
      </div>
    </article>
  )
}

export type MobileFeaturedMockupId = 'magazine' | 'photo-lead' | 'overlap'

export function MobileFeaturedMockupBody({ id }: { id: MobileFeaturedMockupId }) {
  switch (id) {
    case 'magazine':
      return <MobileFeaturedMagazine />
    case 'photo-lead':
      return <MobileFeaturedPhotoLead />
    case 'overlap':
      return <MobileFeaturedOverlap />
  }
}

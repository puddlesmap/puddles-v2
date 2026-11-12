import type { ReactNode } from 'react'
import { EventDetailLink } from '../EventDetailLink'

export function eventIdFromHref(href: string): string {
  return href.replace(/^\/event\//, '')
}

export function GuideExt({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="lgl-textlink" href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  )
}

export function GuideEventTextLink({
  href,
  guideSlug,
  className = 'lgl-textlink',
  children,
}: {
  href: string
  guideSlug: string
  className?: string
  children: ReactNode
}) {
  return (
    <EventDetailLink
      eventId={eventIdFromHref(href)}
      guideSlug={guideSlug}
      className={className}
    >
      {children}
    </EventDetailLink>
  )
}

export function GuideIconLine({
  label,
  text,
  continued = false,
}: {
  label: string
  text: string
  continued?: boolean
}) {
  if (!label) {
    return (
      <p className={continued ? 'lgg-iconline lgg-iconline--more' : 'lgg-iconline lgg-iconline--plain'}>
        {continued ? <b aria-hidden="true">Puddles tip:</b> : null}
        <span>{text}</span>
      </p>
    )
  }

  return (
    <p className="lgg-iconline">
      <b>{label}</b>
      <span>{text}</span>
    </p>
  )
}

export function GuidePuddlesTip({
  text,
  label = 'Good to know:',
}: {
  text: string
  label?: string
}) {
  const lines = text.split(/(?<=\.)\s+/).filter(Boolean)
  if (lines.length < 2) {
    return <GuideIconLine label={label} text={text} />
  }

  return (
    <div className="lgg-iconline lgg-before">
      <b>{label}</b>
      <ul className="lgg-tips">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  )
}

export function GuideOnPuddles({
  href,
  guideSlug,
  image,
  label,
}: {
  href: string
  guideSlug: string
  image?: string
  label: string
}) {
  return (
    <>
      {image ? (
        <EventDetailLink
          eventId={eventIdFromHref(href)}
          guideSlug={guideSlug}
          className="lgg-event"
        >
          <img src={image} alt={label} />
        </EventDetailLink>
      ) : null}
      <EventDetailLink
        eventId={eventIdFromHref(href)}
        guideSlug={guideSlug}
        className="lgg-event lgg-event--text"
      >
        <span>
          <strong>Event details</strong>
          <span>Open on Puddles</span>
        </span>
      </EventDetailLink>
    </>
  )
}

export type GuideRecBaseProps = {
  title: string
  when: string
  children?: ReactNode
  why?: string
  cost?: string
  tip?: string
  important?: string
  puddlesHref?: string
  guideSlug: string
  links?: { href: string; label: string }[]
  /** Anchor id for “View on map” (without #). */
  mapAnchor?: string
  onViewOnMap?: (slug: string) => void
  eventAnchorId?: string
}

export function GuideRecBody({
  title,
  when,
  children,
  why,
  cost,
  tip,
  important,
  puddlesHref,
  guideSlug,
  links,
  image,
  mapAnchor,
  onViewOnMap,
  eventAnchorId,
}: GuideRecBaseProps & { image?: string }) {
  return (
    <>
      <h4 id={eventAnchorId}>{title}</h4>
      <p className="lgg-when">{when}</p>
      {children}
      {why ? <GuideIconLine label="Why go:" text={why} /> : null}
      {cost ? <GuideIconLine label="Cost:" text={cost} /> : null}
      {tip ? <GuidePuddlesTip text={tip} /> : null}
      {important ? <GuideIconLine label="Important:" text={important} /> : null}
      <div className="gem-actions">
        {puddlesHref ? (
          <GuideOnPuddles href={puddlesHref} guideSlug={guideSlug} image={image} label={title} />
        ) : (
          links?.map((link) => (
            <GuideExt key={link.href} href={link.href}>
              {link.label}
            </GuideExt>
          ))
        )}
        {mapAnchor && onViewOnMap ? (
          <button
            type="button"
            className="gem-map-link"
            onClick={() => onViewOnMap(mapAnchor)}
          >
            View on map
          </button>
        ) : null}
      </div>
    </>
  )
}

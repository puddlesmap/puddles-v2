import { useEffect, useId, useRef, useState } from 'react'
import { GuideRecBody, type GuideRecBaseProps } from './guideEditorialShared'
import '../event-photo-source.css'
import './guideEditorialModules.css'

function GuidePhotoCredit({
  credit,
  href,
  kindLabel = 'Photo',
}: {
  credit: string
  href?: string
  kindLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="event-photo-source gem-featured__photo-source">
      <button
        type="button"
        className="event-photo-source__chip"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setOpen((prev) => !prev)
        }}
      >
        Photo
      </button>
      {open ? (
        <div
          id={panelId}
          className="event-photo-source__panel"
          role="dialog"
          aria-label="Photo source"
          onClick={(event) => event.stopPropagation()}
        >
          <p className="event-photo-source__eyebrow">{kindLabel}</p>
          <p className="event-photo-source__credit">{credit}</p>
          {href ? (
            <a className="event-photo-source__link" href={href} target="_blank" rel="noreferrer">
              View original source <span aria-hidden="true">↗</span>
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function FeaturedExperience({
  image,
  imageAlt,
  imageFit = 'cover',
  imagePosition,
  imageCredit,
  imageCreditHref,
  imageCreditKind,
  ...rec
}: GuideRecBaseProps & {
  image: string
  imageAlt?: string
  imageFit?: 'cover' | 'contain'
  /** CSS object-position for cover crops (e.g. "center bottom"). */
  imagePosition?: string
  imageCredit?: string
  imageCreditHref?: string
  imageCreditKind?: string
}) {
  const mediaClass =
    imageFit === 'contain' ? 'gem-featured__media gem-featured__media--contain' : 'gem-featured__media'

  return (
    <article className="lgg-out gem-featured">
      <div className={mediaClass}>
        <div className="gem-featured__media-frame">
          <img
            src={image}
            alt={imageAlt ?? ''}
            style={imagePosition ? { objectPosition: imagePosition } : undefined}
          />
        </div>
        {imageCredit ? (
          <GuidePhotoCredit
            credit={imageCredit}
            href={imageCreditHref}
            kindLabel={imageCreditKind ?? 'Photo'}
          />
        ) : null}
      </div>
      <div className="gem-featured__body">
        <GuideRecBody {...rec} />
      </div>
    </article>
  )
}

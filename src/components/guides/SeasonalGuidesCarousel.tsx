'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { GuideCatalogEntry } from '../../data/guidesCatalog'
import './seasonalGuidesCarousel.css'

/** @deprecated Kept for experiment route query typing; layout no longer branches on variant. */
export type SeasonalGuidesCarouselVariant = 'a' | 'b' | 'c'

export type SeasonalCarouselGuide = GuideCatalogEntry & {
  /** Optional hub-short dek override */
  hubDek?: string
  displayTitle?: string
}

type Props = {
  guides: SeasonalCarouselGuide[]
  /** Ignored — single editorial layout. Optional for older experiment callers. */
  variant?: SeasonalGuidesCarouselVariant
  heading?: string
  /**
   * Desktop presentation.
   * `featured` = live hub (featured + supporting rows).
   * `carousel` = swipe carousel at all breakpoints (mockup).
   * `card-grid` = full-width three-card grid, narrower supporting (mockup).
   */
  desktopMode?: 'featured' | 'carousel' | 'card-grid'
}

function titleOf(guide: SeasonalCarouselGuide) {
  return guide.displayTitle ?? guide.title
}

function dekOf(guide: SeasonalCarouselGuide) {
  return guide.hubDek ?? guide.dek
}

function guideHref(guide: SeasonalCarouselGuide) {
  if (guide.status !== 'live' || !guide.href) return null
  const base = guide.href
  return base.includes('?') ? `${base}&entry=collection` : `${base}?entry=collection`
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Mobile / tablet carousel card — image-led with dek. */
function GuideCard({
  guide,
  index,
  featured,
}: {
  guide: SeasonalCarouselGuide
  index: number
  featured: boolean
}) {
  const href = guideHref(guide)
  const live = Boolean(href)
  const title = titleOf(guide)
  const label = featured && live ? 'Featured guide' : live ? 'Guide' : 'Coming soon'
  const className = [
    'sgc-card',
    featured ? 'sgc-card--featured' : 'sgc-card--secondary',
    live ? 'is-live' : 'is-soon',
  ].join(' ')

  const body = (
    <>
      <div className="sgc-card__media">
        <img src={guide.cover} alt="" decoding="async" />
      </div>
      <div className="sgc-card__panel">
        <p className="sgc-card__label">{label}</p>
        <h3 className="sgc-card__title">{title}</h3>
        <p className="sgc-card__dek">{dekOf(guide)}</p>
        {live ? <span className="sgc-card__cta">Read guide →</span> : null}
      </div>
    </>
  )

  if (live && href) {
    return (
      <Link
        className={className}
        to={href}
        data-slide-index={index}
        aria-label={`${title}. Read guide`}
      >
        {body}
      </Link>
    )
  }

  return (
    <article
      className={className}
      data-slide-index={index}
      aria-label={`${title}. Coming soon`}
    >
      {body}
    </article>
  )
}

/** Desktop featured column — compact, no dek. */
function DesktopFeatured({ guide }: { guide: SeasonalCarouselGuide }) {
  const href = guideHref(guide)
  const live = Boolean(href)
  const title = titleOf(guide)
  const className = ['sgc-featured', live ? 'is-live' : 'is-soon'].join(' ')

  const body = (
    <>
      <div className="sgc-featured__media">
        <img src={guide.cover} alt="" decoding="async" />
      </div>
      <div className="sgc-featured__panel">
        <p className="sgc-featured__label">{live ? 'Featured guide' : 'Coming soon'}</p>
        <h3 className="sgc-featured__title">{title}</h3>
        {live ? <span className="sgc-featured__cta">Read guide →</span> : null}
      </div>
    </>
  )

  if (live && href) {
    return (
      <Link className={className} to={href} aria-label={`${title}. Read guide`}>
        {body}
      </Link>
    )
  }

  return (
    <article className={className} aria-label={`${title}. Coming soon`}>
      {body}
    </article>
  )
}

/** Desktop supporting row — thumb + title + status on dark page. */
function DesktopSupporting({ guide }: { guide: SeasonalCarouselGuide }) {
  const href = guideHref(guide)
  const live = Boolean(href)
  const title = titleOf(guide)
  const className = ['sgc-support', live ? 'is-live' : 'is-soon'].join(' ')

  const body = (
    <>
      <div className="sgc-support__thumb">
        <img src={guide.cover} alt="" decoding="async" />
      </div>
      <div className="sgc-support__copy">
        <h3 className="sgc-support__title">{title}</h3>
        {live ? (
          <span className="sgc-support__cta">Read guide →</span>
        ) : (
          <span className="sgc-support__status">Coming soon</span>
        )}
      </div>
    </>
  )

  if (live && href) {
    return (
      <Link className={className} to={href} aria-label={`${title}. Read guide`}>
        {body}
      </Link>
    )
  }

  return (
    <article className={className} aria-label={`${title}. Coming soon`}>
      {body}
    </article>
  )
}

/**
 * Editorial Explore-the-guides collection:
 * mobile/tablet snap carousel with peek + dots;
 * desktop featured + compact supporting previews.
 */
export function SeasonalGuidesCarousel({
  guides,
  heading = 'Explore the guides',
  desktopMode = 'featured',
}: Props) {
  const slides = guides.filter((g) => Boolean(g.cover && (g.hubDek || g.dek)))
  const [active, setActive] = useState(0)
  const [wideViewport, setWideViewport] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 900px)').matches : false,
  )
  const scrollerRef = useRef<HTMLDivElement>(null)
  const labelId = useId()
  const count = slides.length
  const featured = slides[0]
  const supporting = slides.slice(1)
  const useDesktopFeatured = desktopMode === 'featured' && wideViewport
  const useCardGrid = desktopMode === 'card-grid'
  const useCarouselDesktop = desktopMode === 'carousel'

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(min-width: 900px)')
    const sync = () => setWideViewport(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return
      const next = ((index % count) + count) % count
      setActive(next)
      const scroller = scrollerRef.current
      const slide = scroller?.querySelector<HTMLElement>(`[data-slide-index="${next}"]`)
      slide?.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        inline: 'start',
        block: 'nearest',
      })
    },
    [count],
  )

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    const syncActive = () => {
      const slidesEls = [...scroller.querySelectorAll<HTMLElement>('[data-slide-index]')]
      if (!slidesEls.length) return
      const left = scroller.scrollLeft
      let best = 0
      let bestDist = Infinity
      for (const el of slidesEls) {
        const dist = Math.abs(el.offsetLeft - left)
        if (dist < bestDist) {
          bestDist = dist
          best = Number(el.dataset.slideIndex)
        }
      }
      setActive(best)
    }

    syncActive()
    scroller.addEventListener('scroll', syncActive, { passive: true })
    return () => {
      scroller.removeEventListener('scroll', syncActive)
    }
  }, [count])

  if (slides.length === 0 || !featured) return null

  const showMobileDots = count > 1

  return (
    <section
      className={[
        'sgc',
        'sgc--editorial',
        'sgc--flat',
        useCarouselDesktop ? 'sgc--desktop-carousel' : null,
        useCardGrid ? 'sgc--desktop-card-grid' : null,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={labelId}
    >
      <h2 id={labelId} className="sgc__heading">
        {heading}
      </h2>

      {/* Carousel (mobile / tablet; also desktop when desktopMode=carousel) */}
      <div className="sgc__mobile" aria-hidden={useDesktopFeatured || undefined}>
        <div className="sgc__stage">
          <div
            className="sgc__viewport"
            ref={scrollerRef}
            data-count={count}
            tabIndex={useDesktopFeatured ? -1 : 0}
            role="region"
            aria-roledescription="carousel"
            aria-label={heading}
            onKeyDown={(event) => {
              if (useDesktopFeatured) return
              if (event.key === 'ArrowRight') {
                event.preventDefault()
                goTo(active + 1)
              } else if (event.key === 'ArrowLeft') {
                event.preventDefault()
                goTo(active - 1)
              }
            }}
          >
            {slides.map((guide, index) => (
              <GuideCard
                key={guide.slug}
                guide={guide}
                index={index}
                featured={index === 0}
              />
            ))}
          </div>
        </div>

        {showMobileDots ? (
          <div className="sgc-dots" role="tablist" aria-label="Guide slides">
            {slides.map((guide, index) => (
              <button
                key={guide.slug}
                type="button"
                role="tab"
                aria-selected={index === active}
                aria-label={`Show ${titleOf(guide)}`}
                className={`sgc-dots__dot${index === active ? ' is-active' : ''}`}
                onClick={() => goTo(index)}
                tabIndex={useDesktopFeatured ? -1 : undefined}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Desktop: featured + supporting previews */}
      <div className="sgc__desktop" aria-hidden={!useDesktopFeatured || undefined}>
        <DesktopFeatured guide={featured} />
        {supporting.length > 0 ? (
          <div className="sgc-supporting" role="list">
            {supporting.map((guide) => (
              <div key={guide.slug} className="sgc-supporting__item" role="listitem">
                <DesktopSupporting guide={guide} />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

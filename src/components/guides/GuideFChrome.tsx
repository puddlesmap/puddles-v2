import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import type { GuideMapCategory, GuidePlace } from '../../data/halloweenGuide'
import { trackGuideNavClicked, trackGuideShared } from '../../utils/analytics'
import { guideCommonProps } from '../../utils/guideVisitAnalytics'
import { hasGoogleMapsApiKey } from '../../utils/googleMaps'
import './guideFChrome.css'

const GuidePlacesMap = lazy(() =>
  import('./GuidePlacesMap').then((mod) => ({ default: mod.GuidePlacesMap })),
)

export type GuideFNavItem = {
  slug: string
  label: string
  imageSrc: string
}

export type GuideFBleedHeroProps = {
  coverSrc: string
  eyebrow: string
  title: string
  /** Optional one-line hero dek; omit on Holiday Magic guides (lede lives under Start Here). */
  dek?: string
  meta: string
  shareUrl: string
  shareTitle: string
  guideSlug: string
  onOpenMap?: () => void
  showMapAction?: boolean
}

export function GuideFBleedHero({
  coverSrc,
  eyebrow,
  title,
  dek,
  meta,
  shareUrl,
  shareTitle,
  guideSlug,
  onOpenMap,
  showMapAction = true,
}: GuideFBleedHeroProps) {
  const [shareStatus, setShareStatus] = useState<string | null>(null)

  const share = async () => {
    trackGuideShared(guideSlug, guideCommonProps(guideSlug))
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl })
        setShareStatus('Shared')
        window.setTimeout(() => setShareStatus(null), 2000)
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareStatus('Link copied')
      window.setTimeout(() => setShareStatus(null), 2000)
    } catch {
      setShareStatus('Unable to share')
      window.setTimeout(() => setShareStatus(null), 2000)
    }
  }

  return (
    <header className="gdm-wire-hero">
      <div className="gdm-wire-hero__media">
        <img src={coverSrc} alt="" decoding="async" />
        <div className="gdm-wire-hero__actions">
          {showMapAction && onOpenMap ? (
            <button type="button" className="gdm-wire-hero__icon" aria-label="View map" onClick={onOpenMap}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M9 4.5 3.75 6.75v12.5L9 17l6 2.5 5.25-2.25V4.75L15 7 9 4.5Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                />
                <path d="M9 4.5v12.5M15 7v12.5" fill="none" stroke="currentColor" strokeWidth="1.75" />
              </svg>
            </button>
          ) : null}
          <button
            type="button"
            className="gdm-wire-hero__icon"
            aria-label={shareStatus ?? 'Share guide'}
            onClick={() => void share()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 4v10M8.5 7.5 12 4l3.5 3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 14.5v3.25A1.75 1.75 0 0 0 7.75 19.5h8.5A1.75 1.75 0 0 0 18 17.75V14.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
          {shareStatus ? (
            <span className="gdm-wire-hero__share-status" role="status">
              {shareStatus}
            </span>
          ) : null}
        </div>
        <div className="gdm-wire-hero__overlay">
          <p className="gdm-wire-hero__eyebrow">{eyebrow}</p>
          <h1>
            {title} <span aria-hidden="true">✨</span>
          </h1>
          {dek ? <p className="gdm-wire-hero__dek">{dek}</p> : null}
          <p className="gdm-wire-hero__meta">{meta}</p>
        </div>
      </div>
    </header>
  )
}

function centerChipInList(list: HTMLUListElement, chip: HTMLElement, behavior: ScrollBehavior) {
  const left = chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2
  list.scrollTo({ left: Math.max(0, left), behavior })
}

export function GuideFStickyNav({
  idPrefix,
  indexId,
  items,
  guideSlug,
}: {
  idPrefix: string
  indexId: string
  items: readonly GuideFNavItem[]
  guideSlug?: string
}) {
  const [activeSlug, setActiveSlug] = useState<string | null>(items[0]?.slug ?? null)
  const [stuck, setStuck] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)
  const ignoreChipScrollUntil = useRef(0)

  useEffect(() => {
    const syncTop = () => {
      const lab = document.querySelector('.gdm-lab')
      const header = document.querySelector('header.app-header.page-header-sticky')
      const el = (lab instanceof HTMLElement ? lab : null) ?? (header instanceof HTMLElement ? header : null)
      const height = el ? el.getBoundingClientRect().height : 0
      document.documentElement.style.setProperty('--gdm-sticky-top', `${Math.ceil(height)}px`)
    }
    syncTop()
    const lab = document.querySelector('.gdm-lab')
    const header = document.querySelector('header.app-header.page-header-sticky')
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncTop) : null
    if (lab && ro) ro.observe(lab)
    if (header && ro) ro.observe(header)
    window.addEventListener('resize', syncTop)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', syncTop)
      document.documentElement.style.removeProperty('--gdm-sticky-top')
    }
  }, [])

  useEffect(() => {
    const sentinel = document.getElementById(`${indexId}-sentinel`)
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setStuck(!entry.isIntersecting)
      },
      { threshold: [0, 1] },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [indexId])

  useEffect(() => {
    const sections = items
      .map((item) => {
        const el = document.getElementById(`${idPrefix}-${item.slug}`)
        return el ? { slug: item.slug, el } : null
      })
      .filter((row): row is { slug: string; el: HTMLElement } => Boolean(row))
    if (sections.length === 0) return

    let frame = 0
    const syncActive = () => {
      frame = 0
      const stickyTop =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gdm-sticky-top')) ||
        0
      const nav = document.getElementById(indexId)
      const navBottom = nav?.getBoundingClientRect().bottom
      // Prefer live sticky bar bottom when stuck; otherwise probe just below chrome.
      const line =
        stuck && typeof navBottom === 'number' && navBottom > stickyTop
          ? navBottom + 10
          : stickyTop + 72

      let next = sections[0].slug
      for (const section of sections) {
        if (section.el.getBoundingClientRect().top <= line) next = section.slug
        else break
      }
      setActiveSlug((prev) => (prev === next ? prev : next))
    }

    const onScrollOrResize = () => {
      if (frame) return
      frame = window.requestAnimationFrame(syncActive)
    }

    syncActive()
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize)
    document.addEventListener('scroll', onScrollOrResize, { passive: true, capture: true })
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      document.removeEventListener('scroll', onScrollOrResize, true)
    }
  }, [idPrefix, indexId, items, stuck])

  useEffect(() => {
    if (!activeSlug || !listRef.current) return
    if (performance.now() < ignoreChipScrollUntil.current) return
    const active = listRef.current.querySelector<HTMLElement>(`a[href="#${idPrefix}-${activeSlug}"]`)
    if (!active) return
    // Scroll only the chip strip — never scrollIntoView (fights page scroll / sticky).
    centerChipInList(listRef.current, active, stuck ? 'smooth' : 'auto')
  }, [activeSlug, idPrefix, stuck])

  const jumpTo = (slug: string) => {
    if (guideSlug) {
      trackGuideNavClicked(guideSlug, slug, 'mobile_sticky', guideCommonProps(guideSlug))
    }
    setActiveSlug(slug)
    ignoreChipScrollUntil.current = performance.now() + 450
    const el = document.getElementById(`${idPrefix}-${slug}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const hash = `#${idPrefix}-${slug}`
    if (window.location.hash !== hash) {
      history.replaceState(null, '', hash)
    }
    const list = listRef.current
    const chip = list?.querySelector<HTMLElement>(`a[href="${hash}"]`)
    if (list && chip) centerChipInList(list, chip, 'smooth')
  }

  return (
    <>
      <div id={`${indexId}-sentinel`} className="gdm-wire-nav-sentinel" aria-hidden="true" />
      <nav
        className={`gem-section-nav gem-section-nav--clay gdm-wire-nav${stuck ? ' is-stuck' : ''}`}
        id={indexId}
        aria-label="In this guide"
      >
        <h2 className="gdm-wire-nav__title">In this guide</h2>
        <ul className="gem-section-nav__list" ref={listRef}>
          {items.map((item) => (
            <li key={item.slug}>
              <a
                href={`#${idPrefix}-${item.slug}`}
                className={activeSlug === item.slug ? 'is-active' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  jumpTo(item.slug)
                }}
              >
                <img className="gem-section-nav__clay" src={item.imageSrc} alt="" decoding="async" />
                <span className="gem-section-nav__label">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}

const CTA_ARROW = (
  <svg className="gdm-wire-ctas__arrow" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M9 6l6 6-6 6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const CTA_MAP_ICON = (
  <svg className="gdm-wire-ctas__icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M9 4.5 3.75 6.75v12.5L9 17l6 2.5 5.25-2.25V4.75L15 7 9 4.5Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
    <path d="M9 4.5v12.5M15 7v12.5" fill="none" stroke="currentColor" strokeWidth="1.75" />
  </svg>
)

export function GuideFInlineCtas({
  onOpenMap,
  collectionHref,
  collectionEventCount,
  showMap = true,
  showCollectionCta = true,
}: {
  onOpenMap?: () => void
  collectionHref: string
  collectionEventCount: number
  showMap?: boolean
  /** When false, hides the “See all N holiday events” card. */
  showCollectionCta?: boolean
}) {
  return (
    <div
      className={`gdm-wire-ctas${showMap && onOpenMap && !showCollectionCta ? ' gdm-wire-ctas--map-only' : ''}`}
      aria-label="Explore more"
    >
      {showMap && onOpenMap ? (
        <button type="button" className="gdm-wire-ctas__card gdm-wire-ctas__card--primary" onClick={onOpenMap}>
          <span className="gdm-wire-ctas__primary-lead">
            {CTA_MAP_ICON}
            <span className="gdm-wire-ctas__copy">
              <span className="gdm-wire-ctas__map-label">Explore the guide map</span>
              <span className="gdm-wire-ctas__map-detail">
                See what’s close by or a little farther away.
              </span>
            </span>
          </span>
          {CTA_ARROW}
        </button>
      ) : null}
      {showCollectionCta ? (
        <Link className="gdm-wire-ctas__card gdm-wire-ctas__card--secondary" to={collectionHref}>
          <span className="gdm-wire-ctas__copy">
            <span className="gdm-wire-ctas__map-label">See all {collectionEventCount} holiday events</span>
            <span className="gdm-wire-ctas__map-detail">Find more outings by date or city.</span>
          </span>
          {CTA_ARROW}
        </Link>
      ) : null}
    </div>
  )
}

export function GuideFExploreHeader({
  title = 'Explore the outings',
  lede = 'What to expect and a few things to know before you go.',
}: {
  title?: string
  lede?: string
}) {
  return (
    <header className="gdm-wire-explore">
      <h2 className="gdm-wire-explore__title">{title}</h2>
      <p className="gdm-wire-lede gdm-wire-lede--sections">{lede}</p>
    </header>
  )
}

export function GuideFMapOverlay({
  idPrefix,
  open,
  onClose,
  onReadInGuide,
  places,
  categories,
  selectedSlug,
  onSelectSlug,
  defaultCategoryId,
  closeLabel = 'Back to Guide',
}: {
  idPrefix: string
  open: boolean
  onClose: () => void
  /** Close the map and scroll to the matching guide section. */
  onReadInGuide: (slug: string) => void
  places: readonly GuidePlace[] | GuidePlace[]
  categories: readonly GuideMapCategory[] | GuideMapCategory[]
  selectedSlug: string | null
  onSelectSlug: (slug: string | null) => void
  defaultCategoryId: string
  closeLabel?: string
}) {
  const showMap = places.length > 0 && hasGoogleMapsApiKey()
  const mapPlaces = useMemo(() => [...places], [places])
  const mapCategories = useMemo(() => [...categories], [categories])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="gdm-lp-map gdm-lp-map--guide" role="dialog" aria-modal="true" aria-label="Guide map">
      <div className="gdm-lp-map__canvas">
        {showMap ? (
          <Suspense fallback={<div className="gdm-lp-map__fallback" aria-hidden="true" />}>
            <GuidePlacesMap
              idPrefix={idPrefix}
              places={mapPlaces}
              categories={mapCategories}
              categorySelect="single"
              defaultCategoryId={defaultCategoryId}
              caption=""
              compact
              pinTheme="holiday"
              showLegend
              selectedSlug={selectedSlug}
              onSelectSlug={onSelectSlug}
              onReadInGuide={onReadInGuide}
            />
          </Suspense>
        ) : (
          <div className="gdm-lp-map__fallback">
            <p>Map preview unavailable in this environment.</p>
          </div>
        )}
      </div>
      <div className="gdm-lp-map__dock gdm-lp-map__dock--simple">
        <button type="button" className="gdm-lp-map__close" onClick={onClose}>
          {closeLabel}
        </button>
      </div>
    </div>,
    document.body,
  )
}

export function GuideFStickyScope({ children }: { children: ReactNode }) {
  return <div className="gdm-sticky-scope">{children}</div>
}

export { HOLIDAY_LIGHTS_FINDER_LEDE } from '../../data/holidayMagicHubGuides'

export const HOLIDAY_LIGHTS_EXPLORE_LEDE =
  'What to expect and a few things to know before you go.'

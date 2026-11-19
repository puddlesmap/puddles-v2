import { useEffect, useMemo, useState } from 'react'
import { trackGuideNavClicked } from '../../utils/analytics'
import { guideCommonProps } from '../../utils/guideVisitAnalytics'
import './guideDesktopToc.css'

export type GuideDesktopTocItem = {
  slug: string
  label: string
}

export function GuideDesktopTocRail({
  idPrefix,
  items,
  guideSlug,
}: {
  idPrefix: string
  items: readonly GuideDesktopTocItem[]
  guideSlug?: string
}) {
  const [activeSlug, setActiveSlug] = useState<string | null>(items[0]?.slug ?? null)
  const [progress, setProgress] = useState(0)

  const sectionIds = useMemo(
    () => items.map((item) => `${idPrefix}-${item.slug}`),
    [idPrefix, items],
  )

  useEffect(() => {
    const sections = sectionIds
      .map((id, index) => {
        const el = document.getElementById(id)
        return el ? { slug: items[index].slug, el } : null
      })
      .filter((row): row is { slug: string; el: HTMLElement } => Boolean(row))
    if (sections.length === 0) return

    let frame = 0
    const sync = () => {
      frame = 0
      const stickyTop =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gdm-sticky-top')) ||
        0
      const line = stickyTop + 96

      let activeIndex = 0
      for (let i = 0; i < sections.length; i += 1) {
        if (sections[i].el.getBoundingClientRect().top <= line) activeIndex = i
        else break
      }
      const nextSlug = sections[activeIndex].slug
      setActiveSlug((prev) => (prev === nextSlug ? prev : nextSlug))

      const first = sections[0].el.getBoundingClientRect()
      const last = sections[sections.length - 1].el.getBoundingClientRect()
      const start = first.top + window.scrollY
      const end = last.bottom + window.scrollY
      const span = Math.max(1, end - start)
      const scrolled = window.scrollY + line - start
      const nextProgress = Math.min(1, Math.max(0, scrolled / span))
      setProgress((prev) => (Math.abs(prev - nextProgress) < 0.005 ? prev : nextProgress))
    }

    const onScrollOrResize = () => {
      if (frame) return
      frame = window.requestAnimationFrame(sync)
    }

    sync()
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [items, sectionIds])

  return (
    <nav className="gdm-toc-rail" aria-label="In this guide">
      <p className="gdm-toc-rail__eyebrow">In this guide</p>
      <div className="gdm-toc-rail__track" aria-hidden="true">
        <span className="gdm-toc-rail__fill" style={{ height: `${progress * 100}%` }} />
      </div>
      <ol className="gdm-toc-rail__list">
        {items.map((item) => {
          const active = item.slug === activeSlug
          return (
            <li key={item.slug}>
              <a
                className={`gdm-toc-rail__link${active ? ' is-active' : ''}`}
                href={`#${idPrefix}-${item.slug}`}
                onClick={(event) => {
                  event.preventDefault()
                  if (guideSlug) {
                    trackGuideNavClicked(guideSlug, item.slug, 'desktop_toc', guideCommonProps(guideSlug))
                  }
                  const el = document.getElementById(`${idPrefix}-${item.slug}`)
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  const hash = `#${idPrefix}-${item.slug}`
                  if (window.location.hash !== hash) {
                    history.replaceState(null, '', hash)
                  }
                }}
              >
                {item.label}
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

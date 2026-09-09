import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

interface HomeSeasonalScrollBlendProps {
  children: ReactNode
  className?: string
  /** Fires when the dock fully collapses (or re-opens near the top). */
  onCollapsedChange?: (collapsed: boolean) => void
}

/**
 * Mobile-only: compact Hello Fall docks above the bottom nav and blends away on scroll.
 * Desktop: hidden (pair with a `home-seasonal-desktop-band` topBand sibling).
 */
export function HomeSeasonalScrollBlend({
  children,
  className = '',
  onCollapsedChange,
}: HomeSeasonalScrollBlendProps) {
  const innerRef = useRef<HTMLDivElement>(null)
  const [blend, setBlend] = useState(0)
  const [naturalHeight, setNaturalHeight] = useState(0)
  const collapsedRef = useRef(false)

  useEffect(() => {
    const inner = innerRef.current
    if (!inner) return

    const measure = () => setNaturalHeight(inner.getBoundingClientRect().height)

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [])

  const dockCap =
    typeof window === 'undefined'
      ? naturalHeight
      : Math.min(naturalHeight || 280, window.innerHeight * 0.42, 18 * 16)
  const visibleHeight = dockCap > 0 ? Math.max(0, dockCap * (1 - blend)) : 0
  const collapsed = blend >= 0.92

  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const range = Math.max(dockCap * 0.45, 88)
        const next = Math.min(1, Math.max(0, window.scrollY / range))
        setBlend(next)
      })
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [dockCap])

  useEffect(() => {
    if (collapsedRef.current === collapsed) return
    collapsedRef.current = collapsed
    onCollapsedChange?.(collapsed)
  }, [collapsed, onCollapsedChange])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--home-seasonal-dock-height', `${visibleHeight}px`)
    return () => {
      root.style.removeProperty('--home-seasonal-dock-height')
    }
  }, [visibleHeight])

  const style = {
    '--home-seasonal-blend': String(blend),
    maxHeight: dockCap > 0 ? `${visibleHeight}px` : undefined,
    opacity: 1 - blend * 0.95,
    transform: `translate3d(0, ${16 * blend}px, 0)`,
  } as CSSProperties

  return (
    <div
      className={[
        'home-seasonal-scroll-blend',
        'home-seasonal-scroll-blend--bottom',
        collapsed ? 'home-seasonal-scroll-blend--collapsed' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      aria-hidden={collapsed}
    >
      <div ref={innerRef} className="home-seasonal-scroll-blend__inner">
        {children}
      </div>
    </div>
  )
}

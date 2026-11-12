import { useEffect, useState } from 'react'

/**
 * Mutually exclusive guide floating chrome:
 * near top → show Picks pill (unless dismissed elsewhere);
 * past ~1 viewport → show Back to Top.
 */
export function useGuideFloatingChrome() {
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const HYSTERESIS_PX = 64
    let frame = 0

    function measure() {
      frame = 0
      // ~0.75 viewport so Top appears sooner after leaving the hero
      const threshold = Math.max(window.innerHeight * 0.75, 360)
      const y = window.scrollY || document.documentElement.scrollTop || 0
      setShowTop((prev) => {
        if (prev) return y > threshold - HYSTERESIS_PX
        return y > threshold + HYSTERESIS_PX
      })
    }

    function onScroll() {
      if (frame) return
      frame = window.requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (showTop) {
      root.dataset.guideTopFab = '1'
      delete root.dataset.guideNearTop
    } else {
      root.dataset.guideNearTop = '1'
      delete root.dataset.guideTopFab
    }
    return () => {
      delete root.dataset.guideTopFab
      delete root.dataset.guideNearTop
    }
  }, [showTop])

  return { showTop }
}

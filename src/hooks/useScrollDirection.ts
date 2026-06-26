import { useEffect, useRef, useState } from 'react'

const MOBILE_MEDIA = '(max-width: 767px)'
const SCROLL_THRESHOLD = 12

/**
 * Returns true when secondary controls should collapse (mobile scroll-down).
 * At page top or scrolling up, returns false.
 */
export function useScrollDirectionCollapse(enabled = true) {
  const [collapsed, setCollapsed] = useState(false)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    if (!enabled) {
      setCollapsed(false)
      return
    }

    const media = window.matchMedia(MOBILE_MEDIA)

    function updateCollapsed() {
      if (!media.matches) {
        setCollapsed(false)
        return
      }

      const y = window.scrollY

      if (y <= SCROLL_THRESHOLD) {
        setCollapsed(false)
      } else {
        const delta = y - lastScrollY.current
        if (Math.abs(delta) >= SCROLL_THRESHOLD) {
          setCollapsed(delta > 0)
        }
      }

      lastScrollY.current = y
      ticking.current = false
    }

    function onScroll() {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(updateCollapsed)
    }

    function onResize() {
      if (!media.matches) setCollapsed(false)
    }

    lastScrollY.current = window.scrollY
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    media.addEventListener('change', onResize)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      media.removeEventListener('change', onResize)
    }
  }, [enabled])

  return collapsed
}

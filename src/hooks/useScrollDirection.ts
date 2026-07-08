import { useEffect, useRef, useState } from 'react'

const MOBILE_MEDIA = '(max-width: 767px)'
const TOP_THRESHOLD = 8
const COLLAPSE_DELTA = 5
const EXPAND_DELTA = 5
const MIN_SCROLL_Y_TO_COLLAPSE = 40

/**
 * Returns true when secondary controls should collapse (mobile scroll-down).
 * At page top or scrolling up, returns false.
 */
export function useScrollDirectionCollapse(enabled = true) {
  const [collapsed, setCollapsed] = useState(false)
  const collapsedRef = useRef(false)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    collapsedRef.current = collapsed
  }, [collapsed])

  useEffect(() => {
    if (!enabled) {
      collapsedRef.current = false
      setCollapsed(false)
      return
    }

    const media = window.matchMedia(MOBILE_MEDIA)

    function setCollapsedSafe(next: boolean) {
      if (collapsedRef.current === next) return
      collapsedRef.current = next
      setCollapsed(next)
    }

    function updateCollapsed() {
      if (!media.matches) {
        setCollapsedSafe(false)
        return
      }

      const y = window.scrollY
      const delta = y - lastScrollY.current

      if (y <= TOP_THRESHOLD) {
        setCollapsedSafe(false)
      } else if (!collapsedRef.current && delta > COLLAPSE_DELTA && y > MIN_SCROLL_Y_TO_COLLAPSE) {
        setCollapsedSafe(true)
      } else if (collapsedRef.current && delta < -EXPAND_DELTA) {
        setCollapsedSafe(false)
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
      if (!media.matches) setCollapsedSafe(false)
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

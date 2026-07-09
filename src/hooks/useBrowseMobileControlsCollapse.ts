import { useEffect, useRef, useState } from 'react'

const MOBILE_MEDIA = '(max-width: 767px)'
const TOP_THRESHOLD = 12
const SCROLL_DOWN_TO_COLLAPSE = 18
const SCROLL_UP_TO_EXPAND = 14
const MIN_SCROLL_Y_TO_COLLAPSE = 64
const TOGGLE_COOLDOWN_MS = 400

/**
 * Mobile browse filter hide/show on scroll. Visual only — no layout or scroll compensation.
 */
export function useBrowseMobileControlsCollapse(enabled = true) {
  const [collapsed, setCollapsed] = useState(false)
  const collapsedRef = useRef(false)
  const lastScrollY = useRef(0)
  const lastToggleAt = useRef(0)

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

      const now = performance.now()
      if (now - lastToggleAt.current < TOGGLE_COOLDOWN_MS) return

      collapsedRef.current = next
      setCollapsed(next)
      lastToggleAt.current = now
    }

    function onScroll() {
      if (!media.matches) {
        setCollapsedSafe(false)
        return
      }

      const y = window.scrollY
      const delta = y - lastScrollY.current
      lastScrollY.current = y

      if (y <= TOP_THRESHOLD) {
        setCollapsedSafe(false)
        return
      }

      if (!collapsedRef.current && delta > SCROLL_DOWN_TO_COLLAPSE && y > MIN_SCROLL_Y_TO_COLLAPSE) {
        setCollapsedSafe(true)
        return
      }

      if (collapsedRef.current && delta < -SCROLL_UP_TO_EXPAND) {
        setCollapsedSafe(false)
      }
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

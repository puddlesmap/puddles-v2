'use client'

import { useEffect } from 'react'

/**
 * On mount (and when the hash changes), scroll the matching element into view.
 * Used when returning from event detail with a guide outing anchor in the URL.
 */
export function useScrollToHashOnMount() {
  useEffect(() => {
    const scrollToHash = () => {
      const id = window.location.hash.replace(/^#/, '').trim()
      if (!id) return
      const el = document.getElementById(id)
      if (!el) return
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }

    // Defer so guide content (outing anchors) is in the DOM.
    const timer = window.setTimeout(scrollToHash, 0)
    window.addEventListener('hashchange', scrollToHash)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('hashchange', scrollToHash)
    }
  }, [])
}

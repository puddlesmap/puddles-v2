import { useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { readEventDetailOverlayState } from '@/utils/nextEventDetailState'

export function ScrollToTop() {
  const location = useLocation()
  const navigationType = useNavigationType()

  useLayoutEffect(() => {
    if (navigationType === 'POP') return
    if (readEventDetailOverlayState()) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [navigationType, location.pathname])

  return null
}

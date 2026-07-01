import { useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { getEventDetailBackground } from '../utils/eventDetailNavigation'

export function ScrollToTop() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const backgroundLocation = getEventDetailBackground(location.state)

  useLayoutEffect(() => {
    if (navigationType === 'POP') return
    if (backgroundLocation) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [backgroundLocation, navigationType, location.pathname])

  return null
}

import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getEventDetailBackground, parseEventDetailLocationState } from '../utils/eventDetailNavigation'

export function useCloseEventDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const navState = parseEventDetailLocationState(location.state)
  const backgroundLocation = getEventDetailBackground(location.state)
  const hasInAppReturn = Boolean(navState)

  const close = useCallback(() => {
    if (backgroundLocation) {
      navigate(-1)
      return
    }

    if (navState) {
      navigate(-1)
      return
    }

    navigate('/browse')
  }, [backgroundLocation, navState, navigate])

  return { close, hasInAppReturn }
}

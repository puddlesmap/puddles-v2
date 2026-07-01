import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Event } from '../types/event'
import type { EventOpenSource } from '../types/analytics'
import { eventDetailPath } from '../utils/eventPages'

export function useEventNavigation() {
  const navigate = useNavigate()

  return useCallback((event: Event, source: EventOpenSource) => {
    navigate(eventDetailPath(event), { state: { eventOpenSource: source } })
  }, [navigate])
}

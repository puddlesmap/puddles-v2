'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { clearEventDetailOverlayState } from '@/utils/nextEventDetailState'

/**
 * Soft navigations used to open a modal over Browse. Event detail is full-page
 * now — break out of the intercepting route with a hard load of the same URL.
 */
export function EventDetailModalClient() {
  const params = useParams<{ eventId: string }>()

  useEffect(() => {
    clearEventDetailOverlayState()
    const id = params.eventId
    const search = typeof window !== 'undefined' ? window.location.search : ''
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    const target = id ? `/event/${id}${search}${hash}` : '/browse'
    window.location.replace(target)
  }, [params.eventId])

  return null
}

'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  clearEventDetailOverlayState,
  isEventDetailOverlayActive,
  readEventDetailOverlayState,
} from '@/utils/nextEventDetailState'

const EVENT_DETAIL_RETURN_KEY = 'puddles:event-detail-return'

function readEventDetailReturnPath(): string | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const value = sessionStorage.getItem(EVENT_DETAIL_RETURN_KEY)?.trim()
    return value || null
  } catch {
    return null
  }
}

function clearEventDetailReturnPath() {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.removeItem(EVENT_DETAIL_RETURN_KEY)
  } catch {
    // ignore
  }
}

export function useCloseEventDetail() {
  const router = useRouter()
  // Only an in-app soft-open has a real history entry to return to. A hard-loaded
  // standalone page (possibly with stale sessionStorage) should fall back to /browse.
  const hasInAppReturn =
    typeof window !== 'undefined'
      ? isEventDetailOverlayActive() || Boolean(readEventDetailReturnPath())
      : false

  const close = useCallback(() => {
    const overlayState = isEventDetailOverlayActive() ? readEventDetailOverlayState() : null
    const returnPath = readEventDetailReturnPath()
    clearEventDetailOverlayState()
    clearEventDetailReturnPath()

    if (overlayState?.backgroundPath) {
      router.back()
      return
    }

    if (overlayState?.returnTo) {
      router.push(overlayState.returnTo)
      return
    }

    if (returnPath) {
      router.push(returnPath)
      return
    }

    router.push('/browse')
  }, [router])

  return { close, hasInAppReturn }
}

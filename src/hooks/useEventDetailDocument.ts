'use client'

import { useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useStructuredData } from './useStructuredData'
import {
  getEventLifecycleStatus,
  getLifecycleDetailEventById,
  isLifecycleEventIndexable,
} from '../utils/eventLifecycle'
import { eventDocumentTitle } from '../utils/eventPages'
import {
  buildEventJsonLd,
  eventStructuredDataId,
} from '../utils/eventStructuredData'
import {
  applyEventPageMeta,
  applyUnavailableEventPageMeta,
  formatDocumentTitle,
} from '../utils/siteMeta'

interface UseEventDetailDocumentOptions {
  skipPageMeta?: boolean
}

export function useEventDetailDocument(options: UseEventDetailDocumentOptions = {}) {
  const params = useParams<{ eventId: string }>()
  const eventId = params.eventId
  const now = useMemo(() => new Date(), [])
  const event = eventId ? getLifecycleDetailEventById(eventId) : undefined
  const lifecycleStatus = event ? getEventLifecycleStatus(event, now) : null
  const isIndexable = event ? isLifecycleEventIndexable(event, now) : false

  const jsonLd = useMemo(
    () => (event && isIndexable ? buildEventJsonLd(event) : null),
    [event, isIndexable],
  )

  useStructuredData(
    event ? eventStructuredDataId(event) : 'puddles-event-jsonld-unavailable',
    jsonLd,
  )

  useEffect(() => {
    if (options.skipPageMeta) return

    if (!eventId || !event) {
      applyUnavailableEventPageMeta(`/event/${eventId ?? 'unknown'}`)
      return
    }

    if (isIndexable) {
      applyEventPageMeta(event)
      return
    }

    // Ended / archived: keep a real title but out of the index.
    const robots = lifecycleStatus === 'archived' ? 'noindex, follow' : 'noindex, nofollow'
    document.title = formatDocumentTitle(eventDocumentTitle(event))
    const robotsMeta = document.querySelector('meta[name="robots"]')
    if (robotsMeta) {
      robotsMeta.setAttribute('content', robots)
    }
  }, [event, eventId, isIndexable, lifecycleStatus, options.skipPageMeta])

  return { eventId, event, publicEvent: event, lifecycleStatus, isIndexable, now }
}

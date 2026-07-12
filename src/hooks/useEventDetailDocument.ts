'use client'

import { useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useStructuredData } from './useStructuredData'
import {
  getCatalogEventById,
  getPublicEventById,
  isEventIndexable,
} from '../utils/eventPages'
import {
  buildEventJsonLd,
  eventStructuredDataId,
} from '../utils/eventStructuredData'
import { applyEventPageMeta, applyUnavailableEventPageMeta } from '../utils/siteMeta'

interface UseEventDetailDocumentOptions {
  skipPageMeta?: boolean
}

export function useEventDetailDocument(options: UseEventDetailDocumentOptions = {}) {
  const params = useParams<{ eventId: string }>()
  const eventId = params.eventId
  const catalogEvent = eventId ? getCatalogEventById(eventId) : undefined
  const publicEvent = eventId ? getPublicEventById(eventId) : undefined
  const isIndexable = publicEvent ? isEventIndexable(publicEvent) : false

  const jsonLd = useMemo(
    () => (publicEvent && isIndexable ? buildEventJsonLd(publicEvent) : null),
    [publicEvent, isIndexable],
  )

  useStructuredData(
    publicEvent ? eventStructuredDataId(publicEvent) : 'puddles-event-jsonld-unavailable',
    jsonLd,
  )

  useEffect(() => {
    if (options.skipPageMeta) return

    if (!eventId) {
      applyUnavailableEventPageMeta('/event/unknown')
      return
    }

    if (publicEvent && isIndexable) {
      applyEventPageMeta(publicEvent)
      return
    }

    applyUnavailableEventPageMeta(`/event/${eventId}`, catalogEvent?.title)
  }, [catalogEvent?.title, eventId, isIndexable, options.skipPageMeta, publicEvent])

  return { eventId, catalogEvent, publicEvent, isIndexable }
}

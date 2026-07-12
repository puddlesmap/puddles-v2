import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useStructuredData } from './useStructuredData'
import {
  getEventLifecycleStatus,
  getLifecycleDetailEventById,
  isLifecycleEventIndexable,
} from '../utils/eventLifecycle'
import { eventDocumentTitle } from '../utils/eventPages'
import { applyEventPageMeta, applyUnavailableEventPageMeta, formatDocumentTitle } from '../utils/siteMeta'
import { useExperimentLifecycleNow } from '../context/ExperimentLifecycleContext'

export function useExperimentLifecycleDocument() {
  const { eventId } = useParams<{ eventId: string }>()
  const now = useExperimentLifecycleNow()
  const catalogEvent = eventId ? getLifecycleDetailEventById(eventId) : undefined
  const lifecycleStatus = catalogEvent ? getEventLifecycleStatus(catalogEvent, now) : null
  const isIndexable = catalogEvent ? isLifecycleEventIndexable(catalogEvent, now) : false

  const jsonLd = useMemo(() => null, [])

  useStructuredData(
    catalogEvent ? `puddles-experiment-event-${catalogEvent.id}` : 'puddles-experiment-event-unavailable',
    jsonLd,
  )

  useEffect(() => {
    if (!eventId) {
      applyUnavailableEventPageMeta('/experiment-expired-activity/event/unknown')
      return
    }

    if (!catalogEvent) {
      applyUnavailableEventPageMeta(`/experiment-expired-activity/event/${eventId}`)
      return
    }

    if (isIndexable) {
      applyEventPageMeta(catalogEvent)
      return
    }

    const robots = lifecycleStatus === 'archived' ? 'noindex, follow' : 'noindex, nofollow'
    document.title = formatDocumentTitle(eventDocumentTitle(catalogEvent))
    const robotsMeta = document.querySelector('meta[name="robots"]')
    if (robotsMeta) {
      robotsMeta.setAttribute('content', robots)
    }
  }, [catalogEvent, eventId, isIndexable, lifecycleStatus])

  return { eventId, catalogEvent, lifecycleStatus, isIndexable, now }
}

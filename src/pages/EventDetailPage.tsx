import { useEffect, useMemo } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'
import { Footer } from '../components/layout/Footer'
import { PageContainer } from '../components/layout/PageContainer'
import { EventDetailView } from '../components/EventDetailView'
import { EventUnavailableState } from '../components/empty-states/EventUnavailableState'
import { useStructuredData } from '../hooks/useStructuredData'
import type { EventOpenSource } from '../types/analytics'
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
import { cityPathForCity } from '../config/localRoutes'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const location = useLocation()
  const catalogEvent = eventId ? getCatalogEventById(eventId) : undefined
  const publicEvent = eventId ? getPublicEventById(eventId) : undefined
  const isIndexable = publicEvent ? isEventIndexable(publicEvent) : false
  const analyticsSource = (location.state as { eventOpenSource?: EventOpenSource } | null)
    ?.eventOpenSource

  const jsonLd = useMemo(
    () => (publicEvent && isIndexable ? buildEventJsonLd(publicEvent) : null),
    [publicEvent, isIndexable],
  )

  useStructuredData(
    publicEvent ? eventStructuredDataId(publicEvent) : 'puddles-event-jsonld-unavailable',
    jsonLd,
  )

  useEffect(() => {
    if (!eventId) {
      applyUnavailableEventPageMeta('/event/unknown')
      return
    }

    if (publicEvent && isIndexable) {
      applyEventPageMeta(publicEvent)
      return
    }

    applyUnavailableEventPageMeta(`/event/${eventId}`, catalogEvent?.title)
  }, [catalogEvent?.title, eventId, isIndexable, publicEvent])

  const backTo = publicEvent ? cityPathForCity(publicEvent.city) : '/browse'
  const backLabel = publicEvent?.city ? `Back to ${publicEvent.city}` : 'Back to browse'

  return (
    <div className="event-detail-page-shell">
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />

      <PageContainer layout="wide" className="event-detail-page-body">
        {publicEvent && isIndexable ? (
          <EventDetailView
            event={publicEvent}
            analyticsSource={analyticsSource}
            backTo={backTo}
            backLabel={backLabel}
          />
        ) : (
          <EventUnavailableState />
        )}
      </PageContainer>

      <Footer fullBleed className="mt-0" />
    </div>
  )
}

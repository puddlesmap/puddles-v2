'use client'

import { useEffect, useMemo } from 'react'
import type { Event } from '../../types/event'
import type { EventOpenSource } from '../../types/analytics'
import type { EventLifecycleStatus } from '../../utils/eventLifecycle'
import { AppHeader } from '../layout/AppHeader'
import { Footer } from '../layout/Footer'
import { EventUnavailableState } from '../empty-states/EventUnavailableState'
import { EventDetailFullpageMockLayout } from './EventDetailFullpageMockLayout'
import { SharedEventDesignLayout } from './SharedEventDesignLayouts'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { trackActivityOpened } from '../../utils/analytics'
import { getSharedEventNearbyActivities } from '../../utils/sharedEventNearby'
import {
  PUDDLES_WORDMARK_LOGO_SRC,
  PUDDLES_WORDMARK_LOGO_SRC_2X,
} from '../../views/experimentShared'

interface SharedEventUrlPageProps {
  event?: Event
  lifecycleStatus?: EventLifecycleStatus | null
  lifecycleNow?: Date
  hasInAppReturn: boolean
  onClose: () => void
  analyticsSource?: EventOpenSource
  guideSlug?: string
}

/** Production /event/:id — full-page Airbnb v3 (desktop + mobile), no modal. */
export function SharedEventUrlPage({
  event,
  lifecycleStatus,
  lifecycleNow,
  hasInAppReturn,
  onClose,
  analyticsSource = 'discovery',
  guideSlug,
}: SharedEventUrlPageProps) {
  const now = useMemo(() => lifecycleNow ?? new Date(), [lifecycleNow])
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const nearbyEvents = useMemo(
    () => (event ? getSharedEventNearbyActivities(event, 6, now) : []),
    [event, now],
  )
  const useLifecycleLayout =
    Boolean(lifecycleStatus) && lifecycleStatus !== 'upcoming'

  useEffect(() => {
    if (event) {
      trackActivityOpened(
        event,
        guideSlug ? 'guide' : analyticsSource,
        guideSlug ? { guide_slug: guideSlug } : undefined,
      )
    }
  }, [analyticsSource, event, guideSlug])

  return (
    <div className="shared-event-url-page">
      {isDesktop || !event || useLifecycleLayout ? (
        <AppHeader
          logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
          logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
          showBrandName={false}
        />
      ) : null}

      {event ? (
        useLifecycleLayout ? (
          <SharedEventDesignLayout
            event={event}
            nearbyEvents={nearbyEvents}
            layout="airbnb-v3"
            lifecycleStatus={lifecycleStatus ?? undefined}
            lifecycleNow={now}
          />
        ) : (
          <EventDetailFullpageMockLayout
            event={event}
            nearbyEvents={nearbyEvents}
            onBack={onClose}
          />
        )
      ) : (
        <div className="shared-event-url-page__unavailable layout-shell-app">
          <EventUnavailableState hasInAppReturn={hasInAppReturn} onClose={onClose} />
        </div>
      )}

      {isDesktop || useLifecycleLayout || !event ? (
        <Footer fullBleed className="mt-0" />
      ) : null}
    </div>
  )
}

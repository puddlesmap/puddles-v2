'use client'

import { useEffect, useMemo } from 'react'
import type { Event } from '../../types/event'
import type { EventOpenSource } from '../../types/analytics'
import type { EventLifecycleStatus } from '../../utils/eventLifecycle'
import { AppHeader } from '../layout/AppHeader'
import { Footer } from '../layout/Footer'
import { EventUnavailableState } from '../empty-states/EventUnavailableState'
import { SharedEventDesignLayout } from './SharedEventDesignLayouts'
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
}

/** Production standalone /event/:id experience — Airbnb v3 shared-link layout. */
export function SharedEventUrlPage({
  event,
  lifecycleStatus,
  lifecycleNow,
  hasInAppReturn,
  onClose,
  analyticsSource = 'discovery',
}: SharedEventUrlPageProps) {
  const now = useMemo(() => lifecycleNow ?? new Date(), [lifecycleNow])
  const nearbyEvents = useMemo(
    () => (event ? getSharedEventNearbyActivities(event, 6, now) : []),
    [event, now],
  )

  useEffect(() => {
    if (event) {
      trackActivityOpened(event, analyticsSource)
    }
  }, [analyticsSource, event])

  return (
    <div className="shared-event-url-page">
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />

      {event ? (
        <SharedEventDesignLayout
          event={event}
          nearbyEvents={nearbyEvents}
          layout="airbnb-v3"
          lifecycleStatus={lifecycleStatus ?? undefined}
          lifecycleNow={now}
        />
      ) : (
        <div className="shared-event-url-page__unavailable layout-shell-app">
          <EventUnavailableState hasInAppReturn={hasInAppReturn} onClose={onClose} />
        </div>
      )}

      <Footer fullBleed className="mt-0" />
    </div>
  )
}

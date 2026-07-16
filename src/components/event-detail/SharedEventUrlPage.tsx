'use client'

import { useEffect, useMemo } from 'react'
import type { Event } from '../../types/event'
import type { EventOpenSource } from '../../types/analytics'
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
  isIndexable: boolean
  hasInAppReturn: boolean
  onClose: () => void
  analyticsSource?: EventOpenSource
}

/** Production standalone /event/:id experience — Airbnb v3 shared-link layout. */
export function SharedEventUrlPage({
  event,
  isIndexable,
  hasInAppReturn,
  onClose,
  analyticsSource = 'discovery',
}: SharedEventUrlPageProps) {
  const nearbyEvents = useMemo(
    () => (event && isIndexable ? getSharedEventNearbyActivities(event, 6) : []),
    [event, isIndexable],
  )

  useEffect(() => {
    if (event && isIndexable) {
      trackActivityOpened(event, analyticsSource)
    }
  }, [analyticsSource, event, isIndexable])

  return (
    <div className="shared-event-url-page">
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />

      {event && isIndexable ? (
        <SharedEventDesignLayout event={event} nearbyEvents={nearbyEvents} layout="airbnb-v3" />
      ) : (
        <div className="shared-event-url-page__unavailable layout-shell-app">
          <EventUnavailableState hasInAppReturn={hasInAppReturn} onClose={onClose} />
        </div>
      )}

      <Footer fullBleed className="mt-0" />
    </div>
  )
}

'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { SharedEventUrlPage } from '@/components/event-detail/SharedEventUrlPage'
import { guideSlugFromLocationSearch, trackPageView } from '@/utils/analytics'
import type { EventOpenSource } from '@/types/analytics'
import { useCloseEventDetail } from '@/hooks/useCloseEventDetail'
import { useEventDetailDocument } from '@/hooks/useEventDetailDocument'
import { clearEventDetailOverlayState } from '@/utils/nextEventDetailState'
import {
  beginBrowseVisit,
  bindGuideToEventDetail,
} from '@/utils/discoveryAttribution'

const STANDALONE_EVENT_PATH = /^\/event\/[^/]+$/

function sourceFromQuery(value: string | null): EventOpenSource | null {
  switch (value) {
    case 'browse_list':
    case 'browse_map':
    case 'home':
    case 'saved':
    case 'guide':
    case 'city_landing':
    case 'discovery':
      return value
    default:
      return null
  }
}

/**
 * SharedEventUrlPage renders the shared react-router <Link>/navigate() components,
 * but this standalone page has no <Routes>, so those navigations would only mutate
 * a dead in-memory location — leaving every header/CTA/nearby/city link
 * "unclickable." Bridge each in-memory location change to a real Next.js navigation.
 */
function StandaloneEventNavBridge({ entry }: { entry: string }) {
  const router = useRouter()
  const location = useLocation()
  const lastTargetRef = useRef(entry)

  useEffect(() => {
    const target = `${location.pathname}${location.search}${location.hash}`
    if (target === lastTargetRef.current) return
    lastTargetRef.current = target

    // Another /event/:id must load its own standalone page. A soft push would
    // trip the (.)event intercept and stack a modal over this page, so hard-load
    // event targets; everything else (home/browse/city) soft-navigates cleanly.
    if (STANDALONE_EVENT_PATH.test(location.pathname)) {
      window.location.assign(target)
      return
    }

    router.push(target)
  }, [location.pathname, location.search, location.hash, router])

  return null
}

export function EventDetailPageClient() {
  const params = useParams<{ eventId: string }>()
  const searchParams = useSearchParams()
  const [guideSlug] = useState(() => guideSlugFromLocationSearch(`?${searchParams.toString()}`))
  const [fromSource] = useState(() => sourceFromQuery(searchParams.get('from_source')))
  const { close, hasInAppReturn } = useCloseEventDetail()
  const { event, lifecycleStatus, now } = useEventDetailDocument({ skipPageMeta: true })

  useEffect(() => {
    clearEventDetailOverlayState()
  }, [])

  useEffect(() => {
    if (guideSlug) {
      bindGuideToEventDetail(guideSlug)
    } else if (fromSource === 'browse_list' || fromSource === 'browse_map' || fromSource === 'discovery') {
      beginBrowseVisit()
    }
  }, [fromSource, guideSlug])

  useEffect(() => {
    if (!params.eventId) return
    trackPageView(`/event/${params.eventId}`)
  }, [params.eventId])

  useEffect(() => {
    const url = new URL(window.location.href)
    let changed = false
    // Canonicalize legacy aliased ids (e.g. hidden disc-* → Published id).
    if (event && params.eventId && event.id !== params.eventId) {
      url.pathname = `/event/${event.id}`
      changed = true
    }
    if (url.searchParams.has('from_guide')) {
      url.searchParams.delete('from_guide')
      changed = true
    }
    if (url.searchParams.has('from_source')) {
      url.searchParams.delete('from_source')
      changed = true
    }
    if (!changed) return
    const next = `${url.pathname}${url.search}${url.hash}`
    window.history.replaceState(window.history.state, '', next)
  }, [event, params.eventId])

  const analyticsSource: EventOpenSource =
    guideSlug || fromSource === 'guide'
      ? 'guide'
      : fromSource ?? 'discovery'

  const entry = params.eventId ? `/event/${params.eventId}` : '/event/unknown'

  return (
    <Suspense fallback={null}>
      <MemoryRouter key={entry} initialEntries={[entry]}>
        <StandaloneEventNavBridge entry={entry} />
        <SharedEventUrlPage
          event={event}
          lifecycleStatus={lifecycleStatus}
          lifecycleNow={now}
          hasInAppReturn={hasInAppReturn}
          onClose={close}
          analyticsSource={analyticsSource}
          guideSlug={guideSlug}
        />
      </MemoryRouter>
    </Suspense>
  )
}

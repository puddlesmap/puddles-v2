'use client'

import { Suspense, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useParams, useRouter } from 'next/navigation'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { SharedEventUrlPage } from '@/components/event-detail/SharedEventUrlPage'
import { useCloseEventDetail } from '@/hooks/useCloseEventDetail'
import { useEventDetailDocument } from '@/hooks/useEventDetailDocument'
import {
  isEventDetailOverlayActive,
  readEventDetailOverlayState,
} from '@/utils/nextEventDetailState'

/** Lazy: soft-open background must not pull Leaflet into the event route graph. */
const ClientRoutePage = dynamic(
  () => import('@/components/ClientRoutePage').then((mod) => mod.ClientRoutePage),
  { ssr: false },
)

const STANDALONE_EVENT_PATH = /^\/event\/[^/]+$/

function backgroundEntryParts(backgroundPath: string): { pathname: string; search: string } {
  const queryIndex = backgroundPath.indexOf('?')
  if (queryIndex === -1) {
    return { pathname: backgroundPath || '/', search: '' }
  }
  return {
    pathname: backgroundPath.slice(0, queryIndex) || '/',
    search: backgroundPath.slice(queryIndex),
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
  const { close, hasInAppReturn } = useCloseEventDetail()
  const { event, lifecycleStatus, now } = useEventDetailDocument({ skipPageMeta: true })

  // Only treat this as a modal soft-open when it was opened in-app this session.
  // A hard load with stale sessionStorage must render the real standalone page.
  if (isEventDetailOverlayActive()) {
    const backgroundPath = readEventDetailOverlayState()?.backgroundPath ?? '/browse'
    const { pathname, search } = backgroundEntryParts(backgroundPath)
    return <ClientRoutePage pathname={pathname} search={search} />
  }

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
          analyticsSource="discovery"
        />
      </MemoryRouter>
    </Suspense>
  )
}

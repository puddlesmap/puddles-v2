'use client'

import type { ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import type { Event } from '@/types/event'
import { trackGuideEventLinkClicked } from '@/utils/analytics'
import { eventDetailPath } from '@/utils/eventPages'
import { saveBrowseReturnSnapshot } from '@/utils/browseReturnState'
import { bindGuideToEventDetail } from '@/utils/discoveryAttribution'
import { guideCommonProps } from '@/utils/guideVisitAnalytics'

interface EventDetailLinkProps {
  eventId: Event['id']
  className?: string
  children: ReactNode
  /** When set, this link is a guide click. The detail view is tracked separately. */
  guideSlug?: string
  placement?: string
  sectionId?: string
}

/**
 * Event detail lives on the Next.js app route `/event/:id` with its own
 * MemoryRouter shell. Soft `router.push` from the react-router catch-all tree
 * hits the intercepting modal, which renders react-router <Link> without a
 * router — use a hard navigation to the standalone event page instead.
 */
export function EventDetailLink({
  eventId,
  className,
  children,
  guideSlug,
  placement,
  sectionId,
}: EventDetailLinkProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const params = new URLSearchParams()
  if (guideSlug) {
    params.set('from_guide', guideSlug)
    params.set('from_source', 'guide')
  }
  const href = params.toString()
    ? `${eventDetailPath({ id: eventId })}?${params.toString()}`
    : eventDetailPath({ id: eventId })

  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        if (guideSlug) {
          bindGuideToEventDetail(guideSlug)
          trackGuideEventLinkClicked(guideSlug, eventId, {
            ...guideCommonProps(guideSlug),
            ...(placement ? { placement } : {}),
            ...(sectionId ? { section_id: sectionId } : {}),
          })
        }
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return
        }

        event.preventDefault()
        saveBrowseReturnSnapshot({ scrollY: window.scrollY })

        const search = searchParams.toString()
        const returnTo = `${pathname}${search ? `?${search}` : ''}`
        try {
          sessionStorage.setItem('puddles:event-detail-return', returnTo)
        } catch {
          // ignore quota / private mode
        }

        window.location.assign(href)
      }}
    >
      {children}
    </a>
  )
}

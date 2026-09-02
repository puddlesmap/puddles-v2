'use client'

import type { ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import type { Event } from '@/types/event'
import { eventDetailPath } from '@/utils/eventPages'
import { saveBrowseReturnSnapshot } from '@/utils/browseReturnState'

interface EventDetailLinkProps {
  eventId: Event['id']
  className?: string
  children: ReactNode
}

/**
 * Event detail lives on the Next.js app route `/event/:id` with its own
 * MemoryRouter shell. Soft `router.push` from the react-router catch-all tree
 * hits the intercepting modal, which renders react-router <Link> without a
 * router — use a hard navigation to the standalone event page instead.
 */
export function EventDetailLink({ eventId, className, children }: EventDetailLinkProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const href = eventDetailPath({ id: eventId })

  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
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

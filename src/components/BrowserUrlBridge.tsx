'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { toPathSearch } from '@/utils/pathSearch'

const EVENT_PATH = /^\/event\/[^/]+$/

/**
 * MemoryRouter does not touch the address bar. Mirror its location to Next,
 * and mirror Back/Forward back into memory. Never do this while the browser
 * URL is an event page — that shell is the modal background, and pushing its
 * path would close the event.
 */
export function BrowserUrlBridge() {
  const location = useLocation()
  const navigate = useNavigate()
  const navigationType = useNavigationType()
  const nextPathname = usePathname()
  const nextSearchParams = useSearchParams()
  const nextRouter = useRouter()

  const nextSearch = nextSearchParams.toString()
  const memoryUrl = toPathSearch(location.pathname, location.search)
  const nextUrl = toPathSearch(nextPathname, nextSearch)

  const memoryUrlRef = useRef(memoryUrl)
  const nextUrlRef = useRef(nextUrl)
  const nextPathRef = useRef(nextPathname)
  const lastWrittenHref = useRef<string | null>(null)
  memoryUrlRef.current = memoryUrl
  nextUrlRef.current = nextUrl
  nextPathRef.current = nextPathname

  useEffect(() => {
    if (EVENT_PATH.test(nextPathRef.current)) return
    if (memoryUrl === nextUrlRef.current) {
      lastWrittenHref.current = null
      return
    }
    // Initial MemoryRouter entry is POP. Only user navigations should write history.
    if (navigationType === 'POP') return

    const href = `${location.pathname}${location.search}${location.hash}`
    if (lastWrittenHref.current === href) return
    lastWrittenHref.current = href
    if (navigationType === 'REPLACE') {
      nextRouter.replace(href, { scroll: false })
      return
    }
    nextRouter.push(href, { scroll: location.hash ? false : undefined })
  }, [location.hash, location.pathname, location.search, memoryUrl, navigationType, nextRouter])

  useEffect(() => {
    if (EVENT_PATH.test(nextPathname)) return
    if (memoryUrlRef.current === nextUrl) return
    navigate(nextUrl, { replace: true })
  }, [navigate, nextPathname, nextUrl])

  return null
}

import {
  ANALYTICS_EVENTS,
  trackEvent,
  trackGuideSectionViewed,
} from './analytics'
import {
  attributionProps,
  beginGuideVisit,
  newGuideViewId,
  type GuideVersion,
} from './discoveryAttribution'

const IDLE_MS = 30_000
const IMPRESSION_THRESHOLD = 0.35
const SECTION_THRESHOLD = 0.35

type GuideVisitController = {
  guideSlug: string
  guideViewId: string
  guideVersion: GuideVersion
  dispose: () => void
  noteSection: (sectionId: string) => void
  getSummaryProps: () => Record<string, string | number>
}

const activeBySlug = new Map<string, GuideVisitController>()
const impressionKeys = new Set<string>()

function isVisibleDocument(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'visible'
}

export function getActiveGuideVisit(guideSlug: string): GuideVisitController | null {
  return activeBySlug.get(guideSlug) ?? null
}

export function startGuideVisitAnalytics(options: {
  guideSlug: string
  guideVersion?: GuideVersion
  root?: ParentNode | Document
}): GuideVisitController {
  const existing = activeBySlug.get(options.guideSlug)
  if (existing) {
    existing.dispose()
  }

  const guideVersion = options.guideVersion ?? 'v2'
  const guideViewId = newGuideViewId()
  beginGuideVisit({
    guideSlug: options.guideSlug,
    guideViewId,
    guideVersion,
  })

  const sectionsReached = new Set<string>()
  let activeMs = 0
  let activeStarted: number | null = isVisibleDocument() ? Date.now() : null
  let lastActivity = Date.now()
  let idle = false
  let maxScrollPercent = 0
  let summarySent = false

  const pauseActive = () => {
    if (activeStarted == null) return
    activeMs += Math.max(0, Date.now() - activeStarted)
    activeStarted = null
  }

  const resumeActive = () => {
    if (!isVisibleDocument() || idle) return
    if (activeStarted == null) activeStarted = Date.now()
  }

  const markActivity = () => {
    lastActivity = Date.now()
    if (idle) {
      idle = false
      resumeActive()
    }
  }

  const idleTimer = window.setInterval(() => {
    if (!isVisibleDocument()) return
    if (Date.now() - lastActivity >= IDLE_MS) {
      if (!idle) {
        idle = true
        pauseActive()
      }
    }
  }, 1000)

  const onVisibility = () => {
    if (isVisibleDocument()) {
      markActivity()
      resumeActive()
    } else {
      pauseActive()
    }
  }

  const onScroll = () => {
    markActivity()
    const doc = document.documentElement
    const scrollable = Math.max(1, doc.scrollHeight - window.innerHeight)
    const pct = Math.round((window.scrollY / scrollable) * 100)
    if (pct > maxScrollPercent) maxScrollPercent = Math.min(100, pct)
  }

  const activityEvents: Array<keyof WindowEventMap> = [
    'pointerdown',
    'keydown',
    'touchstart',
    'wheel',
  ]
  for (const name of activityEvents) {
    window.addEventListener(name, markActivity, { passive: true })
  }
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  const root = options.root ?? document
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < SECTION_THRESHOLD) continue
        const sectionId = entry.target.getAttribute('data-guide-section')
        if (!sectionId || !/^[a-z0-9-]{1,80}$/.test(sectionId)) continue
        if (sectionsReached.has(sectionId)) continue
        sectionsReached.add(sectionId)
        trackGuideSectionViewed(options.guideSlug, sectionId, {
          guide_view_id: guideViewId,
          guide_version: guideVersion,
        })
      }
    },
    { threshold: [SECTION_THRESHOLD] },
  )

  const observeSections = () => {
    root.querySelectorAll<HTMLElement>('[data-guide-section]').forEach((el) => {
      sectionObserver.observe(el)
    })
  }
  observeSections()
  const mo = typeof MutationObserver !== 'undefined' ? new MutationObserver(observeSections) : null
  mo?.observe(document.body, { childList: true, subtree: true })

  const impressionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < IMPRESSION_THRESHOLD) continue
        const el = entry.target as HTMLElement
        const eventId = el.getAttribute('data-guide-event-id')?.trim()
        const placement = el.getAttribute('data-guide-placement')?.trim() || 'article'
        const sectionId = el.getAttribute('data-guide-section-id')?.trim() || ''
        if (!eventId) continue
        const key = `${guideViewId}|${eventId}|${placement}`
        if (impressionKeys.has(key)) continue
        impressionKeys.add(key)
        trackEvent(ANALYTICS_EVENTS.GUIDE_EVENT_IMPRESSION, {
          guide_slug: options.guideSlug,
          guide_view_id: guideViewId,
          guide_version: guideVersion,
          event_id: eventId,
          placement,
          ...(sectionId ? { section_id: sectionId } : {}),
        })
        impressionObserver.unobserve(el)
      }
    },
    { threshold: [IMPRESSION_THRESHOLD] },
  )

  const observeImpressions = () => {
    root.querySelectorAll<HTMLElement>('[data-guide-event-id]').forEach((el) => {
      impressionObserver.observe(el)
    })
  }
  observeImpressions()
  const moImp =
    typeof MutationObserver !== 'undefined' ? new MutationObserver(observeImpressions) : null
  moImp?.observe(document.body, { childList: true, subtree: true })

  const getSummaryProps = () => {
    pauseActive()
    resumeActive()
    return {
      guide_slug: options.guideSlug,
      guide_view_id: guideViewId,
      guide_version: guideVersion,
      active_reading_seconds: Math.round(activeMs / 1000),
      max_scroll_percent: maxScrollPercent,
      sections_reached_count: sectionsReached.size,
    }
  }

  const flushSummary = () => {
    if (summarySent) return
    summarySent = true
    trackEvent(ANALYTICS_EVENTS.GUIDE_ENGAGEMENT_SUMMARY, getSummaryProps())
  }

  const onPageHide = () => flushSummary()

  window.addEventListener('pagehide', onPageHide)

  const controller: GuideVisitController = {
    guideSlug: options.guideSlug,
    guideViewId,
    guideVersion,
    noteSection: (sectionId: string) => {
      if (sectionsReached.has(sectionId)) return
      sectionsReached.add(sectionId)
      trackGuideSectionViewed(options.guideSlug, sectionId, {
        guide_view_id: guideViewId,
        guide_version: guideVersion,
      })
    },
    getSummaryProps,
    dispose: () => {
      flushSummary()
      window.clearInterval(idleTimer)
      for (const name of activityEvents) {
        window.removeEventListener(name, markActivity)
      }
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', onPageHide)
      sectionObserver.disconnect()
      impressionObserver.disconnect()
      mo?.disconnect()
      moImp?.disconnect()
      activeBySlug.delete(options.guideSlug)
    },
  }

  activeBySlug.set(options.guideSlug, controller)
  return controller
}

export function guideCommonProps(guideSlug: string): Record<string, string> {
  const visit = getActiveGuideVisit(guideSlug)
  return {
    guide_slug: guideSlug,
    guide_version: visit?.guideVersion ?? 'v2',
    ...(visit ? { guide_view_id: visit.guideViewId } : {}),
    ...attributionProps(),
  }
}

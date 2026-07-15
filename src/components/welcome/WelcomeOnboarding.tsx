import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { BringPuddlesNearbyCta } from './BringPuddlesNearbyCta'
import { NearbyRequestSurface } from './NearbyRequestSurface'
import { WelcomePopup } from './WelcomePopup'
import { useApp } from '../../context/AppContext'
import {
  trackNearbyRequestError,
  trackNearbyRequestOpened,
  trackNearbyRequestSubmitted,
  trackWelcomeDismissed,
  trackWelcomeExploreClicked,
  trackWelcomeShown,
} from '../../utils/analytics'
import { getEventDetailBackground } from '../../utils/eventDetailNavigation'
import { readEventDetailOverlayState } from '../../utils/nextEventDetailState'
import {
  WELCOME_EXPERIMENT_STORAGE_KEYS,
  WELCOME_FAB_MIN_DELAY_MS,
  WELCOME_STORAGE_KEYS,
  OPEN_NEARBY_REQUEST_EVENT,
  clearWelcomeStorage,
  dismissCtaForDays,
  isCtaDismissed,
  isMobileViewport,
  isNeighborhoodSubmitted,
  isStandaloneEventPath,
  isWelcomeSeen,
  markNeighborhoodSubmitted,
  markWelcomeSeen,
  shouldAutoShowWelcome,
  shouldShowFloatingCta,
  welcomeAnalyticsPage,
  type OpenNearbyRequestDetail,
  type WelcomeNearbySource,
  type WelcomeOnboardingPhase,
  type WelcomeStorageKeys,
} from '../../utils/welcomeOnboarding'

type RequestSurfaceSource = Extract<WelcomeNearbySource, 'floating_cta' | 'about'>

interface WelcomeOnboardingProps {
  /** Use experiment storage + tester bar. */
  experiment?: boolean
  showTesterControls?: boolean
}

function hasBlockingDomUi(): boolean {
  if (typeof document === 'undefined') return false
  return Boolean(
    document.querySelector('.filter-sheet-overlay, .event-detail-overlay'),
  )
}

function sourceContextFor(source: RequestSurfaceSource) {
  return source === 'about' ? 'welcome_about' : 'welcome_floating_cta'
}

export function WelcomeOnboarding({
  experiment = false,
  showTesterControls = false,
}: WelcomeOnboardingProps) {
  const location = useLocation()
  const { showLocationBridge } = useApp()
  const keys: WelcomeStorageKeys = experiment
    ? WELCOME_EXPERIMENT_STORAGE_KEYS
    : WELCOME_STORAGE_KEYS

  const hasOverlayBackground = Boolean(
    getEventDetailBackground(location.state) ||
      readEventDetailOverlayState()?.backgroundPath,
  )
  const isStandaloneEvent = isStandaloneEventPath(
    location.pathname,
    hasOverlayBackground,
  )
  const analyticsPage = welcomeAnalyticsPage(location.pathname)

  const [ready, setReady] = useState(false)
  const [welcomeSeen, setWelcomeSeen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [ctaDismissed, setCtaDismissed] = useState(false)
  const [phase, setPhase] = useState<WelcomeOnboardingPhase>('intro')
  const [forceWelcomeOpen, setForceWelcomeOpen] = useState(false)
  const [requestOpen, setRequestOpen] = useState(false)
  const [requestSource, setRequestSource] = useState<RequestSurfaceSource>('floating_cta')
  const [requestMode, setRequestMode] = useState<'modal' | 'sheet'>('modal')
  const [engagementReady, setEngagementReady] = useState(false)
  const [blockingDom, setBlockingDom] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [successHold, setSuccessHold] = useState(false)

  const welcomeCloseAtRef = useRef<number | null>(null)
  const welcomeShownTracked = useRef(false)
  const pathOnMount = useRef(location.pathname)
  const navigatedAway = useRef(false)

  const refreshPersisted = useCallback(() => {
    setWelcomeSeen(isWelcomeSeen(keys))
    setSubmitted(isNeighborhoodSubmitted(keys))
    setCtaDismissed(isCtaDismissed(keys))
  }, [keys])

  useEffect(() => {
    refreshPersisted()
    setMobile(isMobileViewport())
    setReady(true)

    function onResize() {
      setMobile(isMobileViewport())
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [refreshPersisted])

  useEffect(() => {
    if (location.pathname !== pathOnMount.current) {
      navigatedAway.current = true
    }
  }, [location.pathname])

  useEffect(() => {
    function sync() {
      setBlockingDom(hasBlockingDomUi())
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true })
    return () => observer.disconnect()
  }, [])

  const persistWelcomeSeen = useCallback(() => {
    markWelcomeSeen(keys)
    setWelcomeSeen(true)
    welcomeCloseAtRef.current = Date.now()
  }, [keys])

  const openRequestSurface = useCallback(
    (source: RequestSurfaceSource) => {
      if (isNeighborhoodSubmitted(keys)) return
      persistWelcomeSeen()
      setForceWelcomeOpen(false)
      setRequestSource(source)
      setRequestMode(isMobileViewport() ? 'sheet' : 'modal')
      setRequestOpen(true)
      trackNearbyRequestOpened({
        source,
        page: welcomeAnalyticsPage(location.pathname),
      })
    },
    [keys, persistWelcomeSeen, location.pathname],
  )

  useEffect(() => {
    function onOpenNearby(event: Event) {
      const detail = (event as CustomEvent<OpenNearbyRequestDetail>).detail
      const source = detail?.source === 'about' ? 'about' : 'floating_cta'
      openRequestSurface(source)
    }
    window.addEventListener(OPEN_NEARBY_REQUEST_EVENT, onOpenNearby)
    return () => window.removeEventListener(OPEN_NEARBY_REQUEST_EVENT, onOpenNearby)
  }, [openRequestSurface])

  const showWelcome = useMemo(() => {
    if (!ready) return false
    if (forceWelcomeOpen || successHold) return true
    if (submitted || requestOpen) return false
    return shouldAutoShowWelcome({
      welcomeSeen,
      submitted,
      pathname: location.pathname,
      isStandaloneEvent,
      blockingUiOpen: showLocationBridge || blockingDom || hasOverlayBackground,
    })
  }, [
    ready,
    submitted,
    forceWelcomeOpen,
    successHold,
    requestOpen,
    welcomeSeen,
    location.pathname,
    isStandaloneEvent,
    showLocationBridge,
    blockingDom,
    hasOverlayBackground,
  ])

  useEffect(() => {
    if (!showWelcome || welcomeShownTracked.current) return
    welcomeShownTracked.current = true
    trackWelcomeShown(analyticsPage)
  }, [showWelcome, analyticsPage])

  useEffect(() => {
    if (!ready || submitted || ctaDismissed) return
    if (!welcomeSeen) return

    let scrolledEnough = false

    function maybeReady() {
      const closedAt = welcomeCloseAtRef.current
      const minDelayOk =
        closedAt == null || Date.now() - closedAt >= WELCOME_FAB_MIN_DELAY_MS
      if ((scrolledEnough || navigatedAway.current) && minDelayOk) {
        setEngagementReady(true)
      }
    }

    function onScroll() {
      if (window.scrollY >= window.innerHeight) {
        scrolledEnough = true
        maybeReady()
      }
    }

    if (welcomeCloseAtRef.current == null) {
      welcomeCloseAtRef.current = Date.now()
    }

    const delayTimer = window.setTimeout(maybeReady, WELCOME_FAB_MIN_DELAY_MS)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    maybeReady()

    return () => {
      window.clearTimeout(delayTimer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [ready, submitted, ctaDismissed, welcomeSeen, location.pathname])

  const showFab = useMemo(() => {
    if (!ready || showWelcome || requestOpen || forceWelcomeOpen) return false
    return shouldShowFloatingCta({
      welcomeSeen,
      submitted,
      ctaDismissed,
      pathname: location.pathname,
      search: location.search,
      isStandaloneEvent,
      blockingUiOpen:
        showLocationBridge || hasOverlayBackground || blockingDom,
      engagementReady,
    })
  }, [
    ready,
    showWelcome,
    requestOpen,
    forceWelcomeOpen,
    welcomeSeen,
    submitted,
    ctaDismissed,
    location.pathname,
    location.search,
    isStandaloneEvent,
    showLocationBridge,
    hasOverlayBackground,
    blockingDom,
    engagementReady,
  ])

  function handleWelcomeDismiss(reason: 'close' | 'explore') {
    persistWelcomeSeen()
    setForceWelcomeOpen(false)
    setSuccessHold(false)
    setPhase('intro')
    if (reason === 'explore') trackWelcomeExploreClicked(analyticsPage)
    else trackWelcomeDismissed(analyticsPage)
  }

  function handleWelcomeRequestOpen() {
    persistWelcomeSeen()
    trackNearbyRequestOpened({ source: 'welcome', page: analyticsPage })
  }

  function handleSubmitted(
    source: WelcomeNearbySource,
    details: { requestedLocation: string },
  ) {
    markNeighborhoodSubmitted(keys)
    setSubmitted(true)
    setEngagementReady(false)
    if (source === 'welcome') setSuccessHold(true)
    trackNearbyRequestSubmitted({
      source,
      page: analyticsPage,
      requestedLocation: details.requestedLocation,
    })
  }

  function handleSubmitError(source: WelcomeNearbySource) {
    trackNearbyRequestError({ source, page: analyticsPage })
  }

  function handleFabDismiss() {
    dismissCtaForDays(undefined, keys)
    setCtaDismissed(true)
  }

  function resetAll() {
    clearWelcomeStorage(keys)
    welcomeShownTracked.current = false
    welcomeCloseAtRef.current = null
    navigatedAway.current = false
    pathOnMount.current = location.pathname
    setPhase('intro')
    setForceWelcomeOpen(false)
    setSuccessHold(false)
    setRequestOpen(false)
    setEngagementReady(false)
    refreshPersisted()
  }

  if (!ready) return null
  if (!experiment && location.pathname === '/experiment-welcome') return null

  return (
    <>
      {showTesterControls ? (
        <div className="welcome-tester" aria-label="Welcome experiment controls">
          <p className="welcome-tester-label">Welcome experiment</p>
          <div className="welcome-tester-actions">
            <button type="button" className="welcome-tester-btn" onClick={resetAll}>
              Reset / first visit
            </button>
            <button
              type="button"
              className="welcome-tester-btn"
              onClick={() => {
                setForceWelcomeOpen(true)
                setPhase('intro')
                setRequestOpen(false)
              }}
            >
              Open welcome
            </button>
            <button
              type="button"
              className="welcome-tester-btn"
              onClick={() => {
                setForceWelcomeOpen(true)
                setPhase('request')
                setRequestOpen(false)
              }}
            >
              Open request
            </button>
            <button
              type="button"
              className="welcome-tester-btn"
              onClick={() => {
                handleWelcomeDismiss('close')
                setEngagementReady(true)
              }}
            >
              Dismiss → floating CTA
            </button>
            <button
              type="button"
              className="welcome-tester-btn"
              onClick={() => openRequestSurface('floating_cta')}
            >
              Open FAB request
            </button>
          </div>
          <p className="welcome-tester-status">
            seen: {welcomeSeen ? 'yes' : 'no'}
            {submitted ? ' · submitted' : ''}
            {ctaDismissed ? ' · cta dismissed' : ''}
            {showWelcome ? ' · popup' : ''}
            {showFab ? ' · fab' : ''}
            {engagementReady ? ' · engaged' : ''}
            {mobile ? ' · mobile' : ' · desktop'}
          </p>
        </div>
      ) : null}

      {showWelcome ? (
        <WelcomePopup
          phase={phase}
          onPhaseChange={setPhase}
          onDismiss={handleWelcomeDismiss}
          onRequestOpen={handleWelcomeRequestOpen}
          onSubmitted={(details) => handleSubmitted('welcome', details)}
          onSubmitError={() => handleSubmitError('welcome')}
        />
      ) : null}

      {showFab ? (
        <BringPuddlesNearbyCta
          onOpen={() => openRequestSurface('floating_cta')}
          onDismiss={handleFabDismiss}
        />
      ) : null}

      {requestOpen ? (
        <NearbyRequestSurface
          mode={requestMode}
          sourceContext={sourceContextFor(requestSource)}
          onClose={() => setRequestOpen(false)}
          onSubmitted={(details) => {
            handleSubmitted(requestSource, details)
          }}
          onSubmitError={() => handleSubmitError(requestSource)}
        />
      ) : null}
    </>
  )
}

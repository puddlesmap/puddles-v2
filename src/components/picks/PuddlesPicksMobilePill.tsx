'use client'

import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  hasJoinedPuddlesPicks,
  openPuddlesPicksSignup,
  PUDDLES_PICKS_JOINED_EVENT,
} from './PuddlesPicksHome'

const SESSION_KEY = 'puddles_picks_pill_session'
const INTRO_SELECTOR = '[data-picks-intro-end]'
const CARD_SELECTOR = '.picks-home-share'

function readSessionDismissed() {
  if (typeof window === 'undefined') return false
  return window.sessionStorage.getItem(SESSION_KEY) === '1'
}

export function PuddlesPicksMobilePill() {
  const location = useLocation()
  const [mobile, setMobile] = useState(false)
  const [joined, setJoined] = useState(false)
  const [sessionDismissed, setSessionDismissed] = useState(false)
  const [pastIntro, setPastIntro] = useState(false)
  const [cardVisible, setCardVisible] = useState(false)

  useEffect(() => {
    setJoined(hasJoinedPuddlesPicks())
    setSessionDismissed(readSessionDismissed())
    const query = window.matchMedia('(max-width: 767px)')
    function onChange() {
      setMobile(query.matches)
    }
    onChange()
    query.addEventListener('change', onChange)
    function onJoined() {
      setJoined(true)
    }
    window.addEventListener(PUDDLES_PICKS_JOINED_EVENT, onJoined)
    return () => {
      query.removeEventListener('change', onChange)
      window.removeEventListener(PUDDLES_PICKS_JOINED_EVENT, onJoined)
    }
  }, [])

  useEffect(() => {
    function check() {
      const marker = document.querySelector(INTRO_SELECTOR)
      setPastIntro(Boolean(marker && marker.getBoundingClientRect().top < 0))
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [location.pathname])

  useEffect(() => {
    const cards = [...document.querySelectorAll(CARD_SELECTOR)].filter(
      (card) => card.getClientRects().length > 0,
    )
    if (cards.length === 0) {
      setCardVisible(false)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        setCardVisible(entries.some((entry) => entry.isIntersecting))
      },
      { rootMargin: '0px 0px -88px 0px', threshold: 0.2 },
    )
    cards.forEach((card) => observer.observe(card))
    return () => observer.disconnect()
  }, [location.pathname, pastIntro])

  if (!mobile || joined || sessionDismissed || !pastIntro || cardVisible) return null

  function dismiss() {
    window.sessionStorage.setItem(SESSION_KEY, '1')
    setSessionDismissed(true)
  }

  return (
    <div className="bring-nearby-anchor bring-nearby-anchor--picks">
      <div className="bring-nearby-pill">
        <button type="button" className="bring-nearby-fab" onClick={() => openPuddlesPicksSignup('puddles_picks_pill')}>
          Get Puddles Picks
        </button>
        <button type="button" className="bring-nearby-dismiss" aria-label="Dismiss" onClick={dismiss}>
          <span aria-hidden>×</span>
        </button>
      </div>
    </div>
  )
}

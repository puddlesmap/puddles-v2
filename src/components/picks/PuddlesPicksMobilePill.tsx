'use client'

import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  isPicksPillDismissed,
  picksPillDismissUntil,
  picksPillPage,
  picksPillSignupSource,
} from '../../utils/picksPill.mjs'
import {
  hasJoinedPuddlesPicks,
  openPuddlesPicksSignup,
  PUDDLES_PICKS_JOINED_EVENT,
} from './PuddlesPicksHome'

const DISMISS_KEY = 'puddles_picks_pill_dismissed_until'
const CARD_SELECTOR = '.picks-home-share'

function readDismissed() {
  if (typeof window === 'undefined') return false
  try {
    return isPicksPillDismissed(window.localStorage.getItem(DISMISS_KEY))
  } catch {
    return false
  }
}

export function PuddlesPicksMobilePill() {
  const location = useLocation()
  const page = picksPillPage(location.pathname)
  const [mobile, setMobile] = useState(false)
  const [joined, setJoined] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [cardVisible, setCardVisible] = useState(false)

  useEffect(() => {
    setJoined(hasJoinedPuddlesPicks())
    setDismissed(readDismissed())
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
  }, [location.pathname])

  const show = Boolean(page) && mobile && !joined && !dismissed && !cardVisible

  useEffect(() => {
    if (!show) {
      delete document.documentElement.dataset.picksPill
      return
    }
    document.documentElement.dataset.picksPill = '1'
    return () => {
      delete document.documentElement.dataset.picksPill
    }
  }, [show])

  if (!show || !page) return null

  function dismiss() {
    const until = picksPillDismissUntil()
    try {
      window.localStorage.setItem(DISMISS_KEY, until)
    } catch {
      // The pill still hides for this visit if storage is blocked.
    }
    setDismissed(true)
  }

  return (
    <div className="bring-nearby-anchor bring-nearby-anchor--picks">
      <div className="bring-nearby-pill">
        <button
          type="button"
          className="bring-nearby-fab"
          onClick={() => openPuddlesPicksSignup(picksPillSignupSource(page))}
        >
          Get Puddles Picks
        </button>
        <button type="button" className="bring-nearby-dismiss" aria-label="Dismiss for 30 days" onClick={dismiss}>
          <span aria-hidden>×</span>
        </button>
      </div>
    </div>
  )
}

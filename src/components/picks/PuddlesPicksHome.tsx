'use client'

import { useEffect, useId, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { subscribeNewsletter } from '../../utils/audienceApi'
import { trackNewsletterSubscribed } from '../../utils/analytics'
import type { NewsletterSignupSource } from '../../types/audience'
import './puddles-picks-home.css'

const JOINED_KEY = 'puddles_picks_joined'
const DISMISSED_KEY = 'puddles_picks_popup_dismissed'
const OPEN_EVENT = 'puddles-picks-open'
export const PUDDLES_PICKS_JOINED_EVENT = 'puddles-picks-joined'

export function openPuddlesPicksSignup(
  source: 'puddles_picks_pill' | 'puddles_picks_popup' = 'puddles_picks_popup',
) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: source }))
}

export function hasJoinedPuddlesPicks() {
  return readFlag(JOINED_KEY)
}

type Status = 'idle' | 'invalid' | 'error' | 'duplicate' | 'done'

function readFlag(key: string) {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(key) === '1'
}

function writeFlag(key: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, '1')
}

function PlaceLine() {
  return (
    <p className="picks-home-place">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" strokeLinejoin="round" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
      South Peninsula & beyond
    </p>
  )
}

function usePicksSignup(signupSource: NewsletterSignupSource) {
  const [email, setEmail] = useState('')
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const value = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setStatus('invalid')
      return
    }
    setBusy(true)
    setStatus('idle')
    try {
      const result = await subscribeNewsletter({ email: value, signupSource })
      if (result.alreadySubscribed) {
        setStatus('duplicate')
        return
      }
      if (!result.ok) {
        setStatus('error')
        return
      }
      writeFlag(JOINED_KEY)
      writeFlag(DISMISSED_KEY)
      if (typeof window !== 'undefined') window.dispatchEvent(new Event(PUDDLES_PICKS_JOINED_EVENT))
      trackNewsletterSubscribed(signupSource)
      setStatus('done')
    } catch {
      setStatus('error')
    } finally {
      setBusy(false)
    }
  }

  return { email, setEmail, open, setOpen, status, setStatus, busy, onSubmit }
}

function SignupFields({
  id,
  signup,
  layout,
  buttonLabel,
}: {
  id: string
  signup: ReturnType<typeof usePicksSignup>
  layout: 'stack' | 'row' | 'cta'
  buttonLabel: string
}) {
  const fields = (
    <>
      <label className="sr-only" htmlFor={id}>
        Email address
      </label>
      <input
        id={id}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="Your email address"
        value={signup.email}
        disabled={signup.busy}
        onChange={(event) => {
          signup.setEmail(event.target.value)
          if (signup.status !== 'idle' && signup.status !== 'done') signup.setStatus('idle')
        }}
      />
      {signup.status === 'invalid' ? <p className="picks-home-error">Add an email address.</p> : null}
      {signup.status === 'duplicate' ? (
        <p className="picks-home-error">This email is already on the list.</p>
      ) : null}
      {signup.status === 'error' ? (
        <p className="picks-home-error">Something went wrong. Try again.</p>
      ) : null}
    </>
  )
  const button = (
    <button type="submit" className="btn-primary" disabled={signup.busy}>
      {signup.busy ? 'Joining…' : buttonLabel}
    </button>
  )

  if (layout === 'cta') {
    return (
      <form className="picks-home-form picks-home-form--cta ph-mask" onSubmit={(event) => void signup.onSubmit(event)}>
        {fields}
        <div className="community-cta-card-actions">{button}</div>
        <p className="picks-home-consent">Get launch updates and future Puddles Picks emails. Unsubscribe anytime.</p>
      </form>
    )
  }

  return (
    <form className={`picks-home-form picks-home-form--${layout} ph-mask`} onSubmit={(event) => void signup.onSubmit(event)}>
      {fields}
      {button}
      <p className="picks-home-consent">Get launch updates and future Puddles Picks emails. Unsubscribe anytime.</p>
    </form>
  )
}

function Success() {
  return (
    <div className="picks-home-success">
      <h3>You&apos;re on the list!</h3>
      <p>We&apos;ll let you know when Puddles Picks is ready.</p>
    </div>
  )
}

export function PuddlesPicksCard() {
  const signup = usePicksSignup('puddles_picks_card')
  const id = useId()

  return (
    <section
      className="community-cta-card community-cta-card--neutral about-cta-section picks-home-share"
      aria-label="Puddles Picks"
    >
      {signup.status === 'done' ? (
        <>
          <h2 className="cta-title">You&apos;re on the list!</h2>
          <p className="cta-body">We&apos;ll let you know when Puddles Picks is ready.</p>
        </>
      ) : (
        <>
          <p className="picks-home-kicker">Puddles Picks · Coming soon</p>
          <h2 className="cta-title">Good plans, delivered.</h2>
          <p className="cta-body">Local family outings and monthly parent guides.</p>
          {signup.open ? (
            <SignupFields id={id} signup={signup} layout="cta" buttonLabel="Join the list" />
          ) : (
            <div className="community-cta-card-actions">
              <button type="button" className="btn-primary" onClick={() => signup.setOpen(true)}>
                Join the list
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export function PuddlesPicksBanner() {
  const signup = usePicksSignup('puddles_picks_card')
  const id = useId()

  return (
    <section className="picks-home-banner" aria-label="Puddles Picks">
      {signup.status === 'done' ? (
        <Success />
      ) : (
        <>
          <div className="picks-home-copy">
            <p className="picks-home-kicker">
              Puddles Picks · <span>Coming Soon</span>
            </p>
            <h3>Good plans, delivered.</h3>
            <p className="picks-home-desc">Curated family outings & monthly parent guides</p>
            <PlaceLine />
          </div>
          <SignupFields id={id} signup={signup} layout="row" buttonLabel="Join" />
        </>
      )}
    </section>
  )
}

export function PuddlesPicksPopup() {
  const [source, setSource] = useState<'puddles_picks_pill' | 'puddles_picks_popup'>('puddles_picks_popup')
  const signup = usePicksSignup(source)
  const id = useId()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (readFlag(JOINED_KEY) || readFlag(DISMISSED_KEY)) return
    const timer = window.setTimeout(() => {
      setSource('puddles_picks_popup')
      setVisible(true)
    }, 8000)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    function onOpen(event: Event) {
      if (readFlag(JOINED_KEY)) return
      const detail = event instanceof CustomEvent ? event.detail : null
      setSource(detail === 'puddles_picks_pill' ? 'puddles_picks_pill' : 'puddles_picks_popup')
      setVisible(true)
    }
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_EVENT, onOpen)
  }, [])

  if (!visible || typeof document === 'undefined') return null

  function dismiss() {
    writeFlag(DISMISSED_KEY)
    setVisible(false)
  }

  return createPortal(
    <div className="picks-home-overlay" role="presentation">
      <button type="button" className="picks-home-backdrop" aria-label="Close" onClick={dismiss} />
      <div className="picks-home-dialog" role="dialog" aria-modal="true" aria-label="Puddles Picks">
        <button type="button" className="picks-home-close" aria-label="Close" onClick={dismiss}>
          ×
        </button>
        {signup.status === 'done' ? (
          <Success />
        ) : (
          <>
            <p className="picks-home-kicker">Puddles Picks · Coming Soon</p>
            <div className="picks-home-copy">
              <h3>Good plans, delivered.</h3>
            </div>
            <p className="picks-home-desc">
              Curated family outings, seasonal picks & monthly parent guides for ages 0–5.
            </p>
            <PlaceLine />
            <SignupFields id={id} signup={signup} layout="stack" buttonLabel="Join the list →" />
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

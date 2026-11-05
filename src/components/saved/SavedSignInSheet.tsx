'use client'

import { useSignIn, useSignUp } from '@clerk/nextjs/legacy'
import { useEffect, useState, type FormEvent } from 'react'
import { Logo } from '../layout/Logo'
import { useSavedOptional, type SavedAuthMode } from '../../context/SavedContext'
import { ANALYTICS_EVENTS, trackEvent } from '../../utils/analytics'

function GoogleGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.7-2.4 3.5v2.9h3.8c2.3-2.1 3.6-5.2 3.6-8.5z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1.1.7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.4v3c2 4 6.1 6.6 10.6 6.6z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.4c-.2-.7-.4-1.4-.4-2.4s.1-1.7.4-2.4V6.6H1.4C.5 8.4 0 10.2 0 12s.5 3.6 1.4 5.4l3.9-3z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.5 0 3.4 2.6 1.4 6.6l3.9 3c.9-2.9 3.6-4.8 6.7-4.8z"
      />
    </svg>
  )
}

function AppleGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#111"
        d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.3c1-.1 2-1.1 2.5-2.2-2.1-1-2.8-3.1-2.8-3.2zM14.3 5.8c.6-.8 1.1-1.9.9-3-1 .1-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.5 2.9-1.4z"
      />
    </svg>
  )
}

function clerkErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === 'object' &&
    'errors' in error &&
    Array.isArray((error as { errors: Array<{ longMessage?: string; message?: string }> }).errors)
  ) {
    const first = (error as { errors: Array<{ longMessage?: string; message?: string }> }).errors[0]
    return first?.longMessage || first?.message || fallback
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function SavedSignInSheet() {
  const saved = useSavedOptional()
  const { isLoaded: signInLoaded, signIn, setActive: setSignInActive } = useSignIn()
  const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp()
  const [mode, setMode] = useState<SavedAuthMode>('create')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [awaitingVerification, setAwaitingVerification] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!saved?.signInOpen) return
    setMode(saved.authMode)
    setError(null)
    setAwaitingVerification(false)
    setVerificationCode('')
    setBusy(false)
  }, [saved?.signInOpen, saved?.authMode])

  if (!saved?.signInOpen) return null

  const isCreate = mode === 'create'
  const clerkReady = isCreate ? signUpLoaded && Boolean(signUp) : signInLoaded && Boolean(signIn)

  async function finishSession(
    sessionId: string,
    setActive: ((args: { session: string }) => Promise<void>) | undefined,
  ) {
    if (!setActive) {
      setError('Could not start your session. Try again.')
      return
    }
    await setActive({ session: sessionId })
    saved!.closeSignIn()
    await saved!.syncNow()
  }

  async function oauth(strategy: 'oauth_google' | 'oauth_apple') {
    setError(null)
    if (!clerkReady) {
      setError('Sign-in is still loading. Try again in a moment.')
      return
    }
    setBusy(true)
    trackEvent(ANALYTICS_EVENTS.SAVED_SIGN_IN, { method: strategy, mode })
    try {
      const redirect = {
        strategy,
        redirectUrl: '/saved/sso-callback',
        redirectUrlComplete: '/saved',
      } as const
      if (isCreate) {
        await signUp!.authenticateWithRedirect(redirect)
      } else {
        await signIn!.authenticateWithRedirect(redirect)
      }
    } catch (err) {
      setBusy(false)
      setError(clerkErrorMessage(err, 'Could not continue. Try again.'))
    }
  }

  async function onVerify(event: FormEvent) {
    event.preventDefault()
    if (!signUpLoaded || !signUp) return
    setError(null)
    setBusy(true)
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: verificationCode.trim() })
      if (result.status === 'complete' && result.createdSessionId) {
        await finishSession(result.createdSessionId, setSignUpActive)
        setBusy(false)
        return
      }
      setError('Enter the verification code from your email.')
      setBusy(false)
    } catch (err) {
      setBusy(false)
      setError(clerkErrorMessage(err, 'Could not verify that code. Try again.'))
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!clerkReady) {
      setError('Sign-in is still loading. Try again in a moment.')
      return
    }
    setError(null)
    setBusy(true)
    trackEvent(ANALYTICS_EVENTS.SAVED_SIGN_IN, {
      method: 'email_password',
      mode,
    })
    const trimmed = email.trim().toLowerCase()

    if (isCreate) {
      try {
        const created = await signUp!.create({ emailAddress: trimmed, password })
        if (created.status === 'complete' && created.createdSessionId) {
          await finishSession(created.createdSessionId, setSignUpActive)
          setBusy(false)
          return
        }
        await signUp!.prepareEmailAddressVerification({ strategy: 'email_code' })
        setAwaitingVerification(true)
        setBusy(false)
      } catch (err) {
        setBusy(false)
        setError(clerkErrorMessage(err, 'Could not create an account. Try Google or Apple.'))
      }
      return
    }

    try {
      const attempt = await signIn!.create({ identifier: trimmed, password })
      if (attempt.status === 'complete' && attempt.createdSessionId) {
        await finishSession(attempt.createdSessionId, setSignInActive)
        setBusy(false)
        return
      }
      setError('Check your email and password, or use Google / Apple.')
      setBusy(false)
    } catch (err) {
      setBusy(false)
      setError(clerkErrorMessage(err, 'Could not log in. Check your email and password.'))
    }
  }

  return (
    <div className="saved-signin-overlay" role="presentation">
      <button
        type="button"
        className="saved-signin-backdrop"
        aria-label="Close"
        onClick={() => saved.closeSignIn()}
      />
      <div
        className="saved-signin-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="saved-signin-title"
        data-sign-in-reason="persist"
      >
        <button
          type="button"
          className="saved-signin-close"
          aria-label="Close"
          onClick={() => saved.closeSignIn()}
        >
          ×
        </button>
        <Logo className="saved-signin-logo" />
        <h2 id="saved-signin-title" className="saved-signin-title">
          Keep your saved events
        </h2>
        <p className="saved-signin-lede">
          {awaitingVerification
            ? 'Enter the verification code we emailed you.'
            : 'Create an account to access your saved activities on any device.'}
        </p>

        {awaitingVerification ? (
          <form className="saved-signin-form" onSubmit={onVerify}>
            <input
              className="saved-signin-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Verification code"
              value={verificationCode}
              onChange={(eventChange) => setVerificationCode(eventChange.target.value)}
              required
            />
            <button type="submit" className="btn-primary saved-signin-submit" disabled={busy}>
              Verify email
            </button>
          </form>
        ) : (
          <>
            <form className="saved-signin-form" onSubmit={onSubmit}>
              <input
                className="saved-signin-input"
                type="email"
                autoComplete="email"
                placeholder="Email address"
                value={email}
                onChange={(eventChange) => setEmail(eventChange.target.value)}
                required
              />
              <input
                className="saved-signin-input"
                type="password"
                autoComplete={isCreate ? 'new-password' : 'current-password'}
                placeholder="Password"
                value={password}
                onChange={(eventChange) => setPassword(eventChange.target.value)}
                required
                minLength={8}
              />
              <button
                type="submit"
                className="btn-primary saved-signin-submit"
                disabled={busy || !clerkReady}
              >
                {isCreate ? 'Create account' : 'Log in'}
              </button>
            </form>

            <p className="saved-signin-switch">
              {isCreate ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="saved-signin-switch-link"
                    onClick={() => {
                      setMode('login')
                      setError(null)
                    }}
                  >
                    Log in
                  </button>
                </>
              ) : (
                <>
                  Need an account?{' '}
                  <button
                    type="button"
                    className="saved-signin-switch-link"
                    onClick={() => {
                      setMode('create')
                      setError(null)
                    }}
                  >
                    Create account
                  </button>
                </>
              )}
            </p>

            <div className="saved-signin-or" role="separator">
              <span>or</span>
            </div>
            <div className="saved-signin-social">
              <button
                type="button"
                className="saved-signin-social-btn"
                aria-label="Continue with Apple"
                disabled={busy || !clerkReady}
                onClick={() => void oauth('oauth_apple')}
              >
                <AppleGlyph />
              </button>
              <button
                type="button"
                className="saved-signin-social-btn"
                aria-label="Continue with Google"
                disabled={busy || !clerkReady}
                onClick={() => void oauth('oauth_google')}
              >
                <GoogleGlyph />
              </button>
            </div>
          </>
        )}

        {error ? <p className="saved-signin-error">{error}</p> : null}
      </div>
    </div>
  )
}

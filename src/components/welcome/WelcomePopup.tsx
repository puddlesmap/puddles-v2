import { useEffect, useId, useRef } from 'react'
import { ExpansionWatch } from '../expansion-watch/ExpansionWatch'
import { WELCOME_LAUNCH_CITIES, type WelcomeOnboardingPhase } from '../../utils/welcomeOnboarding'

interface WelcomePopupProps {
  phase: WelcomeOnboardingPhase
  onPhaseChange: (phase: WelcomeOnboardingPhase) => void
  onDismiss: (reason: 'close' | 'explore') => void
  onRequestOpen: () => void
  onSubmitted: (details: { requestedLocation: string }) => void
  onSubmitError: () => void
}

export function WelcomePopup({
  phase,
  onPhaseChange,
  onDismiss,
  onRequestOpen,
  onSubmitted,
  onSubmitError,
}: WelcomePopupProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const dialog = dialogRef.current
    const focusTarget =
      dialog?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ??
      dialog
    focusTarget?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onDismiss('close')
        return
      }
      if (event.key !== 'Tab' || !dialog) return

      const focusable = [
        ...dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true')

      if (focusable.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused.current?.focus?.()
    }
  }, [onDismiss])

  return (
    <div className="welcome-popup-overlay" role="presentation">
      <button
        type="button"
        className="welcome-popup-backdrop"
        aria-label="Dismiss welcome"
        onClick={() => onDismiss('close')}
      />

      <div
        ref={dialogRef}
        className="welcome-popup-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <button
          type="button"
          className="welcome-popup-close"
          aria-label="Close"
          onClick={() => onDismiss('close')}
        >
          <span aria-hidden>×</span>
        </button>

        {phase === 'intro' ? (
          <div className="welcome-popup-body welcome-popup-body--intro">
            <header className="welcome-popup-hero">
              <p className="welcome-popup-eyebrow">Welcome to Puddles</p>
              <h2 id={titleId} className="welcome-popup-title">
                A local activity map for ages 0–5
              </h2>
              <p className="welcome-popup-lede">
                Find storytimes, drop-ins, community programs, and local moments.
              </p>
            </header>

            <div className="welcome-popup-cities">
              <p className="welcome-popup-cities-label">Starting in</p>
              <p className="welcome-popup-cities-list">{WELCOME_LAUNCH_CITIES.join(' · ')}</p>
            </div>

            <div className="welcome-popup-actions">
              <button
                type="button"
                className="btn-primary welcome-popup-primary"
                onClick={() => onDismiss('explore')}
              >
                Explore Puddles
              </button>
              <button
                type="button"
                className="welcome-popup-secondary"
                onClick={() => {
                  onRequestOpen()
                  onPhaseChange('request')
                }}
              >
                Not nearby? Bring Puddles to your area →
              </button>
            </div>
          </div>
        ) : null}

        {phase === 'request' || phase === 'success' ? (
          <div className="welcome-popup-body welcome-popup-body--cta">
            <h2 id={titleId} className="sr-only">
              Want Puddles nearby?
            </h2>
            <ExpansionWatch
              sourceContext="welcome_popup"
              className="welcome-popup-expansion-watch"
              fieldOrder="location-first"
              onSuccess={(details) => {
                onSubmitted(details)
                onPhaseChange('success')
              }}
              onError={onSubmitError}
              successActions={
                <button
                  type="button"
                  className="btn-primary welcome-popup-primary"
                  onClick={() => onDismiss('explore')}
                >
                  Start exploring
                </button>
              }
            />

            {phase === 'request' ? (
              <button
                type="button"
                className="welcome-popup-back"
                onClick={() => onPhaseChange('intro')}
              >
                ← Back
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

import { useEffect, useId, useRef } from 'react'
import { ExpansionWatch } from '../expansion-watch/ExpansionWatch'
import type { ExpansionWatchSourceContext } from '../../types/expansionWatch'

interface NearbyRequestSurfaceProps {
  mode: 'modal' | 'sheet'
  sourceContext: Extract<
    ExpansionWatchSourceContext,
    'welcome_floating_cta' | 'welcome_about'
  >
  onClose: () => void
  onSubmitted: (details: { requestedLocation: string }) => void
  onSubmitError: () => void
}

export function NearbyRequestSurface({
  mode,
  sourceContext,
  onClose,
  onSubmitted,
  onSubmitError,
}: NearbyRequestSurfaceProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const panel = panelRef.current
    const focusTarget =
      panel?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ??
      panel
    focusTarget?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused.current?.focus?.()
    }
  }, [onClose])

  const panel = (
    <div
      ref={panelRef}
      className={
        mode === 'sheet' ? 'nearby-request-sheet-panel' : 'nearby-request-modal-dialog'
      }
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      onClick={mode === 'sheet' ? (e) => e.stopPropagation() : undefined}
    >
      {mode === 'sheet' ? <div className="nearby-request-sheet-handle" aria-hidden /> : null}

      <button
        type="button"
        className="nearby-request-close"
        aria-label="Close"
        onClick={onClose}
      >
        <span aria-hidden>×</span>
      </button>

      <p id={titleId} className="sr-only">
        Want Puddles nearby?
      </p>

      <ExpansionWatch
        sourceContext={sourceContext}
        className="nearby-request-expansion-watch"
        fieldOrder="location-first"
        onSuccess={onSubmitted}
        onError={onSubmitError}
        successActions={
          <button type="button" className="btn-primary welcome-popup-primary" onClick={onClose}>
            Done
          </button>
        }
      />
    </div>
  )

  if (mode === 'sheet') {
    return (
      <div
        className="nearby-request-sheet-overlay"
        role="presentation"
        onClick={onClose}
      >
        {panel}
      </div>
    )
  }

  return (
    <div className="nearby-request-modal-overlay" role="presentation">
      <button
        type="button"
        className="nearby-request-modal-backdrop"
        aria-label="Dismiss"
        onClick={onClose}
      />
      {panel}
    </div>
  )
}

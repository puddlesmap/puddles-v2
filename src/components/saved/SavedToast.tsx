'use client'

import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSavedOptional } from '../../context/SavedContext'

const TOAST_AUTO_DISMISS_MS = 6000

export function SavedToast() {
  const saved = useSavedOptional()
  const toast = saved?.toast

  useEffect(() => {
    if (!toast?.visible || !saved) return
    const timer = window.setTimeout(() => saved.dismissToast(), TOAST_AUTO_DISMISS_MS)
    return () => window.clearTimeout(timer)
  }, [saved, toast?.eventId, toast?.kind, toast?.visible])

  if (!saved?.toast?.visible) return null

  const isRemoved = saved.toast.kind === 'removed'

  return (
    <div className="saved-toast" role="status">
      <p className="saved-toast__copy">
        <strong>{isRemoved ? 'Removed' : 'Saved'}</strong>
      </p>
      <div className="saved-toast__actions">
        {isRemoved ? (
          <button
            type="button"
            className="saved-toast__view"
            onClick={() => saved.undoRemove(saved.toast!.eventId)}
          >
            Undo
          </button>
        ) : (
          <Link to="/saved" className="saved-toast__view" onClick={() => saved.dismissToast()}>
            View saved
          </Link>
        )}
        <button
          type="button"
          className="saved-toast__dismiss"
          aria-label="Dismiss"
          onClick={() => saved.dismissToast()}
        >
          ×
        </button>
      </div>
    </div>
  )
}

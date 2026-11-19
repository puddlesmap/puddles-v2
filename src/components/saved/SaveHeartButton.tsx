'use client'

import type { MouseEvent } from 'react'
import { useSavedOptional } from '../../context/SavedContext'
import type { SaveSurface } from '../../utils/discoveryAttribution'
import { SaveHeartIcon } from './SaveHeartIcon'

export function SaveHeartButton({
  eventId,
  variant = 'card',
  className = '',
  saveSurface = 'browse_list',
}: {
  eventId: string
  variant?: 'card' | 'chrome' | 'map-sheet'
  className?: string
  saveSurface?: SaveSurface
}) {
  const saved = useSavedOptional()
  if (!saved) return null

  const isSaved = saved.isSaved(eventId)
  const size = variant === 'chrome' ? 22 : variant === 'map-sheet' ? 26 : 24

  function onClick(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    saved!.toggleSave(eventId, { save_surface: saveSurface })
  }

  return (
    <button
      type="button"
      className={[
        'save-heart-btn',
        isSaved ? 'save-heart-btn--saved' : '',
        variant === 'chrome' ? 'save-heart-btn--chrome' : '',
        variant === 'map-sheet' ? 'save-heart-btn--map-sheet' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={isSaved ? 'Remove from saved' : 'Save activity'}
      aria-pressed={isSaved}
      onClick={onClick}
    >
      <SaveHeartIcon
        saved={isSaved}
        size={size}
        variant={variant === 'chrome' ? 'chrome' : variant === 'map-sheet' ? 'map-sheet' : 'card'}
      />
    </button>
  )
}

'use client'

import type { MouseEvent } from 'react'
import type { Event } from '../../types/event'
import { ANALYTICS_EVENTS, trackActivityEngagement } from '../../utils/analytics'
import {
  addEventToCalendar,
  canAddEventToCalendar,
  isLikelyInAppBrowser,
} from '../../utils/calendar'

type AddToCalendarVariant = 'primary' | 'secondary' | 'saved-card'

interface AddToCalendarButtonProps {
  event: Event
  variant?: AddToCalendarVariant
  className?: string
  /** Show helper note under the button (Event Detail). */
  showHint?: boolean
}

const VARIANT_CLASS: Record<AddToCalendarVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  'saved-card': 'saved-card-calendar-btn',
}

export function AddToCalendarButton({
  event,
  variant = 'primary',
  className = '',
  showHint = false,
}: AddToCalendarButtonProps) {
  const canCalendar = canAddEventToCalendar(event)

  function handleClick(clickEvent: MouseEvent<HTMLButtonElement>) {
    clickEvent.preventDefault()
    clickEvent.stopPropagation()
    const result = addEventToCalendar(event)
    if (result) trackActivityEngagement(ANALYTICS_EVENTS.ADD_TO_CALENDAR_CLICKED, event)
  }

  const hint =
    showHint && !canCalendar
      ? 'Calendar details unavailable'
      : showHint && canCalendar && isLikelyInAppBrowser()
        ? 'Opens Google Calendar'
        : null

  if (!hint && variant !== 'saved-card') {
    return (
      <button
        type="button"
        className={[VARIANT_CLASS[variant], className].filter(Boolean).join(' ')}
        disabled={!canCalendar}
        onClick={handleClick}
      >
        Add to calendar
      </button>
    )
  }

  return (
    <div
      className={`add-to-calendar${variant === 'saved-card' ? ' add-to-calendar--saved-card' : ''}`}
    >
      <button
        type="button"
        className={[VARIANT_CLASS[variant], className].filter(Boolean).join(' ')}
        disabled={!canCalendar}
        onClick={handleClick}
      >
        Add to calendar
      </button>
      {hint ? <p className="add-to-calendar__hint event-modal-actions-note text-center">{hint}</p> : null}
    </div>
  )
}

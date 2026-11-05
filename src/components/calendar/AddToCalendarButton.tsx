'use client'

import type { MouseEvent } from 'react'
import type { Event } from '../../types/event'
import { ANALYTICS_EVENTS, trackActivityEngagement } from '../../utils/analytics'
import { addEventToCalendar } from '../../utils/calendar'

type AddToCalendarVariant = 'primary' | 'secondary' | 'saved-card'

interface AddToCalendarButtonProps {
  event: Event
  variant?: AddToCalendarVariant
  className?: string
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
}: AddToCalendarButtonProps) {
  function handleClick(clickEvent: MouseEvent<HTMLButtonElement>) {
    clickEvent.preventDefault()
    clickEvent.stopPropagation()
    const result = addEventToCalendar(event)
    if (result) trackActivityEngagement(ANALYTICS_EVENTS.ADD_TO_CALENDAR_CLICKED, event)
  }

  return (
    <button
      type="button"
      className={[VARIANT_CLASS[variant], className].filter(Boolean).join(' ')}
      onClick={handleClick}
    >
      Add to calendar
    </button>
  )
}

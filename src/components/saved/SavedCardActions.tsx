'use client'

import type { MouseEvent } from 'react'
import type { Event } from '../../types/event'
import { useSaved } from '../../context/SavedContext'
import { ANALYTICS_EVENTS, trackActivityEngagement } from '../../utils/analytics'
import { addEventToCalendar } from '../../utils/calendar'
import { SaveHeartIcon } from './SaveHeartIcon'

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

export function SavedCardActions({ event }: { event: Event }) {
  const { toggleSave } = useSaved()

  function handleCalendar(clickEvent: MouseEvent<HTMLButtonElement>) {
    clickEvent.preventDefault()
    clickEvent.stopPropagation()
    const result = addEventToCalendar(event)
    if (result) trackActivityEngagement(ANALYTICS_EVENTS.ADD_TO_CALENDAR_CLICKED, event)
  }

  function handleRemove(clickEvent: MouseEvent<HTMLButtonElement>) {
    clickEvent.preventDefault()
    clickEvent.stopPropagation()
    toggleSave(event.id)
  }

  return (
    <div className="saved-card-actions" role="group" aria-label="Saved activity actions">
      <button
        type="button"
        className="saved-card-actions__calendar"
        aria-label={`Add ${event.title} to calendar`}
        onClick={handleCalendar}
      >
        <CalendarIcon />
        <span>Add to calendar</span>
      </button>
      <button
        type="button"
        className="saved-card-actions__remove"
        aria-label={`Remove ${event.title} from saved`}
        onClick={handleRemove}
      >
        <SaveHeartIcon saved={false} size={18} variant="spec" />
        <span>Remove</span>
      </button>
    </div>
  )
}

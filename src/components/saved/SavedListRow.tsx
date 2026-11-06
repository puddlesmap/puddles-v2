'use client'

import type { MouseEvent } from 'react'
import type { Event } from '../../types/event'
import { useSaved } from '../../context/SavedContext'
import { useEventNavigation } from '../../hooks/useEventNavigation'
import { ANALYTICS_EVENTS, trackActivityEngagement } from '../../utils/analytics'
import { addEventToCalendar } from '../../utils/calendar'
import {
  addDays,
  formatTime,
  parseFlexibleDate,
  startOfDay,
} from '../../utils/dates'
import { getSeasonalAvailability } from '../../utils/formatSeasonalSchedule'
import { EventImage } from '../EventImage'
import { SaveHeartIcon } from './SaveHeartIcon'

export type SavedListRowVariant = 1 | 2 | 3 | 4 | 5

function CalendarPlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M12 13v5M9.5 15.5h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function dateRailParts(ymd: string) {
  const parsed = parseFlexibleDate(ymd) ?? new Date(`${ymd}T12:00:00`)
  const d = startOfDay(parsed)
  if (Number.isNaN(d.getTime())) {
    return { month: '—', day: '—' }
  }
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: String(d.getDate()).padStart(2, '0'),
  }
}

function formatListWhen(event: Event, ymd: string, anchor: Date): string {
  const parsed = parseFlexibleDate(ymd) ?? new Date(`${ymd}T12:00:00`)
  const d = startOfDay(parsed)
  const today = startOfDay(anchor)
  const tomorrow = startOfDay(addDays(anchor, 1))
  let dayPart = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  if (!Number.isNaN(d.getTime())) {
    if (d.getTime() === today.getTime()) dayPart = 'Today'
    else if (d.getTime() === tomorrow.getTime()) dayPart = 'Tomorrow'
  }
  const time = event.startTime?.trim() ? formatTime(event.startTime.trim()) : ''
  return time ? `${dayPart} · ${time}` : dayPart
}

function placeLabel(event: Event): string {
  return [event.venue?.trim(), event.city?.trim()].filter(Boolean).join(' · ') || '—'
}

function DateRail({ month, day }: { month: string; day: string }) {
  return (
    <div className="saved-list-row__rail" aria-hidden>
      <span className="saved-list-row__rail-month">{month}</span>
      <span className="saved-list-row__rail-day">{day}</span>
    </div>
  )
}

export function SavedListRow({
  event,
  variant,
}: {
  event: Event
  variant: SavedListRowVariant
}) {
  const { toggleSave, isSaved } = useSaved()
  const openEvent = useEventNavigation()
  const now = new Date()
  const ymd = getSeasonalAvailability(event, now).nextRelevantYmd || event.date || ''
  const rail = dateRailParts(ymd)
  const when = formatListWhen(event, ymd, now)
  const place = placeLabel(event)
  const saved = isSaved(event.id)

  function handleOpen() {
    openEvent(event, 'saved', { viewMode: 'list' })
  }

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

  function handleHeart(clickEvent: MouseEvent<HTMLButtonElement>) {
    clickEvent.preventDefault()
    clickEvent.stopPropagation()
    toggleSave(event.id)
  }

  const copy = (
    <div className="saved-list-row__copy">
      <button type="button" className="saved-list-row__title" onClick={handleOpen}>
        {event.title}
      </button>
      <p className="saved-list-row__when">{when}</p>
      <p className="saved-list-row__place">{place}</p>
    </div>
  )

  const thumb = (
    <div className="saved-list-row__thumb">
      <EventImage event={event} className="saved-list-row__img" />
    </div>
  )

  const heart = (
    <button
      type="button"
      className="saved-list-row__heart"
      aria-label={saved ? `Remove ${event.title} from saved` : `Save ${event.title}`}
      onClick={handleHeart}
    >
      <SaveHeartIcon saved={saved} size={22} variant="spec" />
    </button>
  )

  const actions = (
    <div className="saved-list-row__actions" role="group" aria-label="Saved activity actions">
      <button
        type="button"
        className="saved-list-row__calendar"
        aria-label={`Add ${event.title} to calendar`}
        onClick={handleCalendar}
      >
        <CalendarPlusIcon />
        <span>Add to calendar</span>
      </button>
      <button
        type="button"
        className="saved-list-row__remove"
        aria-label={`Remove ${event.title} from saved`}
        onClick={handleRemove}
      >
        Remove
      </button>
    </div>
  )

  return (
    <article className={`saved-list-row saved-list-row--v${variant}`}>
      {variant === 1 ? (
        <>
          <div className="saved-list-row__main">
            <DateRail month={rail.month} day={rail.day} />
            {copy}
            <div className="saved-list-row__end">
              {heart}
              {thumb}
            </div>
          </div>
          {actions}
        </>
      ) : null}

      {variant === 2 ? (
        <>
          <div className="saved-list-row__main">
            <DateRail month={rail.month} day={rail.day} />
            {thumb}
            <div className="saved-list-row__mid">
              {copy}
              {heart}
            </div>
          </div>
          {actions}
        </>
      ) : null}

      {variant === 3 ? (
        <>
          <div className="saved-list-row__main">
            <div className="saved-list-row__thumb-wrap">
              {thumb}
              <div className="saved-list-row__badge">
                <span className="saved-list-row__rail-month">{rail.month}</span>
                <span className="saved-list-row__rail-day">{rail.day}</span>
              </div>
            </div>
            <div className="saved-list-row__mid">
              {copy}
              {heart}
            </div>
          </div>
          {actions}
        </>
      ) : null}

      {variant === 4 ? (
        <>
          <div className="saved-list-row__main">
            <DateRail month={rail.month} day={rail.day} />
            {thumb}
            {copy}
            {heart}
          </div>
          {actions}
        </>
      ) : null}

      {variant === 5 ? (
        <>
          <div className="saved-list-row__main">
            <DateRail month={rail.month} day={rail.day} />
            <div className="saved-list-row__mid">
              {copy}
              {heart}
            </div>
          </div>
          <div className="saved-list-row__wide">{thumb}</div>
          {actions}
        </>
      ) : null}
    </article>
  )
}

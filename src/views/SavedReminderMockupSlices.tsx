'use client'

import { useState } from 'react'
import type { Event } from '../types/event'
import { AddToCalendarButton } from '../components/calendar/AddToCalendarButton'
import { RelativeDateLabel } from '../components/event-detail/RelativeDateLabel'
import { EventImage } from '../components/EventImage'
import { Logo } from '../components/layout/Logo'
import { SavedReminderToggleRow } from '../components/saved/SavedReminderToggleRow'
import { SaveHeartIcon } from '../components/saved/SaveHeartIcon'
import { getEventAgeRecommendation } from '../utils/eventAgeRecommendation'
import { isOfficialEventUrl } from '../utils/eventPages'
import { formatSeasonalDetailWhen, eventUsesSeasonalWhen, getSeasonalAvailability } from '../utils/formatSeasonalSchedule'
import {
  addDays,
  formatEventDate,
  formatEventTimeRange,
  formatTime,
  parseFlexibleDate,
  startOfDay,
} from '../utils/dates'
import './shared-event-design-layouts.css'

export const MOCK_CUBBERLEY_ID = 'core-weekend-cubberley-open-studios-fall-2026'

function eventWhenRail(event: Event, now = new Date()) {
  const seasonalWhen = eventUsesSeasonalWhen(event) ? formatSeasonalDetailWhen(event, now) : null
  if (seasonalWhen?.rail?.length) return seasonalWhen.rail
  return [formatEventDate(event.date), formatEventTimeRange(event.startTime, event.endTime)].filter(
    Boolean,
  ) as string[]
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

/** Static v4 list row — avoids Next-only hooks in SavedListRow for mockup / Vite. */
function SavedListRowMockVariant4({ event }: { event: Event }) {
  const now = new Date()
  const ymd = getSeasonalAvailability(event, now).nextRelevantYmd || event.date || ''
  const rail = dateRailParts(ymd)
  const when = formatListWhen(event, ymd, now)
  const place = [event.venue?.trim(), event.city?.trim()].filter(Boolean).join(' · ') || '—'

  return (
    <article className="saved-list-row saved-list-row--v4">
      <div className="saved-list-row__main">
        <div className="saved-list-row__rail" aria-hidden>
          <span className="saved-list-row__rail-month">{rail.month}</span>
          <span className="saved-list-row__rail-day">{rail.day}</span>
        </div>
        <div className="saved-list-row__thumb">
          <EventImage event={event} className="saved-list-row__img" />
        </div>
        <div className="saved-list-row__copy">
          <button type="button" className="saved-list-row__title">
            {event.title}
          </button>
          <p className="saved-list-row__when">{when}</p>
          <p className="saved-list-row__place">{place}</p>
        </div>
        <button type="button" className="saved-list-row__heart" aria-label={`Remove ${event.title} from saved`}>
          <SaveHeartIcon saved={false} size={22} variant="spec" />
        </button>
      </div>
      <div className="saved-list-row__actions" role="group" aria-label="Saved activity actions">
        <button type="button" className="saved-list-row__calendar" aria-label={`Add ${event.title} to calendar`}>
          <span>Add to calendar</span>
        </button>
        <button type="button" className="saved-list-row__remove" aria-label={`Remove ${event.title} from saved`}>
          Remove
        </button>
      </div>
    </article>
  )
}

/** Production sticky rail excerpt (desktop event detail). */
export function SavedReminderMockDetailRail({ event }: { event: Event }) {
  const [reminderOn, setReminderOn] = useState(true)
  const ageLabel = getEventAgeRecommendation(event).label
  const whenRail = eventWhenRail(event)
  const hasOfficial = isOfficialEventUrl(event.eventUrl)

  return (
    <aside className="sedl-airbnb-rail saved-reminder-mockup__rail" aria-label="Save this activity">
      <p className="sedl-airbnb-rail__cost">{event.cost}</p>
      {ageLabel ? <p className="sedl-airbnb-rail__age">{ageLabel}</p> : null}
      <p className="sedl-airbnb-rail__when">
        {whenRail.map((line, index) => (
          <span key={`${line}-${index}`}>
            {index > 0 ? <br /> : null}
            {index === 0 ? <RelativeDateLabel label={line} /> : line}
          </span>
        ))}
      </p>
      <p className="sedl-airbnb-rail__where">{event.venue || event.city}</p>
      <SavedReminderToggleRow on={reminderOn} onToggle={() => setReminderOn((v) => !v)} />
      <AddToCalendarButton event={event} variant="primary" className="sedl-cta" />
      {hasOfficial ? (
        <a href={event.eventUrl} target="_blank" rel="noreferrer" className="btn-secondary sedl-cta">
          Visit official page
        </a>
      ) : null}
    </aside>
  )
}

/** Production Saved list excerpt (mobile list row + persist + manage accordion). */
export function SavedReminderMockSavedPanel({ primaryEvent }: { primaryEvent: Event }) {
  return (
    <div className="saved-reminder-mockup__saved-slice">
      <aside className="saved-page__persist saved-page__persist--signed-in">
        <p className="saved-page__persist-title">Signed in as parent@example.com</p>
        <p className="saved-page__persist-body">Saves sync across devices while you stay signed in.</p>
      </aside>

      <section className="saved-reminders-accordion saved-reminders-accordion--open" id="reminders">
        <div className="saved-reminders-accordion__summary" aria-expanded="true">
          <span>
            <strong>1</strong> reminder on
          </span>
          <span className="saved-reminders-accordion__manage">Hide</span>
        </div>
        <div className="saved-reminders-accordion__panel">
          <label className="saved-reminders-accordion__global">
            <input type="checkbox" defaultChecked readOnly />
            <span>Event reminders (email one day before activities you choose)</span>
          </label>
          <p className="saved-reminders-accordion__email">
            Reminders send to <strong>parent@example.com</strong>
          </p>
          <ul className="saved-reminders-accordion__list">
            <li>
              <span className="saved-reminders-accordion__event-title">{primaryEvent.title}</span>
              <span className="saved-reminders-accordion__toggle" aria-hidden>
                On
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="saved-page__section saved-page__browse">
        <h2 className="saved-page__section-title">Your saves</h2>
        <div className="saved-page__list">
          <SavedListRowMockVariant4 event={primaryEvent} />
        </div>
      </section>
    </div>
  )
}

export function SavedReminderMockSignInPrompt({ eventTitle }: { eventTitle: string }) {
  return (
    <div className="saved-reminder-mockup__signin-frame">
      <div className="saved-signin-overlay saved-reminder-mockup__signin-overlay" role="presentation">
        <div className="saved-signin-backdrop" aria-hidden />
        <div className="saved-signin-sheet saved-reminder-prompt" role="dialog" aria-modal="true">
          <Logo className="saved-signin-logo" />
          <h2 className="saved-signin-title">Day-before email?</h2>
          <p className="saved-signin-lede">
            Want a reminder one day before <strong>{eventTitle}</strong>? Not the Puddles Picks
            newsletter.
          </p>
          <button type="button" className="btn-primary saved-signin-submit">
            Yes, remind me
          </button>
          <button type="button" className="saved-signin-dismiss">
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}

export function SavedReminderMockEmail({ event }: { event: Event }) {
  const whenRail = eventWhenRail(event)
  const whenLine = whenRail.join(' · ')
  const whereLine = [event.venue, event.city].filter(Boolean).join(' · ')
  const tip =
    event.tips
      ?.split('\n')
      .map((line) => line.replace(/^[a-z]+\|/i, '').trim())
      .find(Boolean) ?? ''

  return (
    <div className="saved-reminder-mockup__email-wrap">
      <p className="saved-reminder-mockup__email-subject">
        Subject: Reminder: {event.title} is tomorrow
      </p>
      <div className="saved-reminder-mockup__email-body">
        <p className="saved-reminder-mockup__email-kicker">Your event reminder</p>
        <h3 className="saved-reminder-mockup__email-headline">{event.title} is tomorrow</h3>
        <p className="saved-reminder-mockup__email-line">{whenLine}</p>
        <p className="saved-reminder-mockup__email-line">{whereLine}</p>
        {tip ? (
          <div className="saved-reminder-mockup__email-tip">
            <p className="saved-reminder-mockup__email-tip-label">Good to know</p>
            <p className="saved-reminder-mockup__email-tip-text">{tip}</p>
          </div>
        ) : null}
        <span className="btn-primary saved-reminder-mockup__email-cta">View activity details</span>
        <p className="saved-reminder-mockup__email-foot">
          You asked Puddles for a one-day-before reminder — not Puddles Picks. Manage on Saved · Turn
          off this reminder
        </p>
      </div>
    </div>
  )
}

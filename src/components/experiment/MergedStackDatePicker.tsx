'use client'

import { useMemo, useState } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import {
  PUBLIC_DISPLAY_WINDOW_DAYS,
  addDays,
  parseFlexibleDate,
  startOfDay,
  zonedCalendarDate,
} from '../../utils/dates'
import './merged-date-picker.css'

export type CalendarDay = { date: Date; ymd: string; inWindow: boolean }
export type CalendarMonth = {
  key: string
  label: string
  days: CalendarDay[]
  cells: Array<CalendarDay | null>
}

export type DatePickerStyle = 'stack' | 'split' | 'inline' | 'dense'

function CalendarGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

export function buildCalendarMonths(anchor: Date): CalendarMonth[] {
  const start = startOfDay(anchor)
  const end = addDays(start, PUBLIC_DISPLAY_WINDOW_DAYS - 1)
  const byMonth = new Map<string, CalendarDay[]>()

  for (let cursor = start; cursor.getTime() <= end.getTime(); cursor = addDays(cursor, 1)) {
    const ymd = zonedCalendarDate(cursor)
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
    const days = byMonth.get(key) ?? []
    days.push({ date: new Date(cursor), ymd, inWindow: true })
    byMonth.set(key, days)
  }

  return [...byMonth.entries()].map(([key, days]) => {
    const first = days[0]!.date
    const label = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const leading = Array.from({ length: first.getDay() }, () => null)
    return { key, label, days, cells: [...leading, ...days] }
  })
}

function isYmdInWindow(ymd: string, anchor: Date): boolean {
  const parsed = parseFlexibleDate(ymd) ?? new Date(`${ymd}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return false
  const day = startOfDay(parsed)
  const start = startOfDay(anchor)
  const end = addDays(start, PUBLIC_DISPLAY_WINDOW_DAYS - 1)
  return day.getTime() >= start.getTime() && day.getTime() <= end.getTime()
}

export function MergedDatePicker({
  style = 'stack',
  months,
  anchor,
  pickedYmd,
  onPick,
  showTypeField = true,
  showGoButton = true,
  showTypedSuggestion = false,
}: {
  style?: DatePickerStyle
  months: CalendarMonth[]
  anchor: Date
  pickedYmd: string | null
  onPick: (ymd: string) => void
  /** When false, hide the typed-date field (calendar only). */
  showTypeField?: boolean
  /** When false, Enter / suggestion chip apply the typed date (no Go button). */
  showGoButton?: boolean
  /** Live “Use …” chip while typing a parseable in-window date. */
  showTypedSuggestion?: boolean
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [openKey, setOpenKey] = useState(months[0]?.key ?? '')
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const activeIndex = Math.max(
    0,
    months.findIndex((month) => month.key === openKey),
  )
  const active = months[activeIndex] ?? months[0]
  const dualMonths = useMemo(() => {
    if (!active) return []
    if (!isDesktop || style !== 'stack') return [active]
    const second = months[activeIndex + 1]
    return second ? [active, second] : [active]
  }, [active, activeIndex, isDesktop, months, style])

  function shiftMonth(delta: number) {
    const next = months[activeIndex + delta]
    if (next) setOpenKey(next.key)
  }

  function resolveTyped(): { ymd: string; parsed: Date } | null {
    const parsed = parseFlexibleDate(draft)
    if (!parsed || Number.isNaN(parsed.getTime())) return null
    const ymd = zonedCalendarDate(parsed)
    if (!isYmdInWindow(ymd, anchor)) return null
    return { ymd, parsed }
  }

  function applyTyped() {
    const resolved = resolveTyped()
    if (!resolved) {
      const parsed = parseFlexibleDate(draft)
      if (!parsed || Number.isNaN(parsed.getTime())) {
        setError('Try Nov 12 or 11/12')
        return
      }
      setError(`Stay within ~${PUBLIC_DISPLAY_WINDOW_DAYS} days`)
      return
    }
    setError(null)
    const { ymd, parsed } = resolved
    const monthKey = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`
    if (months.some((month) => month.key === monthKey)) setOpenKey(monthKey)
    onPick(ymd)
  }

  const typedSuggestion = showTypedSuggestion ? resolveTyped() : null
  const suggestionLabel = typedSuggestion
    ? typedSuggestion.parsed.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : null

  const liveHint = (() => {
    if (!showTypedSuggestion || !draft.trim() || typedSuggestion) return null
    const parsed = parseFlexibleDate(draft)
    if (!parsed || Number.isNaN(parsed.getTime())) return 'Try Nov 12 or 11/12'
    return `Stay within ~${PUBLIC_DISPLAY_WINDOW_DAYS} days`
  })()

  const typeField = (
    <div className="wws-merged__type-block">
      <div className="wws-merged__type">
        <label className="wws-merged__type-field">
          <span className="wws-merged__type-icon" aria-hidden>
            <CalendarGlyph />
          </span>
          <input
            className="wws-merged__type-input"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value)
              setError(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                applyTyped()
              }
            }}
            placeholder="Nov 12 or 11/12"
            aria-label="Type a date"
          />
        </label>
        {showGoButton ? (
          <button type="button" className="wws-merged__type-go" onClick={applyTyped}>
            Go
          </button>
        ) : null}
      </div>
      {suggestionLabel && typedSuggestion ? (
        <button
          type="button"
          className="wws-merged__suggest"
          onClick={() => {
            setError(null)
            const monthKey = `${typedSuggestion.parsed.getFullYear()}-${String(typedSuggestion.parsed.getMonth() + 1).padStart(2, '0')}`
            if (months.some((month) => month.key === monthKey)) setOpenKey(monthKey)
            onPick(typedSuggestion.ymd)
          }}
        >
          Use {suggestionLabel}
        </button>
      ) : liveHint ? (
        <p className="wws-merged__live-hint">{liveHint}</p>
      ) : null}
    </div>
  )

  const monthTabs = (
    <div className="wws-merged__tabs" role="tablist" aria-label="Months">
      {months.map((month) => (
        <button
          key={month.key}
          type="button"
          role="tab"
          aria-selected={openKey === month.key}
          className={[
            'wws-merged__tab',
            openKey === month.key ? 'wws-merged__tab--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => setOpenKey(month.key)}
        >
          {month.days[0]!.date.toLocaleDateString('en-US', { month: 'short' })}
        </button>
      ))}
    </div>
  )

  function renderMonthPanel(month: CalendarMonth) {
    return (
      <div key={month.key} className="wws-merged__month">
        <h4 className="wws-merged__month-title">{month.label}</h4>
        <div className="wws-calendar__grid wws-merged__dow" aria-hidden>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dow, index) => (
            <span key={`${month.key}-${dow}-${index}`} className="wws-calendar__dow">
              {dow}
            </span>
          ))}
        </div>
        <div className="wws-calendar__grid" role="grid" aria-label={month.label}>
          {month.cells.map((day, index) =>
            day ? (
              <button
                key={day.ymd}
                type="button"
                className={[
                  'wws-calendar__day',
                  pickedYmd === day.ymd ? 'wws-calendar__day--selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onPick(day.ymd)}
              >
                {day.date.getDate()}
              </button>
            ) : (
              <span key={`${month.key}-pad-${index}`} className="wws-calendar__pad" />
            ),
          )}
        </div>
      </div>
    )
  }

  const stackCalendar = (
    <div className="wws-merged__calendar-shell">
      {!isDesktop ? <div className="wws-merged__mobile-tabs">{monthTabs}</div> : null}
      {isDesktop ? (
        <div className="wws-merged__nav-row">
          <button
            type="button"
            className="wws-merged__nav"
            aria-label="Previous month"
            disabled={activeIndex <= 0}
            onClick={() => shiftMonth(-1)}
          >
            ‹
          </button>
          <button
            type="button"
            className="wws-merged__nav"
            aria-label="Next month"
            disabled={activeIndex >= months.length - (dualMonths.length > 1 ? 2 : 1)}
            onClick={() => shiftMonth(1)}
          >
            ›
          </button>
        </div>
      ) : null}
      <div
        className={[
          'wws-merged__months',
          dualMonths.length > 1 ? 'wws-merged__months--dual' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {dualMonths.map((month) => renderMonthPanel(month))}
      </div>
    </div>
  )

  const singleGrid = active ? renderMonthPanel(active) : null

  const typeBlock = showTypeField ? typeField : null

  return (
    <div className={`wws-merged wws-merged--${style}`}>
      {style === 'inline' ? (
        <div className="wws-merged__inline-bar">
          {monthTabs}
          {typeBlock}
        </div>
      ) : null}
      {style === 'stack' || style === 'dense' ? typeBlock : null}
      {style === 'split' ? (
        <div className="wws-merged__split">
          <div className="wws-merged__split-type">
            {typeBlock}
            {showTypeField ? <p className="wws-merged__hint">Or pick a day</p> : null}
            {monthTabs}
          </div>
          <div className="wws-merged__split-cal">{singleGrid}</div>
        </div>
      ) : style === 'stack' ? (
        stackCalendar
      ) : (
        <>
          {style !== 'inline' ? monthTabs : null}
          {singleGrid}
        </>
      )}
      {showTypeField && error ? <p className="wws-merged__error">{error}</p> : null}
    </div>
  )
}

/** Style 1 — calendar stack; type-in off by default for pill/browse When. */
export function MergedStackDatePicker(
  props: Omit<Parameters<typeof MergedDatePicker>[0], 'style'>,
) {
  return <MergedDatePicker {...props} style="stack" showTypeField={props.showTypeField ?? false} />
}

'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  MergedStackDatePicker,
  buildCalendarMonths,
} from '../experiment/MergedStackDatePicker'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import {
  formatShortDate,
  getAnchorDate,
  getTemporalTabs,
  type TemporalTab,
} from '../../utils/dates'
import type { DayFilter, TimeFilter } from '../../types/event'
import './where-when-pill.css'

type Panel = 'where' | 'when' | null

export type WhereWhenCityValue =
  | 'all'
  | 'other'
  | 'nearby'
  | 'Palo Alto'
  | 'Los Altos'
  | 'Mountain View'
  | 'Sunnyvale'

type WhereOption = {
  key: WhereWhenCityValue
  title: string
  sub: string
  tone: 'nearby' | 'city' | 'other'
}

const TIME_OPTIONS: { key: TimeFilter; label: string; sub: string }[] = [
  { key: 'any', label: 'Any time', sub: 'All hours' },
  { key: 'morning', label: 'Morning', sub: 'Before 12 PM' },
  { key: 'after-lunch', label: 'After lunch', sub: 'Between 12 PM – 3 PM' },
  { key: 'late-afternoon', label: 'Late afternoon', sub: 'Between 3 PM – 5 PM' },
  { key: 'evening', label: 'Evening', sub: 'After 5 PM' },
]

const DAY_LABELS: Record<DayFilter, string> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  weekend: 'This weekend',
  anytime: 'Anytime',
}

const TIME_SHORT: Record<TimeFilter, string> = {
  any: '',
  morning: 'Morning',
  'after-lunch': 'After lunch',
  'late-afternoon': 'Late afternoon',
  evening: 'Evening',
}

const BROWSE_SHEET_TITLES = {
  where: 'Choose a location',
  when: 'Choose a date',
} as const

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function CalendarGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function ClockGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 8v4.5l3 1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function whereOptionsFor(surface: 'home' | 'browse'): WhereOption[] {
  const allTitle = surface === 'home' ? 'All Cities' : 'All cities'
  return [
    { key: 'nearby', title: 'Nearby', sub: 'Near you · within ~8 mi', tone: 'nearby' },
    { key: 'Palo Alto', title: 'Palo Alto', sub: 'Core city', tone: 'city' },
    { key: 'Los Altos', title: 'Los Altos', sub: 'Includes Los Altos Hills', tone: 'city' },
    { key: 'Mountain View', title: 'Mountain View', sub: 'Core city', tone: 'city' },
    { key: 'Sunnyvale', title: 'Sunnyvale', sub: 'Core city', tone: 'city' },
    { key: 'other', title: 'Other cities', sub: 'Outside the core four', tone: 'other' },
    { key: 'all', title: allTitle, sub: 'Everything we list', tone: 'other' },
  ]
}

function isZipLikeQuery(raw: string): boolean {
  return /^\d{3,5}$/.test(raw.trim())
}

function rowMatchesQuery(row: WhereOption, q: string): boolean {
  return (
    row.title.toLowerCase().includes(q) ||
    row.sub.toLowerCase().includes(q) ||
    row.key.toLowerCase().includes(q)
  )
}

export type WhereWhenPillFiltersProps = {
  surface: 'home' | 'browse'
  whereKey: WhereWhenCityValue
  /** Home: temporal tab. Browse: DayFilter including anytime. */
  dayKey: TemporalTab | DayFilter
  timeKey?: TimeFilter
  pickedYmd: string | null
  onWhereSelect: (key: WhereWhenCityValue) => void
  onDaySelect: (key: TemporalTab | DayFilter) => void
  onTimeSelect?: (key: TimeFilter) => void
  onPickDate: (ymd: string) => void
  onClearPickedDate: () => void
  onOpenChange?: (open: boolean) => void
}

export function WhereWhenPillFilters({
  surface,
  whereKey,
  dayKey,
  timeKey = 'any',
  pickedYmd,
  onWhereSelect,
  onDaySelect,
  onTimeSelect,
  onPickDate,
  onClearPickedDate,
  onOpenChange,
}: WhereWhenPillFiltersProps) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const useBrowseFilterSheet = surface === 'browse' && isMobile
  const anchor = useMemo(() => getAnchorDate(), [])
  const months = useMemo(() => buildCalendarMonths(anchor), [anchor])
  const temporalTabs = useMemo(() => getTemporalTabs(anchor), [anchor])
  const whereOptions = useMemo(() => whereOptionsFor(surface), [surface])
  const rootRef = useRef<HTMLDivElement>(null)
  const dateBlockRef = useRef<HTMLDivElement>(null)
  const timeSectionRef = useRef<HTMLDivElement>(null)
  const scrollTimeAfterPickRef = useRef(false)

  const [panel, setPanel] = useState<Panel>(null)
  const [query, setQuery] = useState('')
  const [showDate, setShowDate] = useState(Boolean(pickedYmd))
  const [portalReady, setPortalReady] = useState(false)

  useEffect(() => {
    setPortalReady(true)
  }, [])

  useEffect(() => {
    onOpenChange?.(panel !== null)
  }, [panel, onOpenChange])

  useEffect(() => {
    if (!panel) return

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setPanel(null)
        setShowDate(Boolean(pickedYmd))
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [panel, pickedYmd])

  useEffect(() => {
    if (!showDate || surface !== 'browse') return
    const timer = window.setTimeout(() => {
      dateBlockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
    return () => window.clearTimeout(timer)
  }, [showDate, surface])

  useEffect(() => {
    if (!scrollTimeAfterPickRef.current || surface !== 'browse') return
    scrollTimeAfterPickRef.current = false
    const frame = requestAnimationFrame(() => {
      timeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
    return () => cancelAnimationFrame(frame)
  }, [pickedYmd, surface])

  const whereLabel =
    whereOptions.find((row) => row.key === whereKey)?.title ??
    (surface === 'home' ? 'All Cities' : 'All cities')

  const whenLabel = (() => {
    const dayPart = pickedYmd
      ? new Date(`${pickedYmd}T12:00:00`).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      : DAY_LABELS[dayKey as DayFilter] ??
        temporalTabs.find((tab) => tab.key === dayKey)?.label ??
        'Today'
    if (surface !== 'browse' || timeKey === 'any') return dayPart
    return `${dayPart} · ${TIME_SHORT[timeKey]}`
  })()

  const dayRows = useMemo(() => {
    const rows = temporalTabs.map((tab) => ({
      key: tab.key as DayFilter | TemporalTab,
      title: tab.label,
      sub: tab.sub,
    }))
    if (surface === 'browse') {
      rows.push({ key: 'anytime', title: 'Anytime', sub: 'Next 2 months' })
    }
    return rows
  }, [temporalTabs, surface])

  const zipLike = isZipLikeQuery(query)
  const filteredWhere = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return whereOptions
    const matched = whereOptions.filter((row) => rowMatchesQuery(row, q))
    if (matched.length > 0) return matched
    // ZIP or other non-city text → offer Nearby instead of an empty state
    const nearby = whereOptions.find((row) => row.key === 'nearby')
    return nearby ? [nearby] : []
  }, [query, whereOptions])

  function toggle(next: Exclude<Panel, null>) {
    setPanel((current) => {
      if (current === next) {
        setShowDate(Boolean(pickedYmd))
        return null
      }
      if (next === 'when') setShowDate(Boolean(pickedYmd))
      return next
    })
  }

  function closePanel() {
    setPanel(null)
    setShowDate(Boolean(pickedYmd))
  }

  function selectWhere(key: WhereWhenCityValue) {
    onWhereSelect(key)
    closePanel()
  }

  function selectDay(key: TemporalTab | DayFilter) {
    onClearPickedDate()
    setShowDate(false)
    onDaySelect(key)
    if (surface === 'home') closePanel()
  }

  function selectTime(key: TimeFilter) {
    onTimeSelect?.(key)
  }

  const daySelected = !pickedYmd && !showDate

  const whereBody = (
    <>
      {!useBrowseFilterSheet ? (
        <p className="ww-pill-panel__eyebrow">Suggested destinations</p>
      ) : null}
      <label className="ww-pill-typeahead">
        <SearchIcon />
        <input
          className="ww-pill-typeahead__input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search city or ZIP"
          aria-label="Search city or ZIP"
          inputMode="search"
        />
      </label>
      {zipLike && filteredWhere.length === 1 && filteredWhere[0]?.key === 'nearby' ? (
        <p className="ww-pill-zip-hint">Showing Nearby for this ZIP</p>
      ) : null}
      <div className="ww-pill-list">
        {filteredWhere.map((row) => (
          <button
            key={row.key}
            type="button"
            className={['ww-pill-row', whereKey === row.key ? 'ww-pill-row--selected' : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => selectWhere(row.key)}
          >
            <span
              className={[
                'ww-pill-row__icon',
                row.tone === 'nearby' ? 'ww-pill-row__icon--nearby' : '',
                row.tone === 'other' ? 'ww-pill-row__icon--other' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-hidden
            >
              <PinIcon />
            </span>
            <span className="ww-pill-row__copy">
              <span className="ww-pill-row__title">{row.title}</span>
              <span className="ww-pill-row__sub">{row.sub}</span>
            </span>
          </button>
        ))}
      </div>
    </>
  )

  const whenBody = (
    <>
      <div className="ww-pill-panel__section">
        {!useBrowseFilterSheet ? (
          <p className="ww-pill-panel__eyebrow">
            {surface === 'home' ? 'Home when' : 'Choose a date'}
          </p>
        ) : (
          <p className="ww-pill-panel__eyebrow">Date</p>
        )}
        <div className="ww-pill-list">
          {dayRows.map((row) => (
            <button
              key={row.key}
              type="button"
              className={[
                'ww-pill-row',
                daySelected && dayKey === row.key ? 'ww-pill-row--selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => selectDay(row.key)}
            >
              <span className="ww-pill-row__icon ww-pill-row__icon--when" aria-hidden>
                <CalendarGlyph />
              </span>
              <span className="ww-pill-row__copy">
                <span className="ww-pill-row__title">{row.title}</span>
                <span className="ww-pill-row__sub">{row.sub}</span>
              </span>
            </button>
          ))}
          <button
            type="button"
            className={['ww-pill-row', pickedYmd || showDate ? 'ww-pill-row--selected' : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => setShowDate(true)}
          >
            <span className="ww-pill-row__icon ww-pill-row__icon--when" aria-hidden>
              <CalendarGlyph />
            </span>
            <span className="ww-pill-row__copy">
              <span className="ww-pill-row__title">Pick a date</span>
              <span className="ww-pill-row__sub">
                {pickedYmd
                  ? formatShortDate(new Date(`${pickedYmd}T12:00:00`))
                  : 'Tap the calendar'}
              </span>
            </span>
          </button>
        </div>
        {showDate ? (
          <div ref={dateBlockRef} className="ww-pill-date">
            <MergedStackDatePicker
              months={months}
              anchor={anchor}
              pickedYmd={pickedYmd}
              onPick={(ymd) => {
                if (surface === 'browse') scrollTimeAfterPickRef.current = true
                onPickDate(ymd)
                if (surface === 'home') closePanel()
              }}
            />
          </div>
        ) : null}
      </div>

      {surface === 'browse' ? (
        <div ref={timeSectionRef} className="ww-pill-panel__section">
          <p className="ww-pill-panel__eyebrow">Time of day</p>
          <div className="ww-pill-list">
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={['ww-pill-row', timeKey === opt.key ? 'ww-pill-row--selected' : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => selectTime(opt.key)}
              >
                <span className="ww-pill-row__icon ww-pill-row__icon--time" aria-hidden>
                  <ClockGlyph />
                </span>
                <span className="ww-pill-row__copy">
                  <span className="ww-pill-row__title">{opt.label}</span>
                  <span className="ww-pill-row__sub">{opt.sub}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  )

  function renderBrowseFilterSheet(active: Exclude<Panel, null>, body: ReactNode) {
    if (!portalReady) return null
    return createPortal(
      <div
        className="filter-sheet-overlay fixed inset-0 z-50 flex items-end bg-black/40 md:hidden"
        onClick={closePanel}
        role="presentation"
      >
        <div
          className="filter-sheet-panel flex max-h-[min(78dvh,640px)] w-full flex-col rounded-t-2xl bg-white"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ww-pill-filter-sheet-title"
        >
          <div className="flex shrink-0 items-start justify-between border-b border-border px-5 pb-4 pt-5">
            <h2
              id="ww-pill-filter-sheet-title"
              className="font-display pr-4 text-[22px] leading-tight text-charcoal"
            >
              {BROWSE_SHEET_TITLES[active]}
            </h2>
            <button
              type="button"
              onClick={closePanel}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-charcoal hover:bg-surface-muted"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="ww-pill-filter-sheet-body min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {body}
          </div>
          <div className="filter-sheet-actions flex shrink-0 items-center justify-end border-t border-border bg-white px-5 py-4">
            <button type="button" onClick={closePanel} className="btn-primary px-6">
              Done
            </button>
          </div>
        </div>
      </div>,
      document.body,
    )
  }

  const homeOrDesktopPanelClass = [
    'ww-pill-panel',
    isMobile ? 'ww-pill-panel--sheet' : 'ww-pill-panel--overlay',
  ].join(' ')

  let panelNode: ReactNode = null
  if (panel === 'where') {
    panelNode = useBrowseFilterSheet ? (
      renderBrowseFilterSheet('where', whereBody)
    ) : (
      <>
        <button
          type="button"
          className="ww-pill-scrim"
          aria-label="Close filters"
          onClick={closePanel}
        />
        <div className={homeOrDesktopPanelClass} role="dialog" aria-label="Where">
          {whereBody}
        </div>
      </>
    )
  } else if (panel === 'when') {
    panelNode = useBrowseFilterSheet ? (
      renderBrowseFilterSheet('when', whenBody)
    ) : (
      <>
        <button
          type="button"
          className="ww-pill-scrim"
          aria-label="Close filters"
          onClick={closePanel}
        />
        <div className={homeOrDesktopPanelClass} role="dialog" aria-label="When">
          {whenBody}
          {surface === 'browse' ? (
            <div className="ww-pill-done">
              <button type="button" className="ww-pill-done__btn" onClick={closePanel}>
                Done
              </button>
            </div>
          ) : null}
        </div>
      </>
    )
  }

  return (
    <div ref={rootRef} className="ww-pill-root" aria-label="Where and when">
      <div className="ww-pill" role="group" aria-label="Where and when">
        <button
          type="button"
          className={['ww-pill__seg', panel === 'where' ? 'ww-pill__seg--active' : '']
            .filter(Boolean)
            .join(' ')}
          aria-expanded={panel === 'where'}
          onClick={() => toggle('where')}
        >
          <span className="ww-pill__label">Where</span>
          <span className="ww-pill__value">{whereLabel}</span>
        </button>
        <button
          type="button"
          className={['ww-pill__seg', panel === 'when' ? 'ww-pill__seg--active' : '']
            .filter(Boolean)
            .join(' ')}
          aria-expanded={panel === 'when'}
          onClick={() => toggle('when')}
        >
          <span className="ww-pill__label">When</span>
          <span className="ww-pill__value">{whenLabel}</span>
        </button>
      </div>

      {panelNode}
    </div>
  )
}

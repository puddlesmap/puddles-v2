'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { DayFilter } from '../../types/event'
import {
  formatShortDate,
  getAnchorDate,
  getTemporalTabs,
} from '../../utils/dates'
import {
  MergedStackDatePicker,
  buildCalendarMonths,
} from '../experiment/MergedStackDatePicker'

type DayOption = {
  key: DayFilter
  label: string
  sub: string
}

interface BrowseDayOptionsProps {
  selectedDay: DayFilter
  pickedYmd: string | null
  onSelectDay: (day: DayFilter) => void
  onPickDate: (ymd: string) => void
  onClearPickedDate: () => void
  variant: 'sheet' | 'popover'
  /** Experiment: Style 1 pick-a-date under Upcoming options. */
  enablePickADate?: boolean
}

export function BrowseDayOptions({
  selectedDay,
  pickedYmd,
  onSelectDay,
  onPickDate,
  onClearPickedDate,
  variant,
  enablePickADate = false,
}: BrowseDayOptionsProps) {
  const anchor = useMemo(() => getAnchorDate(), [])
  const months = useMemo(() => buildCalendarMonths(anchor), [anchor])
  const dayTabs = useMemo(() => getTemporalTabs(anchor), [anchor])
  const [showDate, setShowDate] = useState(Boolean(pickedYmd))
  const dateBlockRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showDate || !enablePickADate) return
    const timer = window.setTimeout(() => {
      dateBlockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
    return () => window.clearTimeout(timer)
  }, [showDate, enablePickADate])

  const options: DayOption[] = [
    ...dayTabs.map((t) => ({
      key: t.key as DayFilter,
      label: t.label,
      sub: t.sub,
    })),
    { key: 'anytime', label: 'Anytime', sub: 'Next 2 months' },
  ]

  const daySelected = !pickedYmd && !showDate

  return (
    <div className={variant === 'sheet' ? 'space-y-1' : 'space-y-0.5'}>
      {options.map((opt) => {
        const selected = daySelected && selectedDay === opt.key
        if (variant === 'sheet') {
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                setShowDate(false)
                onClearPickedDate()
                onSelectDay(opt.key)
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-left transition-colors ${
                selected ? 'bg-surface-muted' : 'hover:bg-surface-muted/70'
              }`}
            >
              <div>
                <div className="text-[15px] font-medium text-charcoal">{opt.label}</div>
                <div className="mt-0.5 text-xs text-muted">{opt.sub}</div>
              </div>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  selected ? 'border-charcoal bg-charcoal' : 'border-border'
                }`}
                aria-hidden
              >
                {selected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
              </span>
            </button>
          )
        }

        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => {
              setShowDate(false)
              onClearPickedDate()
              onSelectDay(opt.key)
            }}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-surface-muted ${
              selected ? 'bg-surface-muted' : ''
            }`}
          >
            <div>
              <div className="text-[15px] font-medium">{opt.label}</div>
              <div className="text-xs text-muted">{opt.sub}</div>
            </div>
          </button>
        )
      })}

      {enablePickADate ? (
        <>
          <button
            type="button"
            onClick={() => setShowDate(true)}
            className={
              variant === 'sheet'
                ? `flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-left transition-colors ${
                    pickedYmd || showDate ? 'bg-surface-muted' : 'hover:bg-surface-muted/70'
                  }`
                : `flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-surface-muted ${
                    pickedYmd || showDate ? 'bg-surface-muted' : ''
                  }`
            }
          >
            <div>
              <div className="text-[15px] font-medium text-charcoal">Pick a date</div>
              <div className="mt-0.5 text-xs text-muted">
                {pickedYmd
                  ? formatShortDate(new Date(`${pickedYmd}T12:00:00`))
                  : 'Tap the calendar'}
              </div>
            </div>
            {variant === 'sheet' ? (
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  pickedYmd || showDate ? 'border-charcoal bg-charcoal' : 'border-border'
                }`}
                aria-hidden
              >
                {pickedYmd || showDate ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
              </span>
            ) : null}
          </button>
          {showDate ? (
            <div
              ref={dateBlockRef}
              className="browse-day-pick-date mt-3 scroll-mt-4 border-t border-border pt-4"
            >
              <MergedStackDatePicker
                months={months}
                anchor={anchor}
                pickedYmd={pickedYmd}
                onPick={(ymd) => {
                  onPickDate(ymd)
                }}
              />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

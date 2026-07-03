import { useEffect, useState } from 'react'
import type { DayFilter, TimeFilter } from '../types/event'
import { PUBLIC_AGE_FILTER_OPTIONS } from '../utils/ageRange'
import { ACTIVITY_TYPES } from '../types/event'
import { getTemporalTabs } from '../utils/dates'
import { getFilteredCount, type BrowseFilters } from '../utils/filters'
import { BrowseLocationOptions } from './filters/BrowseLocationOptions'
import { trackBrowseFiltersApplied, trackCitySelected } from '../utils/analytics'

const TIME_OPTIONS: { key: TimeFilter; label: string; sub: string }[] = [
  { key: 'any', label: 'Any time', sub: 'All hours' },
  { key: 'morning', label: 'Morning', sub: 'Before 12 PM' },
  { key: 'after-lunch', label: 'After lunch', sub: 'Between 12 PM – 3 PM' },
  { key: 'late-afternoon', label: 'Late afternoon', sub: 'Between 3 PM – 5 PM' },
  { key: 'evening', label: 'Evening', sub: 'After 5 PM' },
]

const AGE_OPTIONS = PUBLIC_AGE_FILTER_OPTIONS

const SHEET_TITLES = {
  location: 'Choose a location',
  day: 'Choose a date',
  time: 'Choose a time of day',
  age: 'Choose an age range',
  type: 'Choose an activity type',
} as const

export type FilterSheetType = keyof typeof SHEET_TITLES | null

interface FilterSheetProps {
  filters: BrowseFilters
  onApply: (f: BrowseFilters) => void
  open: FilterSheetType
  onClose: () => void
  hasNearbyCoords?: boolean
  onRequestNearby?: () => Promise<boolean>
}

export function FilterSheet({
  filters,
  onApply,
  open,
  onClose,
  hasNearbyCoords = false,
  onRequestNearby,
}: FilterSheetProps) {
  const [draft, setDraft] = useState(filters)

  useEffect(() => {
    if (open) setDraft(filters)
  }, [open, filters])

  if (!open) return null

  const count = getFilteredCount(draft)
  const resultsLabel = count > 0 ? `Show ${count} results` : 'Show results'
  const dayTabs = getTemporalTabs()

  function apply() {
    void applyFilters()
  }

  async function applyFilters() {
    if (open === 'location') {
      if (draft.city === 'nearby') {
        const granted = hasNearbyCoords || (await onRequestNearby?.()) === true
        if (!granted) return
      }

      trackCitySelected(draft.city, 'browse')
      onApply({
        ...draft,
        city: draft.city,
        cityLocked: draft.city !== 'all',
      })
      onClose()
      return
    }

    if (open) {
      trackBrowseFiltersApplied(filters, draft)
    }
    onApply(draft)
    onClose()
  }

  function clear() {
    if (open === 'day') setDraft({ ...draft, day: 'anytime' })
    if (open === 'time') setDraft({ ...draft, time: 'any' })
    if (open === 'age') setDraft({ ...draft, age: 'all' })
    if (open === 'type') setDraft({ ...draft, types: [] })
  }

  return (
    <div
      className="filter-sheet-overlay fixed inset-0 z-50 flex items-end bg-black/40 md:hidden"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="filter-sheet-panel flex max-h-[min(78dvh,640px)] w-full flex-col rounded-t-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-sheet-title"
      >
        <div className="flex shrink-0 items-start justify-between border-b border-border px-5 pb-4 pt-5">
          <h2 id="filter-sheet-title" className="font-display pr-4 text-[22px] leading-tight text-charcoal">
            {SHEET_TITLES[open]}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-charcoal hover:bg-surface-muted"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {open === 'location' && (
            <BrowseLocationOptions
              selectedCity={draft.city}
              onSelect={(city) => setDraft({ ...draft, city })}
              variant="sheet"
            />
          )}

          {open === 'day' && (
            <div className="space-y-1">
              {[
                ...dayTabs.map((t) => ({
                  key: t.key as DayFilter,
                  label: t.label,
                  sub: t.sub,
                })),
                { key: 'anytime' as DayFilter, label: 'Anytime', sub: 'Next 2 months' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setDraft({ ...draft, day: opt.key })}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-left transition-colors ${
                    draft.day === opt.key ? 'bg-surface-muted' : 'hover:bg-surface-muted/70'
                  }`}
                >
                  <div>
                    <div className="text-[15px] font-medium text-charcoal">{opt.label}</div>
                    <div className="mt-0.5 text-xs text-muted">{opt.sub}</div>
                  </div>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      draft.day === opt.key ? 'border-charcoal bg-charcoal' : 'border-border'
                    }`}
                    aria-hidden
                  >
                    {draft.day === opt.key && (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}

          {open === 'time' && (
            <div className="space-y-1">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setDraft({ ...draft, time: opt.key })}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-left transition-colors ${
                    draft.time === opt.key ? 'bg-surface-muted' : 'hover:bg-surface-muted/70'
                  }`}
                >
                  <div>
                    <div className="text-[15px] font-medium text-charcoal">{opt.label}</div>
                    {opt.key !== 'any' && (
                      <div className="mt-0.5 text-xs text-muted">{opt.sub}</div>
                    )}
                  </div>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      draft.time === opt.key ? 'border-charcoal bg-charcoal' : 'border-border'
                    }`}
                    aria-hidden
                  >
                    {draft.time === opt.key && (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}

          {open === 'age' && (
            <div className="space-y-1">
              {AGE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setDraft({ ...draft, age: opt.key })}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-left transition-colors ${
                    draft.age === opt.key ? 'bg-surface-muted' : 'hover:bg-surface-muted/70'
                  }`}
                >
                  <div className="text-[15px] font-medium text-charcoal">{opt.label}</div>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      draft.age === opt.key ? 'border-charcoal bg-charcoal' : 'border-border'
                    }`}
                    aria-hidden
                  >
                    {draft.age === opt.key && (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}

          {open === 'type' && (
            <div className="pill-wrap">
              {ACTIVITY_TYPES.map((type) => {
                const selected = draft.types.includes(type)
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        types: selected
                          ? draft.types.filter((t) => t !== type)
                          : [...draft.types, type],
                      })
                    }
                    className={`pill-select ${selected ? 'pill-select-active' : ''}`}
                  >
                    {type}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div
          className={`filter-sheet-actions flex shrink-0 items-center border-t border-border bg-white px-5 py-4 ${
            open === 'location' ? 'justify-end' : 'justify-between'
          }`}
        >
          {open !== 'location' ? (
            <button
              type="button"
              onClick={clear}
              className="text-[15px] font-semibold text-charcoal underline underline-offset-4"
            >
              Clear
            </button>
          ) : null}
          <button type="button" onClick={apply} className="btn-primary px-6">
            {resultsLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

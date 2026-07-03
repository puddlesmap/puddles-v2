import { useEffect, useState } from 'react'
import type { DayFilter, TimeFilter } from '../types/event'
import { PUBLIC_AGE_FILTER_OPTIONS } from '../utils/ageRange'
import { ACTIVITY_TYPES } from '../types/event'
import { getTemporalTabs } from '../utils/dates'
import type { BrowseFilters } from '../utils/filters'
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

export type FilterPopoverType = 'location' | 'day' | 'time' | 'age' | 'type' | null

interface FilterPopoverProps {
  filters: BrowseFilters
  onApply: (f: BrowseFilters) => void
  open: FilterPopoverType
  onClose: () => void
  hasNearbyCoords?: boolean
  onRequestNearby?: () => Promise<boolean>
}

export function FilterPopover({
  filters,
  onApply,
  open,
  onClose,
  hasNearbyCoords = false,
  onRequestNearby,
}: FilterPopoverProps) {
  const [draft, setDraft] = useState(filters)

  useEffect(() => {
    if (open) setDraft(filters)
  }, [open, filters])

  if (!open) return null

  const dayTabs = getTemporalTabs()
  const isLocation = open === 'location'

  function apply(next: BrowseFilters) {
    if (open && open !== 'location') {
      trackBrowseFiltersApplied(filters, next)
    }
    onApply(next)
    onClose()
  }

  async function applyLocation(city: BrowseFilters['city']) {
    if (city === 'nearby') {
      if (draft.city === 'nearby' && hasNearbyCoords) {
        onClose()
        return
      }

      trackCitySelected('nearby', 'browse')
      const granted = hasNearbyCoords || (await onRequestNearby?.()) === true
      if (!granted) return

      apply({
        ...draft,
        city: 'nearby',
        cityLocked: true,
      })
      return
    }

    trackCitySelected(city, 'browse')
    apply({
      ...draft,
      city,
      cityLocked: city !== 'all',
    })
  }

  if (isLocation) {
    return (
      <div
        className="absolute left-0 right-0 top-full z-50 mt-2 hidden max-h-[min(24rem,60dvh)] overflow-y-auto rounded-xl border border-border bg-white p-4 shadow-card md:block"
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-sm font-semibold text-charcoal">Where</h3>
        <div className="mt-2">
          <BrowseLocationOptions
            selectedCity={draft.city}
            onSelect={applyLocation}
            variant="popover"
          />
        </div>
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/20"
        aria-label="Close filter menu"
        onClick={onClose}
      />
      <div
        className="absolute left-0 right-0 top-full z-50 mt-2 hidden max-h-[min(24rem,60dvh)] overflow-y-auto rounded-xl border border-border bg-white p-4 shadow-card md:block"
        role="dialog"
        aria-modal="true"
      >
        {open === 'day' && (
          <>
            <h3 className="text-sm font-semibold text-charcoal">Day</h3>
            <div className="mt-2 space-y-0.5">
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
                  onClick={() => apply({ ...draft, day: opt.key })}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-surface-muted ${
                    draft.day === opt.key ? 'bg-surface-muted' : ''
                  }`}
                >
                  <div>
                    <div className="text-[15px] font-medium">{opt.label}</div>
                    <div className="text-xs text-muted">{opt.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {open === 'time' && (
          <>
            <h3 className="text-sm font-semibold text-charcoal">Time</h3>
            <div className="mt-2 space-y-0.5">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => apply({ ...draft, time: opt.key })}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-surface-muted ${
                    draft.time === opt.key ? 'bg-surface-muted' : ''
                  }`}
                >
                  <div>
                    <div className="text-[15px] font-medium">{opt.label}</div>
                    {opt.key !== 'any' && <div className="text-xs text-muted">{opt.sub}</div>}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {open === 'age' && (
          <>
            <h3 className="text-sm font-semibold text-charcoal">Age</h3>
            <div className="mt-2 space-y-0.5">
              {AGE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => apply({ ...draft, age: opt.key })}
                  className={`block w-full rounded-lg px-3 py-2.5 text-left text-[15px] hover:bg-surface-muted ${
                    draft.age === opt.key ? 'bg-surface-muted font-semibold' : ''
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}

        {open === 'type' && (
          <>
            <h3 className="text-sm font-semibold text-charcoal">Type</h3>
            <div className="pill-wrap mt-3">
              {ACTIVITY_TYPES.map((type) => {
                const selected = draft.types.includes(type)
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      const types = selected
                        ? draft.types.filter((t) => t !== type)
                        : [...draft.types, type]
                      apply({ ...draft, types })
                    }}
                    className={`pill-select ${selected ? 'pill-select-active' : ''}`}
                  >
                    {type}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </>
  )
}

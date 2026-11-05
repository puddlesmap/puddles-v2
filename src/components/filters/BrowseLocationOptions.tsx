'use client'

import { useState } from 'react'
import type { BrowseFilters } from '../../utils/filters'
import {
  resolveBrowseSearchAnchor,
  type BrowseSearchAnchor,
} from '../../utils/browseSearchAnchor'
import { isNewCityFilter } from '../../config/cityLaunch'
import { NearbyPinIcon } from './DiscoveryFilterChip'
import { BROWSE_LOCATION_OPTIONS } from '../layout/BrandLockup'

type LocationKey = (typeof BROWSE_LOCATION_OPTIONS)[number]['key']

interface BrowseLocationOptionsProps {
  selectedCity: BrowseFilters['city']
  onSelect: (city: LocationKey) => void
  variant: 'sheet' | 'popover'
  /** Experiment: city/ZIP typeahead → ~8 mi search anchor. */
  enableSearchAnchor?: boolean
  searchAnchorLabel?: string | null
  onSearchAnchor?: (anchor: BrowseSearchAnchor | null) => void
}

function LocationLabel({
  cityKey,
  label,
}: {
  cityKey: LocationKey
  label: string
}) {
  const showNew =
    cityKey !== 'nearby' &&
    cityKey !== 'all' &&
    cityKey !== 'other' &&
    isNewCityFilter(cityKey)

  return (
    <span className="flex min-w-0 items-center gap-2">
      {cityKey === 'nearby' ? <NearbyPinIcon tone="brand" /> : null}
      <span className="text-[15px] font-medium text-charcoal">{label}</span>
      {showNew ? <span className="discovery-filter-chip-badge">NEW</span> : null}
    </span>
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

export function BrowseLocationOptions({
  selectedCity,
  onSelect,
  variant,
  enableSearchAnchor = false,
  searchAnchorLabel = null,
  onSearchAnchor,
}: BrowseLocationOptionsProps) {
  const [query, setQuery] = useState('')
  const [hint, setHint] = useState<string | null>(null)

  function tryResolve() {
    const resolved = resolveBrowseSearchAnchor(query)
    if (!resolved) {
      setHint('Try a city name or local ZIP')
      return
    }
    setHint(null)
    onSearchAnchor?.(resolved)
  }

  const suggestion = query.trim() ? resolveBrowseSearchAnchor(query) : null

  return (
    <div className={variant === 'sheet' ? 'space-y-1' : 'space-y-0.5'}>
      {enableSearchAnchor ? (
        <div className="mb-3 space-y-2">
          <label className="flex items-center gap-2 rounded-xl border border-border bg-surface-muted px-3 py-2.5">
            <SearchIcon />
            <input
              className="min-w-0 flex-1 border-none bg-transparent text-[15px] text-charcoal outline-none placeholder:text-muted"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setHint(null)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  tryResolve()
                }
              }}
              placeholder="City or ZIP"
              aria-label="City or ZIP"
              inputMode="search"
            />
          </label>
          {suggestion ? (
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl bg-brand/10 px-3 py-2.5 text-left transition-colors hover:bg-brand/15"
              onClick={() => {
                setHint(null)
                onSearchAnchor?.(suggestion)
              }}
            >
              <span className="text-[14px] font-semibold text-charcoal">
                Near {suggestion.label} · within ~8 mi
              </span>
            </button>
          ) : null}
          {hint ? <p className="px-1 text-xs text-muted">{hint}</p> : null}
          {searchAnchorLabel ? (
            <p className="px-1 text-xs font-medium text-brand-dark">
              Active: Near {searchAnchorLabel}
            </p>
          ) : null}
        </div>
      ) : null}

      {BROWSE_LOCATION_OPTIONS.map((city) => {
        const selected = !searchAnchorLabel && selectedCity === city.key

        if (variant === 'sheet') {
          return (
            <button
              key={city.key}
              type="button"
              onClick={() => onSelect(city.key)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-left transition-colors ${
                selected ? 'bg-surface-muted' : 'hover:bg-surface-muted/70'
              }`}
            >
              <LocationLabel cityKey={city.key} label={city.label} />
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
            key={city.key}
            type="button"
            onClick={() => onSelect(city.key)}
            className={`flex w-full items-center rounded-xl px-3 py-3 text-left text-[15px] transition-colors hover:bg-surface-muted ${
              selected ? 'bg-surface-muted font-semibold' : ''
            }`}
          >
            <LocationLabel cityKey={city.key} label={city.label} />
          </button>
        )
      })}
    </div>
  )
}

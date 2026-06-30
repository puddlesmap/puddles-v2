import type { BrowseFilters } from '../../utils/filters'
import { NearbyPinIcon } from './DiscoveryFilterChip'
import { BROWSE_LOCATION_OPTIONS } from '../layout/BrandLockup'

type LocationKey = (typeof BROWSE_LOCATION_OPTIONS)[number]['key']

interface BrowseLocationOptionsProps {
  selectedCity: BrowseFilters['city']
  onSelect: (city: LocationKey) => void
  variant: 'sheet' | 'popover'
}

export function BrowseLocationOptions({
  selectedCity,
  onSelect,
  variant,
}: BrowseLocationOptionsProps) {
  return (
    <div className={variant === 'sheet' ? 'space-y-1' : 'space-y-0.5'}>
      {BROWSE_LOCATION_OPTIONS.map((city) => {
        const selected = selectedCity === city.key

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
              <div className="flex min-w-0 items-center gap-2">
                {city.key === 'nearby' ? <NearbyPinIcon tone="brand" /> : null}
                <span className="text-[15px] font-medium text-charcoal">{city.label}</span>
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
            key={city.key}
            type="button"
            onClick={() => onSelect(city.key)}
            className={`flex w-full items-center rounded-xl px-3 py-3 text-left text-[15px] transition-colors hover:bg-surface-muted ${
              selected ? 'bg-surface-muted font-semibold' : ''
            }`}
          >
            {city.key === 'nearby' ? (
              <span className="flex items-center gap-2">
                <NearbyPinIcon tone="brand" />
                {city.label}
              </span>
            ) : (
              city.label
            )}
          </button>
        )
      })}
    </div>
  )
}

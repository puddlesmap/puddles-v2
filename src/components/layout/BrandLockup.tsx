import { Logo } from './Logo'

export const BROWSE_LOCATION_OPTIONS = [
  { key: 'nearby', label: 'Nearby' },
  { key: 'all', label: 'All cities' },
  { key: 'Palo Alto', label: 'Palo Alto' },
  { key: 'Los Altos', label: 'Los Altos' },
  { key: 'Mountain View', label: 'Mountain View' },
] as const

/** Shared header brand lockup — sizing and visibility are CSS-only. */
export function BrandLockup({
  logoSrc,
  logoSrc2x,
  showBrandName = true,
}: {
  logoSrc?: string
  logoSrc2x?: string
  showBrandName?: boolean
} = {}) {
  return (
    <div className="brand-lockup">
      <Logo src={logoSrc} src2x={logoSrc2x} />
      <div className="brand-lockup-wordmark">
        {showBrandName ? <span className="logo-main">Puddles</span> : null}
        <span className="brand-lockup-subtitle logo-subtitle">the tot map</span>
      </div>
    </div>
  )
}

export function getBrowseLocationLabel(city: string): string {
  if (city === 'nearby') return 'Nearby'
  if (city === 'all') return 'All cities'
  return city
}

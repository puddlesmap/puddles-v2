import { Logo } from './Logo'

export const BROWSE_LOCATION_OPTIONS = [
  { key: 'nearby', label: 'Nearby' },
  { key: 'Palo Alto', label: 'Palo Alto' },
  { key: 'Los Altos', label: 'Los Altos' },
  { key: 'Mountain View', label: 'Mountain View' },
  { key: 'Sunnyvale', label: 'Sunnyvale' },
  { key: 'other', label: 'Around the Bay' },
  { key: 'all', label: 'All cities' },
] as const

/** Shared header brand lockup — sizing and visibility are CSS-only. */
export function BrandLockup({
  logoSrc,
  logoSrc2x,
  showBrandName = true,
  subtitle = 'the tot map',
  subtitleStyle = 'default',
}: {
  logoSrc?: string
  logoSrc2x?: string
  showBrandName?: boolean
  /** Replaces “the tot map” (e.g. “Guides” on /guides). Default CSS lowercases it. */
  subtitle?: string
  /** `publication` keeps capitalization and uses a product/publication weight. */
  subtitleStyle?: 'default' | 'publication'
} = {}) {
  return (
    <div
      className={[
        'brand-lockup',
        !showBrandName ? 'brand-lockup--wordmark-only' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Logo src={logoSrc} src2x={logoSrc2x} />
      <div className="brand-lockup-wordmark">
        {showBrandName ? <span className="logo-main">Puddles</span> : null}
        <span
          className={[
            'brand-lockup-subtitle',
            'logo-subtitle',
            subtitleStyle === 'publication' ? 'logo-subtitle--publication' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {subtitle}
        </span>
      </div>
    </div>
  )
}

export function getBrowseLocationLabel(city: string): string {
  if (city === 'nearby') return 'Nearby'
  if (city === 'all') return 'All cities'
  if (city === 'other') return 'Around the Bay'
  if (city === 'core') return 'South Peninsula'
  return city
}

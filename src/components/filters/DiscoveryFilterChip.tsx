import type { ReactNode } from 'react'

function NearbyPinIcon({ tone = 'default' }: { tone?: 'default' | 'brand' }) {
  const headFill = tone === 'brand' ? '#66C5F9' : 'url(#nearby-pin-head)'
  const stemStroke = tone === 'brand' ? '#B9E6FC' : '#a8b0b8'
  const gradientId = tone === 'brand' ? undefined : 'nearby-pin-head'

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={[
        'discovery-filter-chip-icon discovery-filter-chip-icon--nearby shrink-0',
        tone === 'brand' ? 'discovery-filter-chip-icon--nearby-brand' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    >
      {gradientId ? (
        <defs>
          <radialGradient id={gradientId} cx="0.32" cy="0.28" r="0.72">
            <stop offset="0%" stopColor="#ff6b63" />
            <stop offset="100%" stopColor="#d12424" />
          </radialGradient>
        </defs>
      ) : null}
      <path
        d="M8 9.35V13.6"
        stroke={stemStroke}
        strokeWidth="1.15"
        strokeLinecap="round"
      />
      <circle cx="8" cy="5.85" r="3.35" fill={headFill} />
      <ellipse cx="7.05" cy="4.95" rx="1.05" ry="0.8" fill="#ffffff" opacity="0.55" />
    </svg>
  )
}

export function DiscoveryFilterChip({
  label,
  sub,
  active,
  onClick,
  icon,
  className = '',
}: {
  label: string
  sub?: string
  active: boolean
  onClick: () => void
  icon?: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'discovery-filter-chip',
        sub ? 'discovery-filter-chip--stacked' : '',
        icon ? 'discovery-filter-chip--with-icon' : '',
        active ? 'discovery-filter-chip-active' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={active}
    >
      {icon ? <span className="discovery-filter-chip-leading">{icon}</span> : null}
      <span className="discovery-filter-chip-label">{label}</span>
      {sub ? <span className="discovery-filter-chip-sub">{sub}</span> : null}
    </button>
  )
}

export { NearbyPinIcon }

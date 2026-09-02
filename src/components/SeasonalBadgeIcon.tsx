export type SeasonalBadgeIcon = 'fall-leaf' | 'halloween-pumpkin'

/** 🍂 — reads clearly at badge size; matches editorial mock reference. */
export function FallLeafIcon({ className }: { className?: string }) {
  return (
    <span
      className={['seasonal-badge__emoji', className].filter(Boolean).join(' ')}
      aria-hidden
    >
      🍂
    </span>
  )
}

/** 🎃 — paired with fall leaf for Halloween Pick. */
export function HalloweenPumpkinIcon({ className }: { className?: string }) {
  return (
    <span
      className={['seasonal-badge__emoji', className].filter(Boolean).join(' ')}
      aria-hidden
    >
      🎃
    </span>
  )
}

export function SeasonalBadgeIcon({
  icon,
  className,
}: {
  icon?: SeasonalBadgeIcon
  className?: string
}) {
  if (icon === 'fall-leaf') return <FallLeafIcon className={className} />
  if (icon === 'halloween-pumpkin') return <HalloweenPumpkinIcon className={className} />
  return null
}

type PillarIconType = 'today-friendly' | 'low-commitment' | 'nearby-moments'

const iconProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

function TodayFriendlyIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

function LowCommitmentIcon() {
  return (
    <svg {...iconProps}>
      <path d="M7 4.5h7.5c.8 0 1.5.7 1.5 1.5V19.5H7V4.5Z" />
      <path d="M8.75 4.5V19.5" />
      <path d="M14.5 12.25h1.75" />
      <path d="M4.5 19.5h15" />
    </svg>
  )
}

function NearbyMomentsIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 21s6-4.2 6-10a6 6 0 1 0-12 0c0 5.8 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  )
}

export function ValuePillarIcon({ type }: { type: PillarIconType }) {
  return (
    <span className="value-pillar-icon">
      {type === 'today-friendly' && <TodayFriendlyIcon />}
      {type === 'low-commitment' && <LowCommitmentIcon />}
      {type === 'nearby-moments' && <NearbyMomentsIcon />}
    </span>
  )
}

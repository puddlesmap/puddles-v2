import type { ReactElement } from 'react'

type EventDetailIconKind = 'time' | 'location' | 'ages' | 'type' | 'cost'

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

function TimeIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7.75V12l2.75 1.75" />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 21s6.5-4.35 6.5-10a6.5 6.5 0 1 0-13 0c0 5.65 6.5 10 6.5 10Z" />
      <circle cx="12" cy="11" r="2.25" />
    </svg>
  )
}

function AgesIcon() {
  return (
    <svg {...iconProps}>
      <path d="M7.25 9.75c0-2.35 2.1-4 4.75-4s4.75 1.65 4.75 4" />
      <path d="M6.5 11.25c-.55 1.35-.85 2.75-.85 4" />
      <path d="M17.5 11.25c.55 1.35.85 2.75.85 4" />
      <circle cx="12" cy="12.75" r="5" />
      <circle cx="10.2" cy="12.25" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="13.8" cy="12.25" r="0.6" fill="currentColor" stroke="none" />
      <path d="M10.1 15.1c.75.7 2.35.7 3.1 0" />
    </svg>
  )
}

function TypeIcon() {
  return (
    <svg {...iconProps}>
      <rect x="5.25" y="14.75" width="6.25" height="4.75" rx="0.75" />
      <rect x="12.5" y="14.75" width="6.25" height="4.75" rx="0.75" />
      <rect x="8.875" y="9.25" width="6.25" height="4.75" rx="0.75" />
    </svg>
  )
}

function CostIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 6.75v10.5" />
      <path d="M14.5 9.25c0-1.25-1.1-2-2.5-2s-2.5.75-2.5 2 1.1 2 2.5 2 2.5.75 2.5 2-1.1 2-2.5 2-2.5-.75-2.5-2" />
    </svg>
  )
}

const ICONS: Record<EventDetailIconKind, () => ReactElement> = {
  time: TimeIcon,
  location: LocationIcon,
  ages: AgesIcon,
  type: TypeIcon,
  cost: CostIcon,
}

interface EventDetailIconProps {
  kind: EventDetailIconKind
  className?: string
}

export function EventDetailIcon({ kind, className = '' }: EventDetailIconProps) {
  const Icon = ICONS[kind]

  return (
    <span className={['event-detail-icon', className].filter(Boolean).join(' ')}>
      <Icon />
    </span>
  )
}

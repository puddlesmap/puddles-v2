import type { ReactElement, ReactNode } from 'react'
import type { EventTipLine, TipIconKind } from '../../utils/eventTips'

/**
 * Lucide outline icons (ISC). Stroke 2, round caps, 24px view box.
 * https://lucide.dev
 */
const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export function BeforeYouGoIcon({ kind }: { kind: TipIconKind }): ReactElement {
  let artwork: ReactNode

  switch (kind) {
    case 'ticket':
      artwork = (
        <>
          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
          <path d="M13 5v2M13 11v2M13 17v2" />
        </>
      )
      break
    case 'baby':
      artwork = (
        <>
          <path d="M9.5 14.5c1.4 1.1 3.6 1.1 5 0" />
          <path d="M19.38 6.81A9 9 0 0 1 20.8 10.2a2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5S14.6 8 13.5 8c-.8 0-1.5-.4-1.5-1" />
        </>
      )
      break
    case 'stroller':
      artwork = (
        <>
          <path d="M3 3h2l2.4 10.2a3 3 0 0 0 2.9 2.3H18a3 3 0 0 0 3-3V8H8" />
          <path d="M8 8a6 6 0 0 1 6-6v6" />
          <circle cx="10" cy="20" r="2" />
          <circle cx="18" cy="20" r="2" />
        </>
      )
      break
    case 'accessibility':
      artwork = (
        <>
          <circle cx="11" cy="4" r="1.5" />
          <path d="M11 7v6h6l2 5M11 10h4" />
          <path d="M14.5 18a5 5 0 1 1-4.5-7.2" />
        </>
      )
      break
    case 'restroom':
      artwork = (
        <>
          <rect x="3" y="2" width="11" height="9" rx="2" />
          <path d="M3 11h18v1a7 7 0 0 1-7 7h-3a8 8 0 0 1-8-8Z" />
          <path d="m10 19-1 3h8l-1-3" />
        </>
      )
      break
    case 'food':
      artwork = (
        <>
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20" />
          <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </>
      )
      break
    case 'weather':
      artwork = (
        <>
          <path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41" />
          <path d="M15.95 12.65a4 4 0 0 0-5.93-4.13M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />
        </>
      )
      break
    case 'crowds':
      artwork = (
        <>
          <path d="M18 21a8 8 0 0 0-16 0" />
          <circle cx="10" cy="8" r="5" />
          <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
        </>
      )
      break
    case 'sound':
      artwork = (
        <>
          <path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5Z" />
          <path d="M16 9a5 5 0 0 1 0 6M19.36 18.36a9 9 0 0 0 0-12.72" />
        </>
      )
      break
    case 'info':
      artwork = (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 12v4M12 8h.01" />
        </>
      )
      break
  }

  const strokeWidth = ['baby', 'accessibility', 'restroom'].includes(kind) ? 2.15 : 2

  return (
    <span className="event-detail-tip-icon">
      <svg {...iconProps} strokeWidth={strokeWidth}>{artwork}</svg>
    </span>
  )
}

export function BeforeYouGoTipItems({ items }: { items: EventTipLine[] }): ReactElement {
  return (
    <>
      {items.map((item, index) => (
        <li
          key={`${index}-${item.text}`}
          className="event-detail-tips-item event-detail-tips-item--icon"
        >
          <BeforeYouGoIcon kind={item.icon ?? 'info'} />
          <span>{item.text}</span>
        </li>
      ))}
    </>
  )
}

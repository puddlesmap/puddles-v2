import type { ReactElement } from 'react'
import type { EventTipLine, TipIconKind } from '../../utils/eventTips'

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export function BeforeYouGoIcon({ kind }: { kind: TipIconKind }): ReactElement {
  return (
    <span className="event-detail-tip-icon">
      {kind === 'crowds' ? (
        <svg {...iconProps}>
          <circle cx="9" cy="8" r="2.25" />
          <path d="M4.75 18.25v-1.1a3.4 3.4 0 0 1 3.4-3.4h1.7a3.4 3.4 0 0 1 3.4 3.4v1.1" />
          <circle cx="16.25" cy="8.75" r="1.85" />
          <path d="M16 13.75a3.1 3.1 0 0 1 3.15 2.6v1.9" />
        </svg>
      ) : null}
      {kind === 'bath' ? (
        <svg {...iconProps}>
          <path d="M5 12.5h14a2 2 0 0 1 2 2V16a2.5 2.5 0 0 1-2.5 2.5H5.5A2.5 2.5 0 0 1 3 16v-1.5a2 2 0 0 1 2-2Z" />
          <path d="M7 12.5V7.75A2.25 2.25 0 0 1 9.25 5.5H10" />
          <path d="M7 18.5v1.25M17 18.5v1.25" />
        </svg>
      ) : null}
      {kind === 'food' ? (
        <svg {...iconProps}>
          <path d="M8 4.5v6.25a1.75 1.75 0 0 1-3.5 0V4.5" />
          <path d="M6.25 4.5v15" />
          <path d="M15.25 4.5c1.6 1.35 2.25 2.7 2.25 4.25 0 1.7-1 2.75-2.25 2.75V19.5" />
          <path d="M15.25 11.5h2.25" />
        </svg>
      ) : null}
      {kind === 'sun' ? (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="3.25" />
          <path d="M12 3.75v1.75M12 18.5v1.75M3.75 12h1.75M18.5 12h1.75M6.1 6.1l1.25 1.25M16.65 16.65l1.25 1.25M17.9 6.1l-1.25 1.25M7.35 16.65l-1.25 1.25" />
        </svg>
      ) : null}
      {kind === 'access' ? (
        <svg {...iconProps}>
          <circle cx="16" cy="4" r="1" />
          <path d="m18 19 1-7-6 1" />
          <path d="m5 8 3-3 5.5 3-2.36 3.5" />
          <path d="M4.24 14.5a5 5 0 0 0 6.88 6" />
          <path d="M13.76 17.5a5 5 0 0 0-6.88-6" />
        </svg>
      ) : null}
      {kind === 'baby' ? (
        <svg {...iconProps}>
          <path d="M9 12h.01" />
          <path d="M15 12h.01" />
          <path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
          <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1" />
        </svg>
      ) : null}
      {kind === 'stroller' ? (
        <svg {...iconProps}>
          <path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z" />
          <path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z" />
          <path d="M16 17h4" />
          <path d="M4 13h4" />
        </svg>
      ) : null}
      {kind === 'ticket' ? (
        <svg {...iconProps}>
          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
          <path d="M13 5v2" />
          <path d="M13 17v2" />
          <path d="M13 11v2" />
        </svg>
      ) : null}
    </span>
  )
}

export function BeforeYouGoTipItems({ items }: { items: EventTipLine[] }): ReactElement {
  return (
    <>
      {items.map((item, index) => (
        <li
          key={`${index}-${item.text}`}
          className={
            item.icon
              ? 'event-detail-tips-item event-detail-tips-item--icon'
              : 'event-detail-tips-item'
          }
        >
          {item.icon ? <BeforeYouGoIcon kind={item.icon} /> : null}
          {item.icon ? <span>{item.text}</span> : item.text}
        </li>
      ))}
    </>
  )
}

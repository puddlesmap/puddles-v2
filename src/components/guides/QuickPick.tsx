import type { ReactNode } from 'react'
import { GuideEventTextLink } from './guideEditorialShared'
import './guideEditorialModules.css'

export function QuickPick({
  category,
  href,
  guideSlug,
  children,
  detail,
}: {
  category: string
  href: string
  guideSlug: string
  /** Linked event name */
  children: ReactNode
  /** One-line explanation after the link */
  detail?: ReactNode
}) {
  return (
    <li>
      <p className="gem-quick">
        <span className="gem-quick__category">{category} </span>
        <GuideEventTextLink href={href} guideSlug={guideSlug} className="gem-quick__link">
          {children}
        </GuideEventTextLink>
        {detail ? <> — {detail}</> : null}
      </p>
    </li>
  )
}

export function QuickPickGroup({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <ul className={`gem-quick-group${className ? ` ${className}` : ''}`}>{children}</ul>
}

export type GuideSectionNavItem = {
  href: string
  label: string
  /** Optional clay / thumb image (design-preview holiday index). */
  imageSrc?: string
}

export function GuideSectionNav({
  title = 'In this guide',
  items,
  id,
}: {
  title?: string
  items: readonly GuideSectionNavItem[]
  id?: string
}) {
  const withImages = items.some((item) => Boolean(item.imageSrc))

  return (
    <nav
      className={withImages ? 'gem-section-nav gem-section-nav--clay' : 'gem-section-nav'}
      id={id}
      aria-label={title}
    >
      <h2>{title}</h2>
      <ul className="gem-section-nav__list">
        {items.map((item) => (
          <li key={item.href}>
            <a href={item.href}>
              {item.imageSrc ? (
                <img className="gem-section-nav__clay" src={item.imageSrc} alt="" decoding="async" />
              ) : null}
              <span className="gem-section-nav__label">{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

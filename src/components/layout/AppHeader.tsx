import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BrandLockup } from './BrandLockup'
import { Logo } from './Logo'
import { TopNav } from './TopNav'

interface AppHeaderProps {
  /** Custom brand lockup (e.g. About page horizontal wordmark). */
  brand?: ReactNode
  /** Logo mark only — no wordmark (home-experiment). */
  logoOnly?: boolean
  /** Override default logo mark image (e.g. home experiment pin mascot). */
  logoSrc?: string
  /** Optional retina variant when logoSrc is set. */
  logoSrc2x?: string
  /** When false, header lockup shows subtitle only (e.g. wordmark logo + "the tot map"). */
  showBrandName?: boolean
  /** Optional right-side control on mobile (e.g. Share close). Hidden on md+. */
  trailing?: ReactNode
  /** Optional content below the brand row inside the same sticky header (e.g. Browse filters). */
  below?: ReactNode
}

/** Global sticky header: brand lockup + top nav. Same layout on every page. */
export function AppHeader({
  brand,
  logoOnly = false,
  logoSrc,
  logoSrc2x,
  showBrandName = true,
  trailing,
  below,
}: AppHeaderProps) {
  return (
    <header className={`app-header page-header-sticky ${logoOnly ? 'app-header--logo-only' : ''}`}>
      <div className="app-header-row layout-container">
        <Link to="/" className="app-header-brand-link" aria-label="Puddles home">
          {brand !== undefined ? (
            brand
          ) : logoOnly ? (
            <Logo src={logoSrc} src2x={logoSrc2x} />
          ) : (
            <BrandLockup logoSrc={logoSrc} logoSrc2x={logoSrc2x} showBrandName={showBrandName} />
          )}
        </Link>
        <TopNav className="app-header-nav hidden md:flex" />
        {trailing ? <div className="app-header-trailing md:hidden">{trailing}</div> : null}
      </div>
      {below}
    </header>
  )
}

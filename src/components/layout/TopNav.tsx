import { NavLink, useLocation } from 'react-router-dom'
import { isPrimaryNavActive } from '../../utils/navActive'

export const TOP_NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/browse', label: 'Browse', end: false },
  { to: '/share', label: 'Share with us', end: false },
  { to: '/about', label: 'About', end: false },
] as const

export function TopNav({ className = '' }: { className?: string }) {
  const location = useLocation()

  return (
    <nav className={`flex shrink-0 items-center gap-1 ${className}`} aria-label="Primary">
      {TOP_NAV_ITEMS.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => {
            const isCurrent =
              isActive || isPrimaryNavActive(to, location.pathname, end)
            return `top-nav-link ${isCurrent ? 'top-nav-link-active' : ''}`
          }}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

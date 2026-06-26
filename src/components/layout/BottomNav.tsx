import { NavLink, useLocation } from 'react-router-dom'
import { isPrimaryNavActive } from '../../utils/navActive'

const tabs = [
  {
    to: '/',
    label: 'Home',
    end: true,
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.75}
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <path d="m16 8-2 6-6 2 2-6 6-2Z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/browse',
    label: 'Browse',
    end: false,
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.75}
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/share',
    label: 'Share with us',
    end: false,
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.75}
        aria-hidden
      >
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/about',
    label: 'About',
    end: false,
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.75}
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 10v6M12 7h.01" strokeLinecap="round" />
      </svg>
    ),
  },
] as const

export function BottomNav() {
  const location = useLocation()

  return (
    <nav
      className="bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="bottom-nav-inner layout-container flex w-full">
        {tabs.map(({ to, label, end, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => {
              const active =
                isActive || isPrimaryNavActive(to, location.pathname, end)
              return `bottom-nav-item flex flex-1 flex-col items-center justify-center gap-1 px-2 py-2.5 transition-colors ${
                active ? 'bottom-nav-item-active' : 'text-muted'
              }`
            }}
          >
            {({ isActive }) => {
              const active =
                isActive || isPrimaryNavActive(to, location.pathname, end)
              return (
              <>
                {icon(active)}
                <span
                  className={`text-center text-[11px] leading-tight ${
                    active ? 'font-semibold' : 'font-medium'
                  }`}
                >
                  {label}
                </span>
              </>
            )}}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

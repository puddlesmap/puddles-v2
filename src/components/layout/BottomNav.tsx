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
        <path
          d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    to: '/saved',
    label: 'Saved',
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
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: '/guides',
    label: 'Guides',
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
        <path
          d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"
          strokeLinejoin="round"
        />
        <path
          d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
] as const

export function BottomNav() {
  const location = useLocation()

  return (
    <nav
      className="bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-border md:hidden"
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
                active ? 'bottom-nav-item-active text-brand' : 'text-muted'
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
                    active ? 'font-semibold text-brand' : 'font-medium'
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

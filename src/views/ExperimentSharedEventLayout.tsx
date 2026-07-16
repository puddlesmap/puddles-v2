import { Link, Outlet } from 'react-router-dom'

export function ExperimentSharedEventLayout() {
  return (
    <div className="experiment-shared-event-layout experiment-shared-event-shell">
      <Outlet />
    </div>
  )
}

export function ExperimentSharedEventNote({ children }: { children?: React.ReactNode }) {
  return (
    <p className="experiment-shared-event-note">
      {children ?? (
        <>
          Shared event URL experiment — first-time visitor experience for direct /event links.{' '}
          <Link to="/" className="experiment-shared-event-note__link">
            Back to live site
          </Link>
        </>
      )}
    </p>
  )
}

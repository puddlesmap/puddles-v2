import { Link, Outlet } from 'react-router-dom'
import { ExperimentLifecycleProvider } from '../context/ExperimentLifecycleContext'

export function ExperimentExpiredActivityLayout() {
  return (
    <ExperimentLifecycleProvider>
      <div className="experiment-expired-activity-layout">
        <Outlet />
      </div>
    </ExperimentLifecycleProvider>
  )
}

export function ExperimentExpiredActivityNote({ children }: { children?: React.ReactNode }) {
  return (
    <p className="experiment-expired-activity-note">
      {children ?? (
        <>
          Expired activity experiment — lifecycle discovery and ended detail states.{' '}
          <Link to="/" className="experiment-expired-activity-note__link">
            Back to live site
          </Link>
        </>
      )}
    </p>
  )
}

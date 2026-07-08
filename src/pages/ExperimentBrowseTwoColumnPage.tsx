import { Navigate } from 'react-router-dom'

/** Former experiment route — 2-column Browse is now live at /browse */
export function ExperimentBrowseTwoColumnPage() {
  return <Navigate to="/browse" replace />
}

import { Link } from 'react-router-dom'
import { PageContainer } from '../components/layout/PageContainer'

export function MaintenancePage() {
  return (
    <div className="visitor-status-shell">
      <PageContainer className="visitor-status-page">
        <img
          src="/maintenance-pin.png"
          alt=""
          className="visitor-status-art"
          width={176}
          height={220}
          decoding="async"
        />

        <h1 className="visitor-status-title">We&apos;re refreshing the map.</h1>
        <p className="visitor-status-lead">
          Puddles is taking a short pause while we make a few updates. Please check back soon.
        </p>

        <div className="visitor-status-actions">
          <Link to="/" className="btn-primary visitor-status-btn">
            Back to Home
          </Link>
          <Link to="/browse" className="btn-secondary visitor-status-btn">
            Search activities
          </Link>
        </div>
      </PageContainer>
    </div>
  )
}

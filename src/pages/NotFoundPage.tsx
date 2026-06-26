import { Link } from 'react-router-dom'
import { PageContainer } from '../components/layout/PageContainer'

export function NotFoundPage() {
  return (
    <div className="visitor-status-shell">
      <PageContainer className="visitor-status-page">
        <img
          src="/not-found-pin.png"
          alt=""
          className="visitor-status-art"
          width={176}
          height={220}
          decoding="async"
        />

        <h1 className="visitor-status-title">Looks like you&apos;ve taken a wrong turn.</h1>
        <p className="visitor-status-lead">Let&apos;s get you back to the map.</p>

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

import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { formatDocumentTitle, setPageTitle } from '../utils/siteMeta'
import '../views/experiment-hallmark-mockup.css'

const HALLMARK_HTML_PATH = '/experiment/hallmark-home-preview.html'

export function ExperimentHallmarkHomeMockupPage() {
  const location = useLocation()

  useEffect(() => {
    setPageTitle(formatDocumentTitle('Hallmark Home Mockup'), location.pathname)
  }, [location.pathname])

  return (
    <div className="hallmark-mockup-host">
      <header className="hallmark-mockup-host__bar">
        <div className="hallmark-mockup-host__bar-inner layout-container">
          <div>
            <p className="hallmark-mockup-host__eyebrow">Hallmark · design skill test</p>
            <h1 className="hallmark-mockup-host__title">Puddles home mockup</h1>
          </div>
          <nav className="hallmark-mockup-host__links" aria-label="Mockup links">
            <Link to="/experiment/hallmark-hello-fall-mockup">Hello Fall mockup</Link>
            <Link to="/experiment/home-launch-preview">Production reference</Link>
            <a href={HALLMARK_HTML_PATH} target="_blank" rel="noopener noreferrer">
              Open HTML
            </a>
          </nav>
        </div>
      </header>

      <p className="hallmark-mockup-host__note layout-container">
        Standalone artifact at{' '}
        <code className="hallmark-mockup-host__code">{HALLMARK_HTML_PATH}</code>. Edit the HTML or
        prompt Hallmark with <code className="hallmark-mockup-host__code">.hallmark/brief.md</code>.
        Refresh this page after changes.
      </p>

      <iframe
        className="hallmark-mockup-host__frame"
        src={HALLMARK_HTML_PATH}
        title="Hallmark Puddles home mockup"
      />
    </div>
  )
}

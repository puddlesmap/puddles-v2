import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { formatDocumentTitle, setPageTitle } from '../utils/siteMeta'
import '../views/experiment-hallmark-mockup.css'

const HALLMARK_HTML_PATH = '/experiment/hallmark-hello-fall-preview.html'

export function ExperimentHallmarkHelloFallMockupPage() {
  const location = useLocation()

  useEffect(() => {
    setPageTitle(formatDocumentTitle('Hallmark Hello Fall Mockup'), location.pathname)
  }, [location.pathname])

  return (
    <div className="hallmark-mockup-host">
      <header className="hallmark-mockup-host__bar">
        <div className="hallmark-mockup-host__bar-inner layout-container">
          <div>
            <p className="hallmark-mockup-host__eyebrow">Hallmark · design skill test</p>
            <h1 className="hallmark-mockup-host__title">Hello Fall collection mockup</h1>
          </div>
          <nav className="hallmark-mockup-host__links" aria-label="Mockup links">
            <Link to="/experiment/hallmark-home-mockup">Home mockup</Link>
            <Link to="/experiment/seasonal-discovery/hello-fall">Production reference</Link>
            <a href={HALLMARK_HTML_PATH} target="_blank" rel="noopener noreferrer">
              Open HTML
            </a>
          </nav>
        </div>
      </header>

      <p className="hallmark-mockup-host__note layout-container">
        Standalone artifact at{' '}
        <code className="hallmark-mockup-host__code">{HALLMARK_HTML_PATH}</code>. Use the sticky{' '}
        <strong>Background wash</strong> strip in the iframe to compare warmer orange fall backgrounds
        (Current → Pumpkin). Fine-tune further on{' '}
        <Link to="/experiment/seasonal-bg-dial">seasonal bg dial</Link>. Refresh after HTML edits.
      </p>

      <iframe
        className="hallmark-mockup-host__frame"
        src={HALLMARK_HTML_PATH}
        title="Hallmark Puddles Hello Fall collection mockup"
      />
    </div>
  )
}

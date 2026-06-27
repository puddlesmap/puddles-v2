import { Link } from 'react-router-dom'
import { AboutPage } from './AboutPage'

export function TypographyExperimentAboutPage() {
  return (
    <AboutPage
      shellClassName="typography-experiment-shell"
      experimentNote={
        <p className="typography-experiment-note">
          Typography experiment — Share-style hero title, no &ldquo;About&rdquo; eyebrow.{' '}
          <Link to="/about" className="typography-experiment-note-link">
            view current About
          </Link>
        </p>
      }
    />
  )
}

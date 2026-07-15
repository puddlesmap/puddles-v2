import { Link } from 'react-router-dom'
import { WelcomeOnboarding } from '../components/welcome/WelcomeOnboarding'
import { HomeExperimentPage } from './HomeExperimentPage'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'

export function ExperimentWelcomePage() {
  return (
    <div className="experiment-welcome-shell">
      <HomeExperimentPage
        pageClassName="home-experiment-page--refined"
        shellClassName="home-experiment-shell--refined experiment-welcome-home"
        heroVariant="refined"
        layout="refined"
        logoOnly={false}
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
        trailing={
          <p className="experiment-welcome-note">
            Internal harness for the production welcome + floating CTA flow.{' '}
            <Link to="/" className="experiment-welcome-note-link">
              Back to live Home
            </Link>
          </p>
        }
      />

      {/* Separate experiment storage so tester resets do not clear live visitors. */}
      <WelcomeOnboarding experiment showTesterControls />
    </div>
  )
}

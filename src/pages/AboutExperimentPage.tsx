import { Link } from 'react-router-dom'
import { PageContainer } from '../components/layout/PageContainer'
import { Footer } from '../components/layout/Footer'
import { AppHeader } from '../components/layout/AppHeader'
import { AboutPageContent } from './AboutPageContent'
import { AboutStoryIntro } from '../components/about/AboutStoryIntro'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'

export function AboutExperimentPage() {
  return (
    <div className="about-page-shell about-experiment-shell">
      <AppHeader
        logoSrc={PUDDLES_WORDMARK_LOGO_SRC}
        logoSrc2x={PUDDLES_WORDMARK_LOGO_SRC_2X}
        showBrandName={false}
      />
      <div className="about-story-band">
        <PageContainer className="about-page about-page--story pb-0">
          <div className="about-main">
            <AboutStoryIntro />
          </div>
        </PageContainer>
      </div>
      <PageContainer className="about-page about-page--body pb-0">
        <AboutPageContent
          trailing={
            <p className="about-experiment-note">
              Experimental about page —{' '}
              <Link to="/about" className="about-experiment-note-link">
                view current About
              </Link>
            </p>
          }
        />
      </PageContainer>

      <Footer fullBleed className="mt-0" />
    </div>
  )
}

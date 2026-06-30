import type { ReactNode } from 'react'
import { PageContainer } from '../components/layout/PageContainer'
import { Footer } from '../components/layout/Footer'
import { AppHeader } from '../components/layout/AppHeader'
import { AboutPageContent } from './AboutPageContent'
import { AboutStoryIntro } from '../components/about/AboutStoryIntro'
import { ExpansionWatch } from '../components/expansion-watch/ExpansionWatch'
import { PUDDLES_WORDMARK_LOGO_SRC, PUDDLES_WORDMARK_LOGO_SRC_2X } from './experimentShared'

interface AboutPageProps {
  shellClassName?: string
  experimentNote?: ReactNode
}

export function AboutPage({ shellClassName, experimentNote }: AboutPageProps = {}) {
  return (
    <div className={['about-page-shell', shellClassName].filter(Boolean).join(' ')}>
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
            <>
              <ExpansionWatch
                sourceContext="footer_about"
                className="about-expansion-watch"
              />
              {experimentNote}
            </>
          }
        />
      </PageContainer>

      <Footer fullBleed className="mt-0" />
    </div>
  )
}

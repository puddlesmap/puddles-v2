import { AboutIllustration } from '../AboutIllustration'
import { AboutIntroNarrative } from './AboutIntroNarrative'
import {
  ABOUT_EYEBROW,
  ABOUT_HERO_ART,
  ABOUT_LEAD_LINES,
  ABOUT_MISSION_SUPPORT,
} from '../../pages/aboutShared'

export function AboutStoryIntro() {
  return (
    <header className="about-intro">
      <p className="about-eyebrow">{ABOUT_EYEBROW}</p>
      <div className="about-mission">
        <h1 className="about-tagline">
          It takes a <span className="about-tagline-accent">village</span> — here&apos;s
          where to find it.
        </h1>
        <p className="about-mission-support">{ABOUT_MISSION_SUPPORT}</p>
      </div>
      <div className="about-intro-body">
        <div className="about-intro-copy">
          <p className="about-intro-lead">
            {ABOUT_LEAD_LINES.map((line) => (
              <span key={line} className="about-intro-lead-line">
                {line}
              </span>
            ))}
          </p>
          <AboutIntroNarrative />
        </div>
        <div className="about-intro-art-wrap">
          <AboutIllustration
            src={ABOUT_HERO_ART.src}
            src2x={ABOUT_HERO_ART.src2x}
            intrinsicWidth={ABOUT_HERO_ART.width}
            intrinsicHeight={ABOUT_HERO_ART.height}
            displayWidth={ABOUT_HERO_ART.displayWidth}
            sizes="(max-width: 639px) 8.25rem, (max-width: 1023px) 10.625rem, 18.75rem"
            className="about-intro-art"
            loading="eager"
          />
        </div>
      </div>
    </header>
  )
}

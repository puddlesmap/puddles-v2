import { ABOUT_INTRO_NARRATIVE } from '../../pages/aboutShared'

export function AboutIntroNarrative() {
  return (
    <div className="about-intro-narrative">
      {ABOUT_INTRO_NARRATIVE.map((paragraph) => (
        <p key={paragraph} className="about-intro-narrative-para">
          {paragraph}
        </p>
      ))}
    </div>
  )
}

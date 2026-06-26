import {
  ABOUT_NARRATIVE_AFTER_MUSIC,
  ABOUT_NARRATIVE_CLOSE,
  ABOUT_NARRATIVE_MIDDLE,
  ABOUT_NARRATIVE_OPEN,
} from '../../pages/aboutShared'

export function AboutIntroNarrative() {
  return (
    <div className="about-intro-narrative">
      <p className="about-intro-narrative-para">
        {ABOUT_NARRATIVE_OPEN}
        <br className="about-narrative-break about-narrative-break--desktop" aria-hidden="true" />
        {ABOUT_NARRATIVE_MIDDLE}{' '}
        <br className="about-narrative-break about-narrative-break--mobile" aria-hidden="true" />
        {ABOUT_NARRATIVE_AFTER_MUSIC}
        {ABOUT_NARRATIVE_CLOSE}
      </p>
    </div>
  )
}

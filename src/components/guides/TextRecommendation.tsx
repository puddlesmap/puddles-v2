import { GuideRecBody, type GuideRecBaseProps } from './guideEditorialShared'
import './guideEditorialModules.css'

export function TextRecommendation(props: GuideRecBaseProps) {
  return (
    <article className="lgg-out gem-text">
      <GuideRecBody {...props} />
    </article>
  )
}

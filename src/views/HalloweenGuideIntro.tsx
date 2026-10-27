import { Link } from 'react-router-dom'
import {
  HALLOWEEN_COLLECTION_PATH,
  HALLOWEEN_EVENTS_HREF,
  HALLOWEEN_GUIDE_POSTED,
  HALLOWEEN_GUIDE_READ,
} from '../data/halloweenGuide'
import { HALLOWEEN_GUIDE_SECTION_CARDS } from '../data/halloweenGuideSectionCards'

export function HalloweenGuideIntro({
  idPrefix,
  indexId,
}: {
  idPrefix: string
  indexId: string
}) {
  return (
    <div className="gct-gutter">
      <Link className="guide-page__back" to={HALLOWEEN_COLLECTION_PATH}>
        ← Explore Halloween events
      </Link>
      <header className="gct-abn-head">
        <time>
          {HALLOWEEN_GUIDE_POSTED.replace(/^Posted /, '')}
          <span className="gct-abn-read"> · {HALLOWEEN_GUIDE_READ}</span>
        </time>
        <h1>Halloween with Little Ones</h1>
        <p>
          Halloween falls on Saturday, October 31 this year, but the fun starts well before.
          Parades, patches, and trick-or-treat plans for ages 0–5 on the South Peninsula.
        </p>
        <Link className="gct-abn-pill" to={HALLOWEEN_EVENTS_HREF}>
          Browse events
        </Link>
      </header>
      <nav className="gct-index gct-index--thumbs" id={indexId} aria-label="In this guide">
        <h2>In this guide</h2>
        <ul>
          {HALLOWEEN_GUIDE_SECTION_CARDS.map((card) => (
            <li key={card.slug}>
              <a href={`#${idPrefix}-${card.slug}`}>
                <img src={card.image} alt="" style={{ objectPosition: card.focus }} />
                <span>
                  <time>{card.date}</time>
                  <h3>{card.title}</h3>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Footer } from '../components/layout/Footer'
import {
  GuideHomeAirbnbFeed,
  GuideHomeAirbnbNews,
  GuideHomeBalletHome,
  GuideHomeBalletSeason,
  GuideHomeHybrid,
} from './guidesHomeMockups/GuideHomeVariants'
import {
  MobileFeaturedMockupBody,
  type MobileFeaturedMockupId,
} from './guidesHomeMockups/MobileFeaturedMockups'
import './experiment-guides-home-mockups.css'
import './guidesHomeMockups/mobile-featured-mockups.css'

const MOCKUPS = [
  {
    id: 'magazine',
    name: 'A · Magazine',
    ref: 'Mobile featured',
    note: 'Tall full-bleed cover · copy on bottom gradient',
    kind: 'mobile-featured' as const,
  },
  {
    id: 'photo-lead',
    name: 'B · Photo lead',
    ref: 'Mobile featured',
    note: 'Large photo first · title + Read guide row',
    kind: 'mobile-featured' as const,
  },
  {
    id: 'overlap',
    name: 'C · Overlap',
    ref: 'Mobile featured',
    note: 'Tall photo · solid panel overlapping lower third',
    kind: 'mobile-featured' as const,
  },
  {
    id: 'airbnb',
    name: '1 · Airbnb hero',
    ref: 'news.airbnb.com hero',
    note: '80px gutters · right-bleed photo · pink pill · no shadow',
    kind: 'home' as const,
  },
  {
    id: 'feed',
    name: '2 · Airbnb feed',
    ref: 'Latest + Exclusive + tabs',
    note: '4-up teasers · 24px radius · season tabs',
    kind: 'home' as const,
  },
  {
    id: 'ballet',
    name: '3 · Ballet home',
    ref: 'sfballet.org home',
    note: 'Full-bleed stacked panels · uppercase · white pills',
    kind: 'home' as const,
  },
  {
    id: 'season',
    name: '4 · Ballet season',
    ref: 'SFB 12-col posters',
    note: '4:5 posters · date over title · 3-up grid',
    kind: 'home' as const,
  },
  {
    id: 'hybrid',
    name: '5 · Hybrid',
    ref: 'Ballet panel + Airbnb grid',
    note: 'Featured overlay, then Newsroom latest',
    kind: 'home' as const,
  },
] as const

type MockupId = (typeof MOCKUPS)[number]['id']

function HomeMockupBody({ id }: { id: Exclude<MockupId, MobileFeaturedMockupId> }) {
  switch (id) {
    case 'airbnb':
      return <GuideHomeAirbnbNews />
    case 'feed':
      return <GuideHomeAirbnbFeed />
    case 'ballet':
      return <GuideHomeBalletHome />
    case 'season':
      return <GuideHomeBalletSeason />
    case 'hybrid':
      return <GuideHomeHybrid />
  }
}

function MockupBody({ id }: { id: MockupId }) {
  const meta = MOCKUPS.find((item) => item.id === id) ?? MOCKUPS[0]
  if (meta.kind === 'mobile-featured') {
    return (
      <div className="mfm-frame">
        <p className="mfm-frame__label">Phone width · {meta.name}</p>
        <MobileFeaturedMockupBody id={id as MobileFeaturedMockupId} />
      </div>
    )
  }
  return <HomeMockupBody id={id as Exclude<MockupId, MobileFeaturedMockupId>} />
}

export function ExperimentGuidesHomeMockupsPage() {
  const [mockup, setMockup] = useState<MockupId>('magazine')
  const current = MOCKUPS.find((item) => item.id === mockup) ?? MOCKUPS[0]

  return (
    <>
      <div className="ghm-lab" role="region" aria-label="Guides home mockups">
        <div className="ghm-lab__inner">
          <p className="ghm-lab__tag">
            {current.ref} — {current.note}
          </p>
          <div className="ghm-lab__buttons">
            {MOCKUPS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={mockup === item.id ? 'is-on' : undefined}
                aria-pressed={mockup === item.id}
                onClick={() => {
                  setMockup(item.id)
                  window.scrollTo({ top: 0, behavior: 'instant' })
                }}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ghm-shell">
        <MockupBody id={mockup} />
        <Footer fullBleed className="mt-0" />
      </div>

      <p className="ghm-lab__tag" style={{ textAlign: 'center', padding: '1rem', background: '#111' }}>
        Live directory:{' '}
        <Link to="/guides" style={{ color: '#ffd6a8' }}>
          /guides
        </Link>
        {' · '}
        Mobile featured A–C are preview only
      </p>
    </>
  )
}

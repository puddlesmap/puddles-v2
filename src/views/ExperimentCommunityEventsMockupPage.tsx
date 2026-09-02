import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AppHeader } from '../components/layout/AppHeader'
import { PageContainer } from '../components/layout/PageContainer'
import { Footer } from '../components/layout/Footer'
import './experiment-community-events-mockup.css'

type MockApproach = 1 | 2 | 3

interface MockFixture {
  id: string
  title: string
  /** Why little ones might like it — shown in §3 (and detail snippet). */
  whyForLittleOnes: string
  /** Type shown in §1 (today / generic). */
  typeToday: string
  /** Type shown in §2–3. */
  typeFestivals: string
  city: string
  dateLabel: string
  costLabel: string
  imageUrl: string
  ageToday: string
  ageBroader: string
  note?: string
}

const ACTIVITY_CHIPS = [
  'Stories',
  'Music & Movement',
  'Arts & Crafts',
  'Build & Explore',
  'Outdoor',
  'Social & Play',
  'Festivals & Community',
  'Classes',
] as const

const FIXTURES: MockFixture[] = [
  {
    id: 'mv-art-wine',
    title: 'Mountain View Art & Wine Festival',
    whyForLittleOnes: 'Kids Zone with face painting, trampolines & more',
    typeToday: 'Other',
    typeFestivals: 'Community',
    city: 'Mountain View',
    dateLabel: 'Sat–Sun · Sep 12–13',
    costLabel: 'Free',
    imageUrl: '/event-fallbacks/outdoor.png',
    ageToday: 'All ages',
    ageBroader: 'All ages · Little ones welcome',
  },
  {
    id: 'me-food-fest',
    title: 'Middle Eastern Food Festival',
    whyForLittleOnes: 'Kids Zone, music, dancing & family entertainment',
    typeToday: 'Other',
    typeFestivals: 'Community',
    city: 'Los Altos Hills',
    dateLabel: 'Sat–Sun · Sep 12–13',
    costLabel: 'Free',
    imageUrl: '/event-fallbacks/play.png',
    ageToday: 'All ages',
    ageBroader: 'All ages · Little ones welcome',
  },
  {
    id: 'art-studios-open-house',
    title: 'Art Studios Open House',
    whyForLittleOnes: 'Explore the studios, meet artists & see how art gets made',
    typeToday: 'Arts & Crafts',
    typeFestivals: 'Arts & Crafts',
    city: 'Palo Alto',
    dateLabel: 'Wed · Sep 2 · 4–7pm',
    costLabel: 'Free',
    imageUrl: '/event-fallbacks/arts.png',
    ageToday: 'All ages',
    ageBroader: 'All ages · Little ones welcome',
    note: 'More specific type still wins — stays Arts & Crafts in §2–3.',
  },
  {
    id: 'zucchini-race',
    title: 'Zucchini Car Race at Farmers Market',
    whyForLittleOnes: 'Watch zucchini cars race — a short, playful market activation',
    typeToday: 'Other',
    typeFestivals: 'Community',
    city: 'Mountain View',
    dateLabel: 'Sun · morning',
    costLabel: 'Free',
    imageUrl: '/event-fallbacks/outdoor.png',
    ageToday: 'All ages',
    ageBroader: 'All ages · Little ones welcome',
    note: 'Market alone = no. Kids activation at the market = yes.',
  },
]

const FEATURED_DETAIL = FIXTURES[0]

function typeForApproach(fixture: MockFixture, approach: MockApproach): string {
  return approach === 1 ? fixture.typeToday : fixture.typeFestivals
}

function ageForApproach(fixture: MockFixture, approach: MockApproach): string {
  return approach === 3 ? fixture.ageBroader : fixture.ageToday
}

function CommunityMockCard({
  fixture,
  approach,
}: {
  fixture: MockFixture
  approach: MockApproach
}) {
  const typeLabel = typeForApproach(fixture, approach)
  const showAgeOnCard = approach !== 3

  return (
    <article className="cem-card">
      <div className="cem-card__media">
        <img src={fixture.imageUrl} alt="" className="cem-card__image" loading="lazy" />
        <div className="cem-card__pills" aria-hidden>
          {typeLabel !== 'Other' ? (
            <span className="cem-card__pill cem-card__pill--category">{typeLabel}</span>
          ) : null}
          {showAgeOnCard ? (
            <span className="cem-card__pill">{ageForApproach(fixture, approach)}</span>
          ) : null}
          <span className="cem-card__pill cem-card__pill--free">{fixture.costLabel}</span>
        </div>
      </div>
      <div className="cem-card__body">
        <p className="cem-card__meta">{fixture.dateLabel}</p>
        <h3 className="cem-card__title">{fixture.title}</h3>
        <p className="cem-card__location">{fixture.city}</p>
        {fixture.note && approach === 1 ? <p className="cem-card__note">{fixture.note}</p> : null}
      </div>
    </article>
  )
}

function CommunityEventDetailDesktopMock({ fixture }: { fixture: MockFixture }) {
  return (
    <div className="cem-detail-mock cem-detail-mock--desktop" aria-label="Desktop event page">
      <p className="cem-detail-mock__frame-label">Desktop · event page</p>
      <div className="cem-detail-mock__desktop-shell">
        <div className="cem-detail-mock__hero">
          <img src={fixture.imageUrl} alt="" className="cem-detail-mock__hero-img" />
        </div>
        <div className="cem-detail-mock__desktop-body">
          <div className="cem-detail-mock__main">
            <h1 className="cem-detail-mock__title">{fixture.title}</h1>
            <p className="cem-detail-mock__subtitle">{fixture.whyForLittleOnes}</p>
            <div className="cem-detail-mock__row">
              <span className="cem-detail-mock__icon" aria-hidden>
                🕐
              </span>
              <div>
                <p className="cem-detail-mock__row-primary">Saturday, September 12</p>
                <p className="cem-detail-mock__row-muted">11:00 AM – 7:00 PM</p>
              </div>
            </div>
            <div className="cem-detail-mock__row">
              <span className="cem-detail-mock__icon" aria-hidden>
                📍
              </span>
              <div>
                <p className="cem-detail-mock__row-primary">Castro Street</p>
                <p className="cem-detail-mock__row-muted">{fixture.city}</p>
              </div>
            </div>
          </div>
          <ProductionCtaRail fixture={fixture} />
        </div>
      </div>
    </div>
  )
}

function CommunityEventDetailMobileMock({ fixture }: { fixture: MockFixture }) {
  return (
    <div className="cem-detail-mock cem-detail-mock--mobile" aria-label="Mobile event page">
      <p className="cem-detail-mock__frame-label">Mobile · event page</p>
      <div className="cem-detail-mock__mobile-shell">
        <div className="cem-detail-mock__hero cem-detail-mock__hero--mobile">
          <img src={fixture.imageUrl} alt="" className="cem-detail-mock__hero-img" />
        </div>
        <div className="cem-detail-mock__mobile-body">
          <h1 className="cem-detail-mock__title">{fixture.title}</h1>
          <p className="cem-detail-mock__subtitle">{fixture.whyForLittleOnes}</p>
          <div className="cem-detail-mock__row">
            <span className="cem-detail-mock__icon" aria-hidden>
              🕐
            </span>
            <div>
              <p className="cem-detail-mock__row-primary">Saturday, September 12</p>
              <p className="cem-detail-mock__row-muted">11:00 AM – 7:00 PM</p>
            </div>
          </div>
          <div className="cem-detail-mock__row">
            <span className="cem-detail-mock__icon" aria-hidden>
              📍
            </span>
            <div>
              <p className="cem-detail-mock__row-primary">Castro Street</p>
              <p className="cem-detail-mock__row-muted">{fixture.city}</p>
            </div>
          </div>
          <div className="cem-detail-mock__row cem-detail-mock__row--ages">
            <span className="cem-detail-mock__icon" aria-hidden>
              👶
            </span>
            <div>
              <p className="cem-detail-mock__field-label">Ages</p>
              <p className="cem-detail-mock__ages-value">{fixture.ageBroader}</p>
            </div>
          </div>
          <div className="cem-detail-mock__mobile-cta">
            <button type="button" className="btn-primary">
              Add to calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductionCtaRail({ fixture }: { fixture: MockFixture }) {
  return (
    <aside className="cem-detail-mock__rail" aria-label="Save this activity">
      <p className="cem-detail-mock__rail-cost">{fixture.costLabel}</p>
      <p className="cem-detail-mock__rail-age">{fixture.ageBroader}</p>
      <p className="cem-detail-mock__rail-when">
        Saturday, September 12
        <br />
        11:00 AM to 7:00 PM
      </p>
      <p className="cem-detail-mock__rail-where">Castro Street</p>
      <div className="cem-detail-mock__rail-actions">
        <button type="button" className="btn-primary">
          Add to calendar
        </button>
        <button type="button" className="btn-secondary">
          Visit official page
        </button>
      </div>
    </aside>
  )
}

function CommunityEventDetailMocks() {
  return (
    <div className="cem-detail-mocks">
      <header className="cem-detail-mocks__header">
        <p className="cem-detail-mocks__eyebrow">Event page mockup</p>
        <h3 className="cem-detail-mocks__title">{FEATURED_DETAIL.title}</h3>
        <p className="cem-detail-mocks__lede">
          Toddler-reason subtitle on the event page only — directly under the title. Desktop CTA rail
          uses production hierarchy: Cost → Age → When → Where → CTAs. Mobile age guidance stays in
          the Ages row.
        </p>
        <ol className="cem-detail-mocks__hierarchy" aria-label="Desktop CTA information order">
          <li>Cost</li>
          <li>Age</li>
          <li>When</li>
          <li>Where</li>
          <li>Buttons</li>
        </ol>
      </header>
      <div className="cem-detail-mocks__grid">
        <CommunityEventDetailDesktopMock fixture={FEATURED_DETAIL} />
        <CommunityEventDetailMobileMock fixture={FEATURED_DETAIL} />
      </div>
    </div>
  )
}

function ApproachSection({
  approach,
  title,
  lede,
  children,
}: {
  approach: MockApproach
  title: string
  lede: string
  children?: ReactNode
}) {
  return (
    <section className="cem-section" aria-labelledby={`cem-approach-${approach}`}>
      <header className="cem-section__header">
        <p className="cem-section__eyebrow">Approach {approach}</p>
        <h2 id={`cem-approach-${approach}`} className="cem-section__title">
          {title}
        </h2>
        <p className="cem-section__lede">{lede}</p>
      </header>
      {children}
      <div className="cem-card-grid">
        {FIXTURES.map((fixture) => (
          <CommunityMockCard key={`${approach}-${fixture.id}`} fixture={fixture} approach={approach} />
        ))}
      </div>
      {approach === 3 ? <CommunityEventDetailMocks /> : null}
    </section>
  )
}

export function ExperimentCommunityEventsMockupPage() {
  return (
    <div className="cem-shell">
      <AppHeader />
      <PageContainer className="cem-page">
        <header className="cem-hero">
          <p className="cem-hero__eyebrow">Internal review · not live</p>
          <h1 className="cem-hero__title">Community events — mockup</h1>
          <p className="cem-hero__lede">
            Compare three approaches before deploying. Production home and browse are unchanged.
          </p>
          <Link to="/" className="cem-hero__back">
            Back to Home
          </Link>
        </header>

        <aside className="cem-callout" aria-label="Inclusion rules">
          <p className="cem-callout__quote">
            Puddles includes events that give little ones something meaningful to do — not simply
            events where children are welcome.
          </p>
          <p className="cem-callout__rule">
            <strong>Farmers markets:</strong> the market itself is not an event. A special kids
            activation at the market can be.
          </p>
          <p className="cem-callout__docs">
            Full brief: <code>docs/community-events-inclusion.md</code>
          </p>
        </aside>

        <ApproachSection
          approach={1}
          title="Guidance only (today’s UI)"
          lede="Inclusion rules live as docs/rules. Cards stay as they are today: title + pills, no toddler-reason subtitle. Broader festivals often land on Other."
        />

        <ApproachSection
          approach={2}
          title="Add Festivals & Community"
          lede="Same cards, but the primary type is Festivals & Community when nothing more specific fits. No Family Friendly filter — the type joins the existing Activity Type list."
        >
          <div className="cem-chips" role="list" aria-label="Mock activity type filter">
            {ACTIVITY_CHIPS.map((chip) => (
              <span
                key={chip}
                role="listitem"
                className={[
                  'cem-chip',
                  chip === 'Festivals & Community' ? 'cem-chip--selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {chip}
              </span>
            ))}
          </div>
        </ApproachSection>

        <ApproachSection
          approach={3}
          title="Event page subtitle + production CTA"
          lede="Chosen direction: title-only browse cards, toddler-reason subtitle on the event page, All ages · Little ones welcome in the age slot, and desktop CTA rail in production hierarchy (Cost → Age → When → Where → CTAs)."
        />

        <footer className="cem-footer-note">
          <p>
            Shipped in product: ActivityType · Festivals & Community + Parent & Me (browse filter + admin + fallbacks).
            Still out of scope here: hidden tags schema, production
            filters, live sheet rewrites.
          </p>
        </footer>
      </PageContainer>
      <Footer fullBleed className="mt-0" />
    </div>
  )
}

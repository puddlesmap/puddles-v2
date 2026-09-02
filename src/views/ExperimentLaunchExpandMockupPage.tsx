import { Link } from 'react-router-dom'
import { formatDiscoveryBadgeLabel } from '../components/experiment/DiscoveryV3Card'
import { SeasonalBadgeIcon as SeasonalBadgeIconGlyph } from '../components/SeasonalBadgeIcon'
import type { SeasonalBadgeIcon } from '../components/SeasonalBadgeIcon'
import { AppHeader } from '../components/layout/AppHeader'
import { PageContainer } from '../components/layout/PageContainer'
import { Footer } from '../components/layout/Footer'
import { ACTIVITY_TYPES, type ActivityType } from '../types/event'
import { EVENT_FALLBACK_IMAGES } from '../utils/eventImages'
import './experiment-launch-expand-mockup.css'

const CITY_CHIPS = ['Palo Alto', 'Los Altos', 'Mountain View', 'Sunnyvale'] as const
const NEW_TYPES = new Set<ActivityType>(['Festivals & Community', 'Parent & Me'])
const PREVIEW_TYPES = ACTIVITY_TYPES.filter((type) => type !== 'Other')

/** Image badges — seasonal editorial picks only. Activity type lives in metadata. */
type DiscoveryBadge = { kind: 'seasonal'; label: string; icon?: SeasonalBadgeIcon }

interface MockDiscoveryCard {
  id: string
  title: string
  when: string
  location: string
  type: string
  age: string
  cost: string
  imageUrl: string
  badge: DiscoveryBadge | null
  note?: string
}

const COMPARE_CARDS: MockDiscoveryCard[] = [
  {
    id: 'mv-art-wine',
    title: 'Mountain View Art & Wine Festival',
    when: 'Sat, Sep 12 · 10:00 AM',
    location: 'Castro Street · Mountain View',
    type: 'Festivals & Community',
    age: 'All ages',
    cost: 'Free',
    imageUrl: EVENT_FALLBACK_IMAGES['Festivals & Community'],
    badge: null,
    note: 'Festival type in metadata — no image badge',
  },
  {
    id: 'marti-parent-baby',
    title: 'Parent & Baby Yoga with Marti Foster',
    when: 'Sat, Sep 5 · 11:15 AM',
    location: 'Rengstorff Park · Mountain View',
    type: 'Parent & Me',
    age: 'Ages 0–12 mo',
    cost: 'Paid',
    imageUrl: EVENT_FALLBACK_IMAGES['Parent & Me'],
    badge: null,
    note: 'Parent & Me in metadata — NEW on activity-type filter only',
  },
  {
    id: 'fit4mom-las-palmas',
    title: 'FIT4MOM Mommy & Baby Yoga',
    when: 'Tue, Sep 1 · 11:15 AM',
    location: 'Las Palmas Park · Sunnyvale',
    type: 'Parent & Me',
    age: 'Ages 0–1',
    cost: 'Paid',
    imageUrl: EVENT_FALLBACK_IMAGES['Parent & Me'],
    badge: null,
    note: 'Sunnyvale coverage — no city badge on the card',
  },
  {
    id: 'mini-yoga-priority',
    title: 'Family Yoga with Mini Yoga Club',
    when: 'Sat, Sep 26 · 11:00 AM',
    location: 'The Treehouse · Sunnyvale',
    type: 'Parent & Me',
    age: 'Ages 0–5',
    cost: 'Low-cost',
    imageUrl: EVENT_FALLBACK_IMAGES['Parent & Me'],
    badge: { kind: 'seasonal', label: 'Fall Pick', icon: 'fall-leaf' },
    note: 'Seasonal editorial badge when the collection is live',
  },
  {
    id: 'hello-fall-harvest',
    title: 'Harvest History Festival',
    when: 'Sat, Sep 26 · 9:00 AM',
    location: 'Heritage Park · Mountain View',
    type: 'Festivals & Community',
    age: 'All ages',
    cost: 'Free',
    imageUrl: '/seasonal/hello-fall.png',
    badge: { kind: 'seasonal', label: 'Fall Pick', icon: 'fall-leaf' },
  },
  {
    id: 'halloween-drive',
    title: 'Halloween with little ones',
    when: 'Thu, Oct 15 · 10:00 AM',
    location: 'Bay Area · Palo Alto',
    type: 'Festivals & Community',
    age: 'Ages 0–5',
    cost: 'Free',
    imageUrl: '/seasonal/halloween-with-little-ones.png',
    badge: { kind: 'seasonal', label: 'Halloween Pick', icon: 'halloween-pumpkin' },
  },
]

const COMPARE_SAMPLE_IDS = [
  'mv-art-wine',
  'fit4mom-las-palmas',
  'mini-yoga-priority',
  'hello-fall-harvest',
] as const

function MetaStyledPillars({ card }: { card: MockDiscoveryCard }) {
  const priceTone =
    card.cost === 'Free' ? 'free' : card.cost === 'Low-cost' ? 'low' : 'paid'

  return (
    <div className="lem-disc-meta-pillars" aria-hidden>
      <span className="lem-disc-meta-pill lem-disc-meta-pill--age">{card.age}</span>
      <span
        className={[
          'lem-disc-meta-pill',
          'lem-disc-meta-pill--price',
          `lem-disc-meta-pill--price-${priceTone}`,
        ].join(' ')}
      >
        {card.cost}
      </span>
      <span className="lem-disc-meta-pill lem-disc-meta-pill--type">{card.type}</span>
    </div>
  )
}

function MetaPills({
  card,
  placement = 'top',
}: {
  card: MockDiscoveryCard
  placement?: 'top' | 'bottom'
}) {
  return (
    <div
      className={[
        'lem-disc-pills',
        placement === 'bottom' ? 'lem-disc-pills--bottom' : 'lem-disc-pills--top',
      ].join(' ')}
      aria-hidden
    >
      <span className="lem-disc-pill">{card.age}</span>
      <span
        className={
          card.cost === 'Free'
            ? 'lem-disc-pill lem-disc-pill--free'
            : 'lem-disc-pill lem-disc-pill--cost'
        }
      >
        {card.cost}
      </span>
      <span className="lem-disc-pill lem-disc-pill--type">{card.type}</span>
    </div>
  )
}

function LegacyCard({ card, showBadge = false }: { card: MockDiscoveryCard; showBadge?: boolean }) {
  return (
    <article className="lem-legacy-card">
      <div className="lem-legacy-card__media">
        <img
          src={card.imageUrl}
          alt=""
          className="lem-legacy-card__img"
          loading="lazy"
          decoding="async"
        />
        <div className="lem-legacy-card__overlays">
          {showBadge && card.badge ? (
            <span
              className={`lem-disc-badge lem-disc-badge--${card.badge.kind}`}
              aria-label={card.badge.label}
            >
              {card.badge.label}
            </span>
          ) : null}
          <div className="event-card-pills lem-legacy-card__meta-pills" aria-hidden>
            <span className="event-card-pill">{card.age}</span>
            <span
              className={
                card.cost === 'Free' ? 'event-card-pill event-card-pill--free' : 'event-card-pill'
              }
            >
              {card.cost}
            </span>
          </div>
        </div>
      </div>
      <div className="lem-legacy-card__body">
        <p className="lem-legacy-card__when">{card.when}</p>
        <h3 className="lem-legacy-card__title">{card.title}</h3>
        <p className="lem-legacy-card__location">{card.location}</p>
      </div>
    </article>
  )
}

function formatImagePrice(cost: string): string {
  if (cost === 'Free') return 'Free'
  if (cost === 'Paid') return '$'
  return cost
}

function ImageKeyPills({
  card,
  variant = 'v2',
}: {
  card: MockDiscoveryCard
  variant?: 'v2' | 'v2-2'
}) {
  const priceLabel = formatImagePrice(card.cost)
  const pillClass = variant === 'v2-2' ? 'lem-disc-white-pill' : 'lem-disc-superhost-pill'

  return (
    <div className="lem-disc-card__key-pills" aria-hidden>
      <span className={pillClass}>{card.age}</span>
      <span className={pillClass}>{priceLabel}</span>
    </div>
  )
}

function DiscoveryBadge({
  badge,
  variant = 'default',
}: {
  badge: DiscoveryBadge
  variant?: 'default' | 'v3'
}) {
  const displayLabel =
    variant === 'v3' ? formatDiscoveryBadgeLabel(badge.label) : badge.label

  return (
    <span
      className={[
        'lem-disc-badge',
        'lem-disc-badge--seasonal',
        variant === 'v3' ? 'lem-disc-badge--v3' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={displayLabel}
    >
      {badge.icon ? (
        <SeasonalBadgeIconGlyph icon={badge.icon} className="seasonal-badge__icon" />
      ) : null}
      {displayLabel}
    </span>
  )
}

/** Seasonal editorial badge labels on v3 cards */
const SEASONAL_BADGE_SAMPLES = [
  {
    id: 'fall',
    name: 'Fall Pick',
    hex: '#7a4a00',
    note: 'Hello, Fall collection',
    selected: true,
    badge: { kind: 'seasonal' as const, label: 'Fall Pick', icon: 'fall-leaf' as const },
  },
  {
    id: 'halloween',
    name: 'Halloween Pick',
    hex: '#b45309',
    note: 'Halloween with little ones',
    badge: { kind: 'seasonal' as const, label: 'Halloween Pick', icon: 'halloween-pumpkin' as const },
  },
  {
    id: 'holiday',
    name: 'Holiday Pick',
    hex: '#9a3412',
    note: 'Holiday magic collection',
    badge: { kind: 'seasonal' as const, label: 'Holiday Pick' },
  },
] as const

function SeasonalBadgeSample({
  sample,
}: {
  sample: (typeof SEASONAL_BADGE_SAMPLES)[number]
}) {
  return (
    <div
      className={[
        'lem-blue-sample',
        'selected' in sample && sample.selected ? 'lem-blue-sample--selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <p className="lem-blue-sample__name">
        {sample.name}
        {'selected' in sample && sample.selected ? (
          <span className="lem-blue-sample__pick">Default</span>
        ) : null}
      </p>
      <p className="lem-blue-sample__meta">{sample.hex}</p>
      <p className="lem-blue-sample__note">{sample.note}</p>
      <div className="lem-blue-sample__media">
        <img
          src={EVENT_FALLBACK_IMAGES['Parent & Me']}
          alt=""
          className="lem-blue-sample__img"
          loading="lazy"
          decoding="async"
        />
        <DiscoveryBadge badge={sample.badge} variant="v3" />
      </div>
    </div>
  )
}

function DiscoveryCard({
  card,
  pillPlacement = 'top',
  showNote = false,
}: {
  card: MockDiscoveryCard
  pillPlacement?: 'top' | 'bottom' | 'image-key' | 'image-key-v22'
  showNote?: boolean
}) {
  const pills =
    pillPlacement === 'bottom' ? (
      <MetaStyledPillars card={card} />
    ) : (
      <MetaPills card={card} placement="top" />
    )
  const imageOverlays =
    pillPlacement === 'image-key' ? (
      <div className="lem-disc-card__media-bar">
        {card.badge ? <DiscoveryBadge badge={card.badge} variant="v3" /> : (
          <span className="lem-disc-card__media-bar-spacer" aria-hidden />
        )}
        <ImageKeyPills card={card} variant="v2" />
      </div>
    ) : pillPlacement === 'image-key-v22' ? (
      <div className="lem-disc-card__media-bar lem-disc-card__media-bar--v2-2">
        <ImageKeyPills card={card} variant="v2-2" />
        {card.badge ? <DiscoveryBadge badge={card.badge} variant="v3" /> : null}
      </div>
    ) : card.badge ? (
      <DiscoveryBadge badge={card.badge} variant={pillPlacement === 'bottom' ? 'v3' : 'default'} />
    ) : null

  return (
    <article className="lem-disc-card">
      <div className="lem-disc-card__media">
        <img
          src={card.imageUrl}
          alt=""
          className="lem-disc-card__img"
          loading="lazy"
          decoding="async"
        />
        {imageOverlays}
      </div>
      <div
        className={[
          'lem-disc-card__body',
          pillPlacement === 'bottom' ? 'lem-disc-card__body--pills-bottom' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {pillPlacement === 'top' ? pills : null}
        <p className="lem-disc-card__when">{card.when}</p>
        <h3 className="lem-disc-card__title">{card.title}</h3>
        <p className="lem-disc-card__location">{card.location}</p>
        {pillPlacement === 'bottom' ? pills : null}
        {showNote && card.note ? <p className="lem-disc-card__note">{card.note}</p> : null}
      </div>
    </article>
  )
}

function CardComparison({ card }: { card: MockDiscoveryCard }) {
  return (
    <div className="lem-compare__row">
      <div className="lem-compare__col">
        <p className="lem-compare__label lem-compare__label--v1">Version 1 · badge + image pills</p>
        <LegacyCard card={card} showBadge />
      </div>
      <div className="lem-compare__col">
        <p className="lem-compare__label lem-compare__label--v2">
          Version 2-2 · white pills · age &amp; price left, badge right
        </p>
        <DiscoveryCard card={card} pillPlacement="image-key-v22" />
      </div>
      <div className="lem-compare__col">
        <p className="lem-compare__label lem-compare__label--v3">
          Version 3 · styled metadata pillars
        </p>
        <DiscoveryCard card={card} pillPlacement="bottom" showNote />
      </div>
    </div>
  )
}

export function ExperimentLaunchExpandMockupPage() {
  return (
    <div className="lem-shell">
      <AppHeader />
      <PageContainer>
        <main className="lem-page">
          <header className="lem-hero">
            <p className="lem-hero__eyebrow">Experiment · Event card tags</p>
            <h1 className="lem-hero__title">Discovery badges on the image</h1>
            <p className="lem-hero__lede">
              Three layouts side by side: discovery badge plus today’s image pills (v1), discovery
              badge plus age &amp; price on the image (v2-2 — white pills, age left / badge right), or
              separate styled metadata pillars below location (v3).
            </p>
            <Link to="/browse" className="lem-hero__back">
              ← Back to Browse
            </Link>
          </header>

          <section className="lem-section" aria-labelledby="lem-cards-heading">
            <p className="lem-section__eyebrow">1 · Event cards</p>
            <h2 id="lem-cards-heading" className="lem-section__title">
              Three versions
            </h2>
            <p className="lem-section__lede">
              Same event in each row. Version 1 adds the discovery badge but keeps type · age ·
              price on the image. Version 2-2: white age &amp; price pills on the left, v3-style
              discovery badge on the right. Version 3:
              separate styled metadata pillars below location.
            </p>
            <div className="lem-compare">
              {COMPARE_CARDS.filter((card) =>
                COMPARE_SAMPLE_IDS.includes(card.id as (typeof COMPARE_SAMPLE_IDS)[number]),
              ).map((card) => (
                <CardComparison key={card.id} card={card} />
              ))}
            </div>
          </section>

          <section className="lem-section" aria-labelledby="lem-blue-heading">
            <p className="lem-section__eyebrow">1b · Seasonal image badges</p>
            <h2 id="lem-blue-heading" className="lem-section__title">
              Editorial picks on the image
            </h2>
            <p className="lem-section__lede">
              Only seasonal badges appear on cards — Fall Pick, Halloween Pick, Holiday Pick. Activity
              type stays in metadata.
            </p>
            <div className="lem-blue-samples">
              {SEASONAL_BADGE_SAMPLES.map((sample) => (
                <SeasonalBadgeSample key={sample.id} sample={sample} />
              ))}
            </div>
          </section>

          <section className="lem-section" aria-labelledby="lem-more-heading">
            <p className="lem-section__eyebrow">2 · More proposed examples</p>
            <h2 id="lem-more-heading" className="lem-section__title">
              Badge variants
            </h2>
            <div className="lem-card-grid">
              {COMPARE_CARDS.filter(
                (card) =>
                  !COMPARE_SAMPLE_IDS.includes(card.id as (typeof COMPARE_SAMPLE_IDS)[number]),
              ).map((card) => (
                <DiscoveryCard key={card.id} card={card} />
              ))}
            </div>
          </section>

          <section className="lem-section" aria-labelledby="lem-rules-heading">
            <p className="lem-section__eyebrow">3 · Badge rules</p>
            <h2 id="lem-rules-heading" className="lem-section__title">
              When badges appear
            </h2>
            <ul className="lem-rules">
              <li>
                <strong>Image badge</strong> — seasonal editorial only: Fall Pick, Halloween Pick,
                Holiday Pick. Answers why this event is timely or featured.
              </li>
              <li>
                <strong>Metadata tag</strong> — activity type (Festival, Parent &amp; Me, Outdoor,
                etc.) in the card body, not on the image.
              </li>
              <li>
                <strong>Filter NEW</strong> — small indicator on newly added activity-type filters
                for a limited window (~4–8 weeks), then removed once established.
              </li>
              <li>
                <strong>No NEW on cards</strong> — no new-type, new-city, or category pills on event
                images.
              </li>
            </ul>
          </section>

          <section className="lem-section" aria-labelledby="lem-cities-heading">
            <p className="lem-section__eyebrow">4 · City chips</p>
            <h2 id="lem-cities-heading" className="lem-section__title">
              Where filter
            </h2>
            <p className="lem-section__lede">
              City chips stay plain — no NEW on city filters.
            </p>
            <div className="lem-chips" role="list" aria-label="City filter mock">
              <button type="button" className="lem-chip" role="listitem">
                Nearby
              </button>
              <button type="button" className="lem-chip" role="listitem">
                All cities
              </button>
              {CITY_CHIPS.map((city) => (
                <button key={city} type="button" className="lem-chip" role="listitem">
                  {city}
                </button>
              ))}
            </div>
          </section>

          <section className="lem-section" aria-labelledby="lem-types-heading">
            <p className="lem-section__eyebrow">5 · Activity type filter</p>
            <h2 id="lem-types-heading" className="lem-section__title">
              Two new types in the list
            </h2>
            <p className="lem-section__lede">
              After the launch window, types are normal metadata — no image badge.
            </p>
            <div className="lem-chips lem-chips--wrap" role="list" aria-label="Activity type filter mock">
              {PREVIEW_TYPES.map((type) => {
                const isNew = NEW_TYPES.has(type)
                return (
                  <button
                    key={type}
                    type="button"
                    className={isNew ? 'lem-chip lem-chip--new lem-chip--selected' : 'lem-chip'}
                    role="listitem"
                  >
                    {type}
                    {isNew ? <span className="lem-chip__tag">New</span> : null}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="lem-section" aria-labelledby="lem-icons-heading">
            <p className="lem-section__eyebrow">6 · Browse by activity</p>
            <h2 id="lem-icons-heading" className="lem-section__title">
              Clay fallbacks for the new types
            </h2>
            <div className="lem-type-track">
              {PREVIEW_TYPES.map((type) => {
                const isNew = NEW_TYPES.has(type)
                return (
                  <div
                    key={type}
                    className={isNew ? 'lem-type-chip lem-type-chip--new' : 'lem-type-chip'}
                  >
                    <span className="lem-type-chip__icon-wrap" aria-hidden>
                      <img
                        src={EVENT_FALLBACK_IMAGES[type]}
                        alt=""
                        className="lem-type-chip__icon"
                        loading="lazy"
                        decoding="async"
                      />
                    </span>
                    <span className="lem-type-chip__label">{type}</span>
                    {isNew ? <span className="lem-type-chip__tag">New</span> : null}
                  </div>
                )
              })}
            </div>
          </section>

          <p className="lem-footer-note">
            Review only — not wired to live Browse yet. City landing:{' '}
            <Link to="/sunnyvale">/sunnyvale</Link>
            {' · '}
            <Link to="/experiment/browse-card-layout-mockup">Card layout comparison</Link>
            {' · '}
            <Link to="/experiment/browse-v2-mockup">Browse v2 mockup</Link>
            {' · '}
            <Link to="/experiment/browse-v3-mockup">Browse v3 mockup</Link>
            {' · '}
            <Link to="/experiment/seasonal-discovery">Seasonal discovery</Link>
          </p>
        </main>
      </PageContainer>
      <Footer />
    </div>
  )
}

import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { GuideMidArticleAd } from '../components/ads/GuideMidArticleAd'
import { openPuddlesPicksSignup } from '../components/picks/PuddlesPicksHome'
import { FeaturedExperience } from '../components/guides/FeaturedExperience'
import { QuickPickGroup } from '../components/guides/QuickPick'
import { GuideEventLinkedTitle } from '../components/guides/guideEditorialShared'
import {
  HOLIDAY_EVENTS_HREF,
  HOLIDAY_GUIDE_EVENT_IDS as IDS,
  HOLIDAY_GUIDE_POSTED,
  HOLIDAY_GUIDE_READ,
  HOLIDAY_GUIDE_SECTION_CLAY,
  HOLIDAY_GUIDE_SLUG,
  HOLIDAY_GUIDE_TITLE,
} from '../data/holidayGuide'
import { HOLIDAY_LIGHTS_FINDER_TITLE } from '../data/holidayMagicHubGuides'
import { trackGuideSectionViewed, trackGuideShared } from '../utils/analytics'

const GUIDE_SHARE_URL = 'https://puddlesmap.com/guides/holiday-lights-traditions'
const GUIDE_SHARE_TITLE = HOLIDAY_GUIDE_TITLE
const GS = HOLIDAY_GUIDE_SLUG

const FILOLI_IMG =
  'https://filoli.org/media/gisjfdd0/olivia-marshall-thistlewyck-12-3.jpg?height=1230&quality=80&rmode=crop&rxy=0.5%2C0.5078231974492391&width=1640'
const HILLER_IMG = 'https://www.hiller.org/wp-content/uploads/santa_2_600x450px-1.jpg'
const TREE_LA_IMG = 'https://downtownlosaltos.org/wp-content/uploads/2018/08/Tree2.jpg'
const TREE_LANE_IMG =
  'https://stanforddaily.com/wp-content/uploads/2021/12/Vivien-Chen_Christmas-Tree-Lane-scaled.jpg'
const CHRISTMAS_IN_PARK_IMG =
  'https://christmasinthepark.com/wp-content/uploads/2026/11/CITP_Blinky_Pause_Hero_2026-1536x857.jpg'
const FANTASY_LIGHTS_IMG =
  'https://files.santaclaracounty.gov/exjcpb1516/styles/card_horizontal_850x478/s3/2024-10/fol_arch_1600x900.jpg.webp?VersionId=bpLGf4cKHd1dPv.QbCaaOsQLCjU_g.fL&itok=RcUHeVzf'
const PARADE_LA_IMG =
  'https://static.wixstatic.com/media/8d9896_01a69e7034ca41b5abf8a5f49c2b5c8b%7Emv2.jpg/v1/fill/w_1200,h_800,al_c,q_85,enc_auto/8d9896_01a69e7034ca41b5abf8a5f49c2b5c8b%7Emv2.jpg'
/** City page bot-blocks scrapes; use 2025 MV Voice event photo until an official asset is available. */
const MV_TREE_IMG =
  'https://i0.wp.com/www.mv-voice.com/wp-content/uploads/2025/11/TreeLighting_web09.jpg?fit=2000%2C1333&ssl=1'
const GERMAN_MARKET_IMG =
  'https://resources.finalsite.net/images/t_image_size_4/v1766033817/gissv/ebtvseuoqjsu8mc2ti6u/BarakShrama-socialmediaselects-029.jpg'
const SANTAS_FARM_IMG =
  'https://assets.simpleviewinc.com/simpleview/image/upload/c_limit,h_1200,q_75,w_1200/v1/crm/sanmateoca/Santas-Tree-train-ride-fdfca2a65056a36_fdfca3dd-5056-a36a-0bdd1712ec5e94a1.jpg'
const CALTRAIN_IMG = 'https://www.caltrain.com/files/images/2025-12/Holiday%20Train.jpg'
const BILLY_JONES_IMG =
  'https://static.wixstatic.com/media/ac1bb4_23ec671624e04544875ac2ef042d4005%7Emv2.jpg/v1/fit/w_2500,h_1330,al_c/ac1bb4_23ec671624e04544875ac2ef042d4005%7Emv2.jpg'

const JUMPS = [
  ['lights', 'Lights & Walks'],
  ['parades', 'Parades & Celebrations'],
  ['santa', 'Santa Visits'],
  ['trains', 'Holiday Trains'],
  ['more', 'More Holiday Outings'],
  ['before', 'Before You Go'],
] as const

const FINDER_ROWS = [
  {
    category: 'Free & close by',
    items: [
      { slug: 'mountain-view-tree', label: 'Mountain View Tree Lighting' },
      { slug: 'los-altos-tree', label: 'Los Altos Holiday Tree Celebration' },
      { slug: 'christmas-tree-lane', label: 'Christmas Tree Lane' },
    ],
  },
  {
    category: 'Before bedtime',
    items: [
      { slug: 'hiller-santa', label: 'Santa by Helicopter' },
      { slug: 'santas-tree-farm', label: "Santa's Tree Farm" },
      { slug: 'german-market', label: 'German Holiday Market' },
    ],
  },
  {
    category: 'A special outing',
    items: [
      { slug: 'filoli', label: 'Filoli' },
      { slug: 'billy-jones', label: 'Billy Jones Holiday Night Train' },
      { slug: 'fantasy-of-lights', label: 'Fantasy of Lights' },
    ],
  },
  {
    category: 'After-dark magic',
    items: [
      { slug: 'los-altos-parade', label: 'Los Altos Parade' },
      { slug: 'christmas-in-park', label: 'Christmas in the Park' },
      { slug: 'christmas-tree-lane', label: 'neighborhood lights' },
    ],
  },
] as const

function GuideShare() {
  const [copied, setCopied] = useState(false)

  async function share() {
    trackGuideShared(HOLIDAY_GUIDE_SLUG)
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: GUIDE_SHARE_TITLE, url: GUIDE_SHARE_URL })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(GUIDE_SHARE_URL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable.
    }
  }

  return (
    <button type="button" className="lgg-share" onClick={() => void share()}>
      {copied ? 'Link copied' : 'Share'}
    </button>
  )
}

export function HolidayGuideDraft({
  idPrefix,
  jumps,
  rail,
  cover,
  heading = 'h2',
  share = false,
  afterCover,
  afterHero,
  beforeFinder,
  afterFinder,
  afterBody,
  railAside,
  suppressHero = false,
  suppressCover = false,
  hideEventsCta = false,
  suppressClosing = false,
  suppressFinder = false,
  linkFinder = false,
  finderLayout = 'inline',
  imageOverrides,
  trackSections = true,
}: {
  idPrefix: string
  jumps: boolean
  rail: boolean
  cover: string
  heading?: 'h1' | 'h2'
  share?: boolean
  afterCover?: ReactNode
  afterHero?: ReactNode
  /** Inserted just beneath the finder title (lede). */
  beforeFinder?: ReactNode
  /** Inserted after the finder, before Lights & Walks. */
  afterFinder?: ReactNode
  afterBody?: ReactNode
  railAside?: ReactNode
  suppressHero?: boolean
  suppressCover?: boolean
  hideEventsCta?: boolean
  /** Hide built-in upcoming/email closing (use afterBody footer instead). */
  suppressClosing?: boolean
  /** Hide the finder (mockups that lead with picks). */
  suppressFinder?: boolean
  /** Link finder-table event names to in-guide anchors / Puddles. */
  linkFinder?: boolean
  /** `bullets` = category rows with outing lists (mockup F); default keeps inline · separators. */
  finderLayout?: 'inline' | 'bullets'
  /** Optional image overrides keyed by outing slug (mockup assets). */
  imageOverrides?: Partial<Record<string, string>>
  /** When false, page-level guide visit analytics owns section reach. */
  trackSections?: boolean
}) {
  const Title = heading
  const id = (slug: string) => `${idPrefix}-${slug}`
  const showRail = rail
  const anchor = (slug: string) => ({ eventAnchorId: id(slug) })
  const img = (slug: string, fallback?: string) => imageOverrides?.[slug] ?? fallback

  useEffect(() => {
    if (trackSections === false) return
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-guide-section]'))
    if (nodes.length === 0) return

    const seen = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const sectionId = entry.target.getAttribute('data-guide-section')
          if (!sectionId || seen.has(sectionId)) continue
          seen.add(sectionId)
          trackGuideSectionViewed(HOLIDAY_GUIDE_SLUG, sectionId)
        }
      },
      { threshold: 0.35 },
    )

    for (const node of nodes) observer.observe(node)
    return () => observer.disconnect()
  }, [trackSections])

  return (
    <>
      {suppressHero ? null : (
        <header className="lgg-hero">
          <p className="lgg-kicker">Local guide</p>
          <Title>
            {HOLIDAY_GUIDE_TITLE} ✨{share ? <GuideShare /> : null}
          </Title>
          <p className="lgg-meta">
            {HOLIDAY_GUIDE_POSTED} · {HOLIDAY_GUIDE_READ}
          </p>
        </header>
      )}
      {afterHero}
      {suppressCover ? null : <img className="lgg-cover" src={cover} alt="" />}
      {afterCover}
      <div className="lgg-body">
        {hideEventsCta ? null : (
          <Link className="guide-events-cta" to={HOLIDAY_EVENTS_HREF}>
            <span className="guide-events-cta__title">Explore Holiday Events</span>
            <span className="guide-events-cta__body">
              Browse lights, trains, Santa visits, and more — updated as new listings go live.
            </span>
            <span className="guide-events-cta__action">See holiday events →</span>
          </Link>
        )}
        {jumps ? (
          <nav className="lgg-jumps" aria-label="In this guide">
            <p>In this guide</p>
            <ol>
              {JUMPS.map(([slug, label]) => (
                <li key={slug}>
                  <a href={`#${id(slug)}`}>{label}</a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <div className={showRail ? 'lgg-layout' : undefined}>
          <div>
            {suppressFinder ? (
              beforeFinder
            ) : (
              <section
                className={`lgg-chapter lgg-chapter--finder${finderLayout === 'bullets' ? ' lgg-chapter--finder-bullets' : ''}`}
                id={id('finder')}
              >
                {finderLayout === 'bullets' ? (
                  <h2 className="holiday-finder-title" data-guide-section="finder">
                    <img
                      className="holiday-finder-title__clay"
                      src={HOLIDAY_GUIDE_SECTION_CLAY.finder}
                      alt=""
                      decoding="async"
                    />
                    <span>{HOLIDAY_LIGHTS_FINDER_TITLE}</span>
                  </h2>
                ) : (
                  <h3 data-guide-section="finder">{HOLIDAY_LIGHTS_FINDER_TITLE}</h3>
                )}
                {beforeFinder}
                {finderLayout === 'bullets' ? (
                  <div className="holiday-finder-table" aria-label={HOLIDAY_LIGHTS_FINDER_TITLE}>
                    {FINDER_ROWS.map((row) => (
                      <div className="holiday-finder-table__row" key={row.category}>
                        <div className="holiday-finder-table__cat">{row.category}</div>
                        <p className="holiday-finder-table__events gem-quick">
                          {linkFinder
                            ? row.items.map((item, index) => (
                                <span key={`${row.category}-${item.slug}-${item.label}`}>
                                  {index > 0 ? ', ' : null}
                                  <a className="gem-quick__link" href={`#${id(item.slug)}`}>
                                    {item.label}
                                  </a>
                                </span>
                              ))
                            : row.items.map((item) => item.label).join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <QuickPickGroup className="holiday-finder">
                    {FINDER_ROWS.map((row) => (
                      <li key={row.category}>
                        <p className="gem-quick">
                          <span className="gem-quick__category">{row.category} — </span>
                          {linkFinder
                            ? row.items.map((item, index) => (
                                <span key={`${item.slug}-${item.label}`}>
                                  {index > 0 ? ' · ' : null}
                                  <a className="gem-quick__link" href={`#${id(item.slug)}`}>
                                    {item.label}
                                  </a>
                                </span>
                              ))
                            : row.items.map((item) => item.label).join(' · ')}
                        </p>
                      </li>
                    ))}
                  </QuickPickGroup>
                )}
              </section>
            )}

            {afterFinder}

            <section className="lgg-chapter" id={id('lights')}>
              <h3 data-guide-section="lights">✨ Lights & Walks</h3>

              <FeaturedExperience
                title="Christmas Tree Lane · Palo Alto"
                when="Mid–late December (2026 dates not yet confirmed) · Fulton Street · Free"
                tip="This is a residential street — stay on the sidewalks and keep driveways clear. Confirm 2026 lighting dates before visiting."
                puddlesHref={`/event/${IDS.christmasTreeLane}`}
                guideSlug={GS}
                image={img('christmas-tree-lane', TREE_LANE_IMG)!}
                {...anchor('christmas-tree-lane')}
              >
                <p>
                  Walk along Fulton Street to see illuminated trees, decorated homes, and a
                  neighborhood holiday tradition.
                </p>
              </FeaturedExperience>

              <FeaturedExperience
                title="Holidays at Filoli · Woodside"
                when="Nov 14–Jan 10 · Daytime or evening tickets"
                tip="Daytime and evening need different tickets. Thistlewyck Village ends Jan 3; evening Holiday Lights is closed Dec 12. Strollers welcome; wagons aren't."
                puddlesHref={`/event/${IDS.filoli}`}
                guideSlug={GS}
                image={img('filoli', FILOLI_IMG)!}
                {...anchor('filoli')}
              >
                <p>
                  Explore miniature trains, elf activities, and farm animals by day, or wander through
                  illuminated gardens and a glowing light tunnel after dark.
                </p>
              </FeaturedExperience>

              <FeaturedExperience
                title="Christmas in the Park · San José"
                when="Nov 27–Jan 1 · Downtown San José · Free display"
                tip="The main display is free; nearby rides and skating are separate. Sensory-friendly hours Dec 13 & 27, 9 AM–2 PM."
                puddlesHref={`/event/${IDS.christmasInThePark}`}
                guideSlug={GS}
                image={img('christmas-in-park', CHRISTMAS_IN_PARK_IMG)!}
                {...anchor('christmas-in-park')}
              >
                <p>
                  Wander among hundreds of decorated trees, animated holiday scenes, and festive
                  displays, with live entertainment and Santa visits.
                </p>
              </FeaturedExperience>

              <FeaturedExperience
                title="Fantasy of Lights · Los Gatos"
                when="Dec 5–6 & 12–13 · 4–9 PM · Vasona Lake County Park · Tickets"
                tip="2026 is walk-through only (one mile one way). No event parking inside Vasona — use Netflix shuttles. Everyone needs an advance ticket, including free under-3 tickets."
                puddlesHref={`/event/${IDS.fantasyOfLights}`}
                guideSlug={GS}
                image={img('fantasy-of-lights', FANTASY_LIGHTS_IMG)!}
                {...anchor('fantasy-of-lights')}
              >
                <p>
                  Walk past colorful holiday displays, visit Santa and Mrs. Claus, and enjoy live
                  entertainment along Vasona&apos;s illuminated route.
                </p>
              </FeaturedExperience>
            </section>

            <GuideMidArticleAd placementKey={`${GS}-mid-after-lights`} />

            <section className="lgg-chapter" id={id('parades')}>
              <h3 data-guide-section="parades">🎄 Parades & Celebrations</h3>

              <FeaturedExperience
                title="Los Altos Festival of Lights Parade"
                when="Nov 29 · 6 PM · Downtown Los Altos · Free viewing"
                tip="Whitney Street near the end of the route is usually less crowded. If rain is forecast, the organizer decides by noon — no rain date."
                puddlesHref={`/event/${IDS.festivalOfLightsParade}`}
                guideSlug={GS}
                image={img('los-altos-parade', PARADE_LA_IMG)!}
                {...anchor('los-altos-parade')}
              >
                <p>
                  Watch glowing floats, marching bands, costumed characters, and Santa make their way
                  through downtown Los Altos.
                </p>
              </FeaturedExperience>

              <FeaturedExperience
                title="Los Altos Holiday Tree Celebration"
                when="Dec 4 · 6–8 PM · Veterans Community Plaza · Free"
                tip="Santa is scheduled after the performances and stays for photos until 8 PM — bring your own camera."
                puddlesHref={`/event/${IDS.losAltosTree}`}
                guideSlug={GS}
                image={img('los-altos-tree', TREE_LA_IMG)!}
                imagePosition="center 20%"
                {...anchor('los-altos-tree')}
              >
                <p>
                  Enjoy student performances, take a holiday trolley ride through downtown, and visit
                  Santa at the community plaza.
                </p>
              </FeaturedExperience>

              <FeaturedExperience
                title="Mountain View Community Tree Lighting"
                when="Dec 7 · 5:30–8 PM · Civic Center Plaza · Free"
                tip="This is a large community celebration. Allow extra time if your family hopes to try several activities."
                puddlesHref={`/event/${IDS.mountainViewTree}`}
                guideSlug={GS}
                image={img('mountain-view-tree', MV_TREE_IMG)!}
                {...anchor('mountain-view-tree')}
              >
                <p>
                  Ride a holiday train, make crafts, play games, hear local performances, and watch
                  the community tree light up.
                </p>
              </FeaturedExperience>

              <FeaturedExperience
                title="German Holiday Market · Mountain View"
                when="Dec 12 · 11 AM–9 PM · City Hall Plaza · Free admission"
                tip="Expect busy stalls (20,000+ visitors in a typical year). The organizer recommends transit — about a 10-minute walk from the Transit Center."
                puddlesHref={`/event/${IDS.germanHolidayMarket}`}
                guideSlug={GS}
                image={img('german-market', GERMAN_MARKET_IMG)!}
                {...anchor('german-market')}
              >
                <p>
                  Explore a traditional German Christmas market with handmade ornaments, gingerbread,
                  pretzels, live performances, and family arts and crafts.
                </p>
              </FeaturedExperience>
            </section>

            <section className="lgg-chapter" id={id('santa')}>
              <h3 data-guide-section="santa">🎅 Santa Visits</h3>

              <FeaturedExperience
                title="Santa Arrives by Helicopter · San Carlos"
                when="Dec 5 · 9:30 AM–noon · Hiller Aviation Museum"
                tip="Santa arrives at 10:30 AM and meets children until noon. Watching the arrival is free; museum admission is separate."
                puddlesHref={`/event/${IDS.hillerSanta}`}
                guideSlug={GS}
                image={img('hiller-santa', HILLER_IMG)!}
                {...anchor('hiller-santa')}
              >
                <p>
                  Watch Santa arrive by helicopter, hear Christmas carols from the West Bay Community
                  Band, and visit with Santa afterward.
                </p>
              </FeaturedExperience>

              <FeaturedExperience
                title="Santa's Tree Farm & Village · Half Moon Bay"
                when="Weekends Nov 21–Dec 13 · Daytime · Paid activities"
                tip="Santa visits weekends Nov 21–Dec 13, but not Dec 5. The tree farm is for customers; train and special activities may have separate charges."
                puddlesHref={`/event/${IDS.santasTreeFarm}`}
                guideSlug={GS}
                image={img('santas-tree-farm', SANTAS_FARM_IMG)!}
                {...anchor('santas-tree-farm')}
              >
                <p>
                  Ride the farm train, browse Santa&apos;s Village, visit Mrs. Claus&apos; kitchen,
                  and explore a Christmas tree farm together.
                </p>
              </FeaturedExperience>
            </section>

            <section className="lgg-chapter" id={id('trains')}>
              <h3 data-guide-section="trains">🚂 Holiday Trains</h3>

              <FeaturedExperience
                title="Caltrain Holiday Train · Peninsula"
                when="Dec 5 · Ticketed ride + free station festivities"
                tip="Ride tickets go on sale Nov 20. Station festivities are free. The former stationary Holiday Train performance is not returning in 2026."
                puddlesHref={`/event/${IDS.caltrainHolidayTrain}`}
                guideSlug={GS}
                image={img('caltrain', CALTRAIN_IMG)!}
                {...anchor('caltrain')}
              >
                <p>
                  Ride a decorated train with festive onboard activities, or enjoy holiday
                  entertainment at participating Caltrain stations.
                </p>
              </FeaturedExperience>

              <FeaturedExperience
                title="Billy Jones Holiday Night Train & Carousel · Los Gatos"
                when="Dec 14–23 & 26–27 · 6–9 PM · Paid rides"
                tip="Buy tickets on-site; daytime tickets don't work. The train doesn't run in rain. Fantasy of Lights at Vasona is not visible from the train this year."
                puddlesHref={`/event/${IDS.billyJones}`}
                guideSlug={GS}
                image={img('billy-jones', BILLY_JONES_IMG)!}
                {...anchor('billy-jones')}
              >
                <p>
                  Ride a decorated train beneath twinkling trees, enjoy the holiday carousel, and stop
                  for hot chocolate at the Snack Shack.
                </p>
              </FeaturedExperience>
            </section>

            <section className="lgg-chapter" id={id('more')}>
              <h3 data-guide-section="more">🌟 More Holiday Outings</h3>
              <p>
                These are additional options for families planning another evening out or a festive
                day trip. For a broader list by date or city,{' '}
                <Link className="lgl-textlink" to={HOLIDAY_EVENTS_HREF}>
                  explore the Holiday Magic collection
                </Link>
                .
              </p>

              <h4 className="holiday-more__label">Close to home</h4>
              <ul className="holiday-more-list">
                <li id={id('los-altos-stroll')}>
                  <b>
                    <GuideEventLinkedTitle href={`/event/${IDS.holidayStroll}`} guideSlug={GS}>
                      Downtown Los Altos Holiday Stroll
                    </GuideEventLinkedTitle>{' '}
                    · Nov 13, 5–9 PM.
                  </b>{' '}
                  Wander through downtown lights and shops while strolling carolers bring music to the
                  streets. Primarily an evening shopping stroll rather than a dedicated children&apos;s
                  program.
                </li>
                <li id={id('los-altos-market')}>
                  <b>
                    <GuideEventLinkedTitle href={`/event/${IDS.holidayMarket}`} guideSlug={GS}>
                      Downtown Los Altos Holiday Market
                    </GuideEventLinkedTitle>{' '}
                    · Dec 10 & 17, 4–8 PM.
                  </b>{' '}
                  Browse local holiday vendors along State Street, listen to live music, and stop by to
                  see Santa.
                </li>
                <li id={id('once-upon-a-garden')}>
                  <b>
                    <GuideEventLinkedTitle href={`/event/${IDS.onceUponAGarden}`} guideSlug={GS}>
                      Once Upon a Garden
                    </GuideEventLinkedTitle>{' '}
                    · Palo Alto · Dec 4, 5–7 PM.
                  </b>{' '}
                  Wander through a storybook-themed winter garden, meet Santa, enjoy crafts, and sip hot
                  chocolate at Gamble Garden. Ticketed.
                </li>
                <li id={id('cupertino-tree')}>
                  <b>
                    <GuideEventLinkedTitle href={`/event/${IDS.cupertinoTreeLighting}`} guideSlug={GS}>
                      Cupertino Community Tree Lighting
                    </GuideEventLinkedTitle>{' '}
                    · Dec 4, 6–8 PM.
                  </b>{' '}
                  See the holiday tree light up, visit Santa, and enjoy children&apos;s activities, a
                  snowball room, and a holiday movie. Free.
                </li>
              </ul>

              <h4 className="holiday-more__label">Worth a little drive</h4>
              <ul className="holiday-more-list">
                <li id={id('photosynthesis')}>
                  <b>
                    <GuideEventLinkedTitle href={`/event/${IDS.photosynthesis}`} guideSlug={GS}>
                      Photosynthesis
                    </GuideEventLinkedTitle>{' '}
                    · Conservatory of Flowers, San Francisco · Oct 1–Jan 30.
                  </b>{' '}
                  Watch colorful projections and music transform the Conservatory exterior during a
                  30-minute evening show from the front lawns.
                </li>
                <li id={id('lightscape')}>
                  <b>
                    <GuideEventLinkedTitle href={`/event/${IDS.lightscape}`} guideSlug={GS}>
                      Lightscape
                    </GuideEventLinkedTitle>{' '}
                    · SF Botanical Garden · Nov 20–Jan 3.
                  </b>{' '}
                  Follow a garden trail through glowing art installations and music after dark. Children
                  4 and under are free; allow at least 45 minutes.
                </li>
                <li id={id('glowfari')}>
                  <b>
                    <GuideEventLinkedTitle href={`/event/${IDS.glowfari}`} guideSlug={GS}>
                      Glowfari
                    </GuideEventLinkedTitle>{' '}
                    · Oakland Zoo · Nov 6–Jan 31, select nights.
                  </b>{' '}
                  Walk among glowing animal lanterns. Lantern displays rather than live zoo animals after
                  dark; timed tickets open 28 days ahead.
                </li>
                <li id={id('fairy-winterland')}>
                  <b>
                    <GuideEventLinkedTitle href={`/event/${IDS.fairyWinterland}`} guideSlug={GS}>
                      Fairy Winterland
                    </GuideEventLinkedTitle>{' '}
                    · Children&apos;s Fairyland, Oakland · Dec 12–13, 19–20 & 26–27.
                  </b>{' '}
                  Make holiday crafts, watch puppet shows, hear music from around the world, and visit
                  Black Santa. Ticketed.
                </li>
                <li id={id('north-pole-nights')}>
                  <b>
                    <GuideEventLinkedTitle href={`/event/${IDS.northPoleNights}`} guideSlug={GS}>
                      North Pole Nights
                    </GuideEventLinkedTitle>{' '}
                    · Gilroy Gardens · Nov 21–Dec 31, select evenings.
                  </b>{' '}
                  Explore glowing holiday lights, meet festive characters, watch live shows, and enjoy
                  seasonal rides. Ticketed.
                </li>
              </ul>
            </section>

            <section className="lgg-chapter" id={id('before')}>
              <h3 data-guide-section="before">💙 Before You Go</h3>
              <ul className="lgg-tips">
                <li>
                  <b>Want to stay close to home?</b> Start with free{' '}
                  <a className="lgl-textlink" href={`#${id('los-altos-tree')}`}>
                    city tree lightings
                  </a>{' '}
                  or{' '}
                  <a className="lgl-textlink" href={`#${id('christmas-tree-lane')}`}>
                    Christmas Tree Lane
                  </a>{' '}
                  once its dates are announced.
                </li>
                <li>
                  <b>Keeping bedtime in mind?</b>{' '}
                  <a className="lgl-textlink" href={`#${id('hiller-santa')}`}>
                    Santa&apos;s helicopter arrival
                  </a>
                  ,{' '}
                  <a className="lgl-textlink" href={`#${id('santas-tree-farm')}`}>
                    the tree farm
                  </a>
                  , and the daytime opening of the{' '}
                  <a className="lgl-textlink" href={`#${id('german-market')}`}>
                    German Holiday Market
                  </a>{' '}
                  offer earlier options.
                </li>
                <li>
                  <b>Planning ahead?</b>{' '}
                  <a className="lgl-textlink" href={`#${id('filoli')}`}>
                    Filoli
                  </a>
                  ,{' '}
                  <a className="lgl-textlink" href={`#${id('fantasy-of-lights')}`}>
                    Fantasy of Lights
                  </a>
                  , and popular regional light displays are worth checking for tickets early.
                </li>
                <li>
                  <b>Heading to a busy event?</b> Check parking or transit, restroom availability,
                  stroller routes, and weather before leaving.
                </li>
              </ul>
            </section>

            {suppressClosing ? null : (
              <section className="lgg-chapter" id={id('coming')}>
                <h3 data-guide-section="coming">More family discoveries are coming 🎭</h3>
                <div className="holiday-coming">
                  <article className="holiday-coming__card">
                    <h4>Holiday Stories & Play 🎭</h4>
                    <p>Family shows, stories, crafts, and winter play.</p>
                    <span className="holiday-coming__soon">Coming soon</span>
                  </article>
                  <article className="holiday-coming__card">
                    <h4>Hello, New Year! 🎉</h4>
                    <p>Balloon drops, January traditions, and little ways to welcome the new year.</p>
                    <span className="holiday-coming__soon">Coming soon</span>
                  </article>
                </div>

                <div className="holiday-email-cta">
                  <h4>Get the next guide in your inbox</h4>
                  <p>Seasonal guides and local discoveries for families with children ages 0–5.</p>
                  <button
                    type="button"
                    className="holiday-email-cta__btn"
                    onClick={() => openPuddlesPicksSignup('guide')}
                  >
                    Join the email list →
                  </button>
                </div>

                <p>
                  <Link className="lgl-textlink" to={HOLIDAY_EVENTS_HREF}>
                    Browse all holiday outings →
                  </Link>
                </p>
                <p className="lgg-disclaimer">
                  Event details may change. Check the organizer&apos;s latest information before
                  heading out.
                </p>
              </section>
            )}
          </div>
          {showRail ? <aside className="lgg-rail">{railAside}</aside> : null}
        </div>
        {afterBody}
      </div>
    </>
  )
}

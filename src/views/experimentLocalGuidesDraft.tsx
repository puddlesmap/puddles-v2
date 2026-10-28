import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { EventDetailLink } from '../components/EventDetailLink'
import { trackGuideSectionViewed, trackGuideShared } from '../utils/analytics'

const GuidePlacesMap = lazy(() =>
  import('../components/guides/GuidePlacesMap').then((mod) => ({
    default: mod.GuidePlacesMap,
  })),
)
import {
  HALLOWEEN_COLLECTION_PATH,
  HALLOWEEN_EVENTS_HREF,
  HALLOWEEN_GUIDE_POSTED,
  HALLOWEEN_GUIDE_READ,
  HALLOWEEN_GUIDE_SLUG,
} from '../data/halloweenGuide'
const COLLECTION = HALLOWEEN_COLLECTION_PATH
const GUIDE_SHARE_URL = 'https://puddlesmap.com/guides/halloween-with-little-ones'
const GUIDE_SHARE_TITLE = 'Halloween with Little Ones'

function GuideShare() {
  const [copied, setCopied] = useState(false)

  async function share() {
    trackGuideShared(HALLOWEEN_GUIDE_SLUG)
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

const JUMPS = [
  ['kind', 'Find your kind of Halloween outing'],
  ['free', '1. Free Halloween celebrations close to home'],
  ['schools', '2. School carnivals and costume parties'],
  ['parades', '3. Costume parades and downtown Halloween fun'],
  ['stories', '4. Stories, crafts, and Halloween creativity'],
  ['patches', '5. Pumpkin patches worth a little drive'],
  ['daytime', '6. Trick-or-treat before Halloween night'],
  ['traditions', '7. Famous Halloween traditions in Silicon Valley'],
  ['neighborhoods', '8. Neighborhoods known for trick-or-treating'],
  ['before', '9. What to know before trick-or-treating with little ones'],
] as const

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="lgl-textlink" href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  )
}

function eventIdFromHref(href: string): string {
  return href.replace(/^\/event\//, '')
}

function GuideEventLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <EventDetailLink
      eventId={eventIdFromHref(href)}
      guideSlug={HALLOWEEN_GUIDE_SLUG}
      className="lgl-textlink"
    >
      {children}
    </EventDetailLink>
  )
}

function OnPuddles({ href, image, label }: { href: string; image?: string; label: string }) {
  return (
    <>
      {image ? (
        <EventDetailLink
          eventId={eventIdFromHref(href)}
          guideSlug={HALLOWEEN_GUIDE_SLUG}
          className="lgg-event"
        >
          <img src={image} alt={label} />
        </EventDetailLink>
      ) : null}
      <EventDetailLink
        eventId={eventIdFromHref(href)}
        guideSlug={HALLOWEEN_GUIDE_SLUG}
        className="lgg-event lgg-event--text"
      >
        <span>
          <strong>{label}</strong>
          <span>Open on Puddles</span>
        </span>
      </EventDetailLink>
    </>
  )
}

function IconLine({
  label,
  text,
  continued = false,
}: {
  label: string
  text: string
  continued?: boolean
}) {
  if (!label) {
    return (
      <p className={continued ? 'lgg-iconline lgg-iconline--more' : 'lgg-iconline lgg-iconline--plain'}>
        {continued ? <b aria-hidden="true">Before you go:</b> : null}
        <span>{text}</span>
      </p>
    )
  }

  return (
    <p className="lgg-iconline">
      <b>{label}</b>
      <span>{text}</span>
    </p>
  )
}

function BeforeYouGo({ text }: { text: string }) {
  const lines = text.split(/(?<=\.)\s+/).filter(Boolean)
  if (lines.length < 2) {
    return <IconLine label="Before you go:" text={text} />
  }

  return (
    <div className="lgg-iconline lgg-before">
      <b>Before you go:</b>
      <ul className="lgg-tips">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  )
}

function Outing({
  title,
  when,
  children,
  why,
  cost,
  before,
  important,
  puddlesHref,
  image,
  links,
}: {
  title: string
  when: string
  children?: ReactNode
  why?: string
  cost?: string
  before?: string
  important?: string
  puddlesHref?: string
  image?: string
  links?: { href: string; label: string }[]
}) {
  return (
    <article className="lgg-out">
      <h4>{title}</h4>
      <p className="lgg-when">{when}</p>
      {children}
      {why ? <IconLine label="Why go:" text={why} /> : null}
      {cost ? <IconLine label="Cost:" text={cost} /> : null}
      {before ? <BeforeYouGo text={before} /> : null}
      {important ? <IconLine label="Important:" text={important} /> : null}
      {puddlesHref ? (
        <OnPuddles href={puddlesHref} image={image} label={title} />
      ) : (
        links?.map((link) => (
          <Ext key={link.href} href={link.href}>
            {link.label}
          </Ext>
        ))
      )}
    </article>
  )
}

export function HalloweenGuideDraft({
  idPrefix,
  jumps,
  rail,
  cover,
  showMap = false,
  heading = 'h2',
  share = false,
  afterCover,
  afterHero,
  afterBody,
  railAside,
  suppressHero = false,
  suppressCover = false,
  hideEventsCta = false,
}: {
  idPrefix: string
  jumps: boolean
  rail: boolean
  cover: string
  showMap?: boolean
  heading?: 'h1' | 'h2'
  share?: boolean
  afterCover?: ReactNode
  afterHero?: ReactNode
  afterBody?: ReactNode
  railAside?: ReactNode
  suppressHero?: boolean
  suppressCover?: boolean
  /** Review mockup replaces this box with the article header button. */
  hideEventsCta?: boolean
}) {
  const showRail = rail || Boolean(railAside)
  const id = (slug: string) => `${idPrefix}-${slug}`
  const Title = heading

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.location.pathname.startsWith('/guides/')) return

    const seen = new Set<string>()
    function view(sectionId: string) {
      if (!sectionId || seen.has(sectionId)) return
      seen.add(sectionId)
      trackGuideSectionViewed(HALLOWEEN_GUIDE_SLUG, sectionId)
    }

    const nodes = document.querySelectorAll<HTMLElement>('[data-guide-section]')
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const sectionId = (entry.target as HTMLElement).dataset.guideSection
          if (sectionId) view(sectionId)
        }
      },
      { threshold: 0.6 },
    )
    nodes.forEach((node) => observer.observe(node))

    function onClick(event: MouseEvent) {
      const link = (event.target as Element | null)?.closest?.('a[href^="#"]')
      if (!link || !(link.closest('.lgg-jumps') || link.closest('.gct-index'))) return
      const hash = link.getAttribute('href')?.slice(1) ?? ''
      const prefix = `${idPrefix}-`
      if (hash.startsWith(prefix)) view(hash.slice(prefix.length))
    }
    document.addEventListener('click', onClick)
    return () => {
      observer.disconnect()
      document.removeEventListener('click', onClick)
    }
  }, [idPrefix])

  return (
    <>
      {suppressHero ? null : (
        <div className="lgg-hero">
          <p className="lgl-eyebrow">October guide · South Peninsula 2026</p>
          <Title>Halloween with Little Ones</Title>
          <p className="lgg-dek">
            Halloween falls on Saturday, October 31 this year, but the fun starts well before! From
            neighborhood parades and pumpkin patches to costume parties and beloved trick-or-treating
            streets, discover ways to celebrate with little ones ages 0–5 around Palo Alto, Los
            Altos, Mountain View, Sunnyvale, and beyond.
          </p>
          <p className="lgg-date">
            {HALLOWEEN_GUIDE_POSTED}
            <span className="lgg-read"> · {HALLOWEEN_GUIDE_READ}</span>
            {share ? <GuideShare /> : null}
          </p>
        </div>
      )}
      {afterHero}
      {suppressCover ? null : <img className="lgg-cover" src={cover} alt="" />}
      {afterCover}
      <div className="lgg-body">
        {hideEventsCta ? null : (
          <Link className="guide-events-cta" to={HALLOWEEN_EVENTS_HREF}>
            <span className="guide-events-cta__title">Looking for Halloween plans? 🎃</span>
            <span className="guide-events-cta__body">
              Explore upcoming events, dates, and details for little ones nearby.
            </span>
            <span className="guide-events-cta__action">Browse Halloween events →</span>
          </Link>
        )}
        {jumps ? (
          <nav className="lgg-jumps" id={id('index')} aria-label="On this guide">
            <p className="lgg-jumps-label">Sections</p>
            <ol>
              {JUMPS.map(([slug, label]) => (
                <li key={slug}>
                  <a href={`#${id(slug)}`}>{label}</a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <div className={showRail ? 'lgg-layout lgg-layout--rail' : 'lgg-layout'}>
          <div>
            <h3 id={id('kind')} data-guide-section="kind">Find your kind of Halloween outing</h3>
            <ul className="lgg-fit-picks">
              <li>
                <b>For kids who love making things: </b>{' '}
                <GuideEventLink href="/event/family-fun-days-los-altos-community-center-2026-10-24-10-00">
                  Halloween Hoopla in Los Altos
                </GuideEventLink>{' '}
                (Oct 24) offers crafts, games, and a scavenger hunt. For ages 3–5,{' '}
                <GuideEventLink href="/event/otto-family-club-jack-o-lantern-2026-10-29">
                  Jack-O-Lantern Process Art
                </GuideEventLink>{' '}
                (Oct 29) is another hands-on option.
              </li>
              <li>
                <b>For a first taste of trick-or-treating: </b>{' '}
                <GuideEventLink href="/event/seasonal-drive-belle-haven-trunk-or-treat-2026-10-28">
                  Menlo Park Trunk-or-Treat
                </GuideEventLink>{' '}
                (Oct 28, 4:30–6 PM) and{' '}
                <GuideEventLink href="/event/disc-a-boo-tiful-downtown-halloween-2026-10-30-watchlist-dtla-halloween-2026-10-30">
                  A BOO-tiful Downtown Halloween in Los Altos
                </GuideEventLink>{' '}
                (Oct 30, noon–4 PM) have a set place and time before Halloween night.
              </li>
              <li>
                <b>For a big costume celebration: </b>{' '}
                <GuideEventLink href="/event/monster-bash-rengstorff-park-2026-10-24-10-00">
                  Monster Bash in Mountain View
                </GuideEventLink>{' '}
                or{' '}
                <GuideEventLink href="/event/seasonal-drive-menlo-park-halloween-hoopla-2026-10-24">
                  Menlo Park Halloween Hoopla
                </GuideEventLink>
                , both on Oct 24, bring lots of activities. Plan for parking and crowds.
              </li>
              <li>
                <b>For outdoor fun at your own pace: </b>{' '}
                <GuideEventLink href="/event/seasonal-drive-farmer-johns-pumpkin-farm-2026-09-04">
                  Farmer John&apos;s Pumpkin Farm
                </GuideEventLink>{' '}
                is a pumpkin-picking outing;{' '}
                <GuideEventLink href="/event/watchlist-sunnyvale-spooky-storywalk-2026-10-28">
                  Sunnyvale&apos;s Spooky StoryWalk
                </GuideEventLink>{' '}
                (Oct 28) combines a Halloween story and a park walk. Neither is guaranteed quiet, but
                you can keep the visit short.
              </li>
            </ul>
            <h3 id={id('prep')}>Before you go</h3>
            <ul className="lgg-fit-picks">
              <li>
                <b>Admission: </b>Free entry does not always mean free games. Many school carnivals
                sell tickets or wristbands.
              </li>
              <li>
                <b>Parking: </b>Allow extra time for walking at large park festivals, school
                campuses, and downtown parades. Check each organizer&apos;s latest arrival
                instructions.
              </li>
              <li>
                <b>Registration and supplies: </b>Some crafts are first come, first served; ticketed
                and member-only activities have separate entry rules.
              </li>
              <li>
                <b>Timing: </b>Downtown and trunk-or-treat events have set hours. Residential
                trick-or-treating does not follow a universal schedule.
              </li>
              <li>
                <b>Pumpkin-patch costs: </b>Check admission, parking, pumpkins, and ride tickets
                separately.
              </li>
            </ul>

            <section className="lgg-chapter" id={id('free')}>
              <h3 data-guide-section="free">1. Free Halloween celebrations close to home</h3>
              <Outing
                title="Monster Bash — Mountain View"
                when="Saturday, October 24 · 10 AM–2 PM · Free"
                why="A full morning of Halloween fun, with several activities in one location."
                before="Parking is limited. Food is available for purchase."
                puddlesHref="/event/monster-bash-rengstorff-park-2026-10-24-10-00"
                links={[
                  {
                    href: 'https://www.mountainview.gov/our-city/departments/community-services/special-events/monster-bash',
                    label: 'Official event details',
                  },
                ]}
              >
                <p>
                  Rengstorff Park turns into a Halloween celebration with a Treat Trail, games, live
                  entertainment, inflatables, and activities for younger children.
                </p>
              </Outing>
              <Outing
                title="Halloween Hoopla — Los Altos"
                when="Saturday, October 24 · 10 AM–1 PM · Free"
                why="A hands-on Halloween morning for children who like crafts, games, movies, and scavenger hunts."
                before="No registration required. Craft supplies are first come, first served, so arrive earlier if making things is the main attraction."
                image="https://www.losaltosca.gov/ImageRepository/Document?documentID=2763"
                puddlesHref="/event/family-fun-days-los-altos-community-center-2026-10-24-10-00"
              >
                <p>Los Altos Community Center, 97 Hillview Avenue.</p>
              </Outing>
              <Outing
                title="Magical Bridge Costume Party — Palo Alto"
                when="Sunday, October 25 · 10 AM–1 PM · Free"
                why="An inclusive celebration welcoming children of all ages and abilities."
                puddlesHref="/event/core-weekend-magical-bridge-halloween-costume-party-2026-10-25"
              >
                <p>
                  Dress up for music, sensory-friendly science play, trick-or-treat bag decorating,
                  and a costume dance party at Magical Bridge Playground.
                </p>
              </Outing>
            </section>

            <section className="lgg-chapter" id={id('schools')}>
              <h3 data-guide-section="schools">2. School carnivals and costume parties</h3>
              <p>
                School carnivals offer rides, games, crafts, and local traditions, but many
                activities use paid tickets or wristbands. <b>Before you go: </b>Campus parking
                arrangements and visitor-entry policies vary. Published event details don&apos;t
                consistently specify parking or crowd levels, so check with the organizers, allow time
                to walk from legal parking, and expect lines for popular games.
              </p>
              <Outing
                title="Witches’ Delight — Santa Rita Elementary, Los Altos"
                when="Saturday, October 24 · 2–7 PM"
                cost="Free entry; activities and food use tickets. Wristbands cover eligible rides and games, excluding Cake Jam, food, and merchandise."
                before="The Los Altos School District community is welcome. Buying tickets or wristbands ahead can simplify arrival. Allow extra time for parking and popular activity lines; a dedicated event-parking plan was not confirmed."
                image="/events/witches-delight-2026.png"
                puddlesHref="/event/core-weekend-santa-rita-witches-delight-2026-10-24"
                links={[
                  {
                    href: 'https://www.santaritaschool.org/witches-delight',
                    label: 'Official Witches’ Delight details',
                  },
                ]}
              >
                <p>
                  This long-running Santa Rita celebration includes rides, bounce houses, a dunk
                  tank, costume contests, and Cake Jam.
                </p>
              </Outing>
              <Outing
                title="Harvest Carnival — Duveneck Elementary, Palo Alto"
                when="Saturday, October 24 · 2:30–5 PM"
                cost="$20 advance child's wristband for ages 4 and up."
                before="Buy the wristband in advance on the Duveneck PTA page. That page prices ages 4 and up, and it does not list a younger-child wristband or a campus parking plan."
                image="/events/duveneck-harvest-carnival-2026.jpg"
                puddlesHref="/event/core-weekend-duveneck-harvest-carnival-2026-10-24"
                links={[
                  {
                    href: 'https://duveneck.pausd.org/school-life/calendar',
                    label: 'Duveneck school calendar',
                  },
                ]}
              >
                <p>Games, a petting zoo, crafts, face painting, and a haunted house.</p>
              </Outing>
              <Outing
                title="Fall Festival — Cherry Chase Elementary, Sunnyvale"
                when="Friday, October 30 · 2:30–4:30 PM"
                cost="Save by purchasing tickets in advance through the Cherry Chase PTA store, or buy them for $1 each at the Friday booth (2:15–4:30 PM)."
                before="Pre-sale pickup is Monday–Thursday, October 26–29, 8:00–8:30 AM at the blue tables outside the multi. No Friday morning ticket sales. Online sales end Thursday, October 29 at 5 PM."
                puddlesHref="/event/core-weekend-cherry-chase-fall-festival-2026-10-30"
                links={[
                  {
                    href: 'https://cherrychase.sesd.org/about-us/cherry-calendar',
                    label: 'Cherry Chase school calendar',
                  },
                ]}
              >
                <p>Games, crafts, face painting, balloon art, photos, food, and pumpkins.</p>
              </Outing>
              <Outing
                title="Halloween Magic — Gamble Garden, Palo Alto"
                when="Saturday, October 24 · 10:30–11:30 AM"
                cost="$36–$55 per person, depending on age and membership."
                why="A shorter, ticketed Halloween experience in a garden setting."
                image="https://www.gamblegarden.org/wp-content/uploads/2018/09/mini-pumpkins-890x890.jpg"
                puddlesHref="/event/disc-halloween-magic-at-gamble-garden-2026-10-24-watchlist-gamble-halloween-magic-2026-10"
                links={[
                  {
                    href: 'https://www.gamblegarden.org/event/halloween/',
                    label: 'Official event details',
                  },
                ]}
              >
                <p>A Halloween garden celebration with a magic show, crafts, face painting, and family activities.</p>
              </Outing>
            </section>

            <section className="lgg-chapter" id={id('parades')}>
              <h3 data-guide-section="parades">3. Costume parades and downtown Halloween fun</h3>
              <Outing
                title="Halloween Hoopla Parade & Carnival — Menlo Park"
                when="Saturday, October 24 · Parade at 11 AM · Free"
                before="Expect a busy downtown. Plan extra time for parking and walking."
                image="https://www.menlopark.gov/files/sharedassets/public/v/1/library-and-community-services/images/events/children-in-costume-on-santa-cruz-avenue-sidewalk-for-halloween-hoopla-downtown-merchant-trick-or-treating-and-parade.jpg"
                puddlesHref="/event/seasonal-drive-menlo-park-halloween-hoopla-2026-10-24"
                links={[
                  {
                    href: 'https://www.menlopark.gov/Government/Departments/Library-and-Community-Services/Events/Community-events/Halloweek',
                    label: 'Official event details',
                  },
                ]}
              >
                <p>
                  Join the costume parade down Santa Cruz Avenue, followed by a carnival in Fremont
                  Park with games, crafts, entertainment, and participating downtown businesses
                  offering treats.
                </p>
              </Outing>
              <Outing
                title="Creepy Crawly Halloween — Downtown Campbell"
                when="Sunday, October 25 · 4–6 PM · Free"
                before="Streets can be crowded, and participating businesses may run out of treats."
                image="https://www.downtowncampbell.com/sites/default/files/inline-images/creepy-crawly-halloween-sidebanner.png"
                puddlesHref="/event/seasonal-drive-creepy-crawly-campbell-2026-10-25"
                links={[
                  {
                    href: 'https://www.downtowncampbell.com/event/2026/10/creepy-crawly-halloween-trick-or-treat',
                    label: 'Official event information',
                  },
                ]}
              >
                <p>
                  One of the South Bay’s popular downtown Halloween celebrations. Families in costume
                  can visit participating businesses to collect candy.
                </p>
              </Outing>
            </section>

            <section className="lgg-chapter" id={id('stories')}>
              <h3 data-guide-section="stories">4. Stories, crafts, and Halloween creativity</h3>
              <p>Looking for something besides a busy costume parade? These are a different way to celebrate.</p>
              <Outing
                title="Jack O’Lantern Jamboree! — Palo Alto"
                when="Wednesday, October 28 · 4–5 PM · Free"
                image="https://paloalto.bibliocommons.com/events/uploads/images/full/708303319d31762236c6c664027dbc27/halloween.jpg"
                puddlesHref="/event/disc-jack-o-lantern-jamboree-2026-10-28-698e5b7094297d3600abe212"
              >
                <p>A children’s Halloween dance party with crafts at the Palo Alto Children’s Library Secret Garden.</p>
              </Outing>
              <Outing
                title="Spooky StoryWalk — Sunnyvale"
                when="Wednesday, October 28 · 4–6 PM · Free"
                why="A combination of outdoor movement, reading, and seasonal play."
                puddlesHref="/event/watchlist-sunnyvale-spooky-storywalk-2026-10-28"
              >
                <p>Walk through Columbia Park following a Halloween story, with a craft available while supplies last.</p>
              </Outing>
              <Outing
                title="Jack-O-Lantern Process Art — Sunnyvale"
                when="Thursday, October 29 · 4:30 PM · Paid"
                before="Check drop-in eligibility and booking availability with the provider."
                image="https://images.lumacdn.com/event-covers/p8/b2a87a24-615a-42c6-820b-dd2b03f43c63.jpg"
                puddlesHref="/event/otto-family-club-jack-o-lantern-2026-10-29"
              >
                <p>A pumpkin-inspired art experience at Otto Family Club for children ages 3–5.</p>
              </Outing>
              <Outing
                title="Halloween Zoo Night — Palo Alto"
                when="Thursday, October 29 · 5–7 PM · $30 per person"
                important="Members only. No tickets at the door, and guest passes are not valid."
                image="https://www.paloaltozoo.org/files/assets/jmz/v/1/home/halloween-icon-image.png?w=1200"
                puddlesHref="/event/core-weekend-halloween-zoo-night-2026-10-29"
                links={[
                  {
                    href: 'https://www.paloaltozoo.org/Visit/Events/Halloween-Zoo-Night',
                    label: 'Official event details',
                  },
                ]}
              >
                <p>
                  An after-hours Halloween experience at the Palo Alto Junior Museum & Zoo with animal
                  encounters and festive activities.
                </p>
              </Outing>
            </section>

            <section className="lgg-chapter" id={id('patches')}>
              <h3 data-guide-section="patches">5. Pumpkin patches worth a little drive</h3>
              <p>For families who want an outdoor fall adventure, a pumpkin patch can be the main event.</p>
              <Outing
                title="Farmer John’s Pumpkin Farm — Half Moon Bay"
                when="Daily · 9 AM–6 PM"
                cost="Free admission and parking. Pumpkins are purchased separately."
                why="Perfect for families who want to pick pumpkins, take fall photos, and enjoy a classic farm setting without the rides and carnival attractions."
                image="https://www.farmerjohnspumpkins.com/sites/default/files/backgrounds/fj_0.jpg"
                puddlesHref="/event/seasonal-drive-farmer-johns-pumpkin-farm-2026-09-04"
                links={[{ href: 'https://www.farmerjohnspumpkins.com/node/1', label: 'Official website' }]}
              >
                <p>Pumpkins, open-air farm scenery, and room for a fall family outing.</p>
              </Outing>
              <Outing
                title="Spina Farms Pumpkin Patch — Morgan Hill"
                when="Open through November 2"
                cost="Free admission. Attractions are paid separately."
                before="Closed-toe shoes are recommended for the working-farm setting. Attraction tickets are purchased on-site. Parking is $30 cash on Fridays, Saturdays, and Sundays, and generally free Monday–Thursday except holidays."
                image="https://spinafarmspumpkinpatch.com/wp-content/uploads/2026/05/spina-hero-may-update-1.jpg"
                puddlesHref="/event/seasonal-drive-spina-farms-pumpkin-patch-2026-09-17"
                links={[{ href: 'https://spinafarmspumpkinpatch.com/', label: 'Official website' }]}
              >
                <p>Known for expansive pumpkin fields, rides, train experiences, and dinosaur-themed attractions.</p>
              </Outing>
              <Outing
                title="Rancho Siempre Verde Fall Fest — Pescadero"
                when="Final weekend: October 24–25 · 9 AM–4:30 PM"
                cost="Tickets required. Check admission packages before visiting."
                before="Coastal weather can be cool and changeable."
                image="https://images.squarespace-cdn.com/content/v1/5ee66f0e0caf8e3541fa362d/782afd10-ad03-4047-82b4-5f6ee49c8017/Banner.jpg"
                puddlesHref="/event/seasonal-drive-rancho-siempre-verde-fall-fest-2026-09-26"
                links={[{ href: 'https://www.rsvtrees.com/', label: 'Official farm website' }]}
              >
                <p>Tree swings, outdoor play, and seasonal farm activities near the coast.</p>
              </Outing>
            </section>

            <section className="lgg-chapter" id={id('daytime')}>
              <h3 data-guide-section="daytime">6. Trick-or-treat before Halloween night</h3>
              <p>
                Trick-or-treating doesn&apos;t have to happen after dark. These daytime and
                early-evening events make it easier to celebrate at a set place and time, especially
                for a first Halloween outing.
              </p>
              <Outing
                title="Menlo Park Trunk-or-Treat"
                when="Wednesday, October 28 · 4:30–6 PM · Free · Belle Haven Community Campus"
                image="https://www.menlopark.gov/files/sharedassets/public/v/2/library-and-community-services/images/events/trunkortreat.png"
                puddlesHref="/event/seasonal-drive-belle-haven-trunk-or-treat-2026-10-28"
                links={[
                  {
                    href: 'https://www.menlopark.gov/Citywide-calendar/Community-events/20261028-Trunk-or-Treat',
                    label: 'Official event details',
                  },
                ]}
              >
                <p>Walk between decorated cars, enjoy costumes, and collect treats at an early-evening event.</p>
              </Outing>
              <Outing
                title="Hiller Aviation Museum Trunk-or-Treat — San Carlos"
                when="Thursday, October 29 · 5–7 PM · Free · 601 Skyway Road"
                before="Trunk-or-treat is free and does not need registration. The museum's indoor Haunted Hangar has a separate admission charge."
                puddlesHref="/event/seasonal-drive-hiller-trunk-or-treat-2026-10-29"
              >
                <p>Collect treats beside decorated airplanes and cars. Costumes are encouraged.</p>
              </Outing>
              <Outing
                title="A BOO-tiful Downtown Halloween"
                when="Friday, October 30 · Noon–4 PM · Free · Downtown Los Altos"
                why="A daytime alternative to visiting residential houses after dark."
                image="https://upload.wikimedia.org/wikipedia/commons/2/2f/Los_Altos_Main_Street_2.jpg"
                puddlesHref="/event/disc-a-boo-tiful-downtown-halloween-2026-10-30-watchlist-dtla-halloween-2026-10-30"
                links={[
                  {
                    href: 'https://downtownlosaltos.org/event/bootiful-downtown-halloween/',
                    label: 'Official event details',
                  },
                ]}
              >
                <p>
                  Visit participating downtown shops displaying orange pumpkin signs to collect
                  treats. Family activities at Veterans Community Plaza are scheduled for the
                  afternoon.
                </p>
              </Outing>
              <Outing
                title="Howl'Oween Fun — Rancho Shopping Center"
                when="Saturday, October 31 · 10:30 AM–12:30 PM · 600 Foothill Expressway"
                puddlesHref="/event/rancho-shopping-center-howloween-2026-10-31"
                links={[{ href: 'https://www.visitrancho.com/events.html', label: 'Official event details' }]}
              >
                <p>Trick-or-treat at the shopping center and watch the pet costume contest.</p>
              </Outing>
              <Outing
                title="Halloween on Cal Ave"
                when="Saturday, October 31 · 10:00 AM–1:00 PM · Free · California Avenue"
                before="No ticket. Parking is in the Cal Ave lots and the garage at 350 Sherman."
                image="/events/halloween-on-cal-ave-2026.jpg"
                puddlesHref="/event/halloween-on-cal-ave-2026-10-31"
                links={[
                  {
                    href: 'https://www.paloalto.gov/Events-Directory/City-Manager/Thursday-Live-on-Cal-Ave.-October-31',
                    label: 'Official event details',
                  },
                ]}
              >
                <p>
                  Children’s music, face painting, balloon twisting, a police vehicle, and a horse
                  are on the car-free blocks.
                </p>
              </Outing>
              <Outing
                title="Mountain View Public Library Halloween Trick-or-Treat"
                when="Saturday, October 31 · 10 AM–6 PM · Free · 585 Franklin Street"
                before="Drop in during library hours; this is self-paced treat pickup, not a scheduled performance. Costumes are optional."
                puddlesHref="/event/core-weekend-mv-library-halloween-trick-or-treat-2026-10-31"
              >
                <p>
                  Children can collect <b>non-food Halloween treats from several stations inside the library</b>{' '}
                  instead of going door to door. Visit the Children&apos;s Room, Teen Zone,
                  Second Floor Reference Desk, or Customer Service; the Friends of the Library shop
                  participates when open.
                </p>
              </Outing>
              <Outing
                title="Trick or Treat on Castro Street"
                when="Saturday, October 31 · 2:00–4:00 PM · Castro Street, Mountain View"
                before="Monte Carlo’s haunted house is a separate signup."
                image="/events/trick-or-treat-castro-street-2026.jpg"
                puddlesHref="/event/trick-or-treat-castro-street-2026-10-31"
                links={[{ href: 'https://chambermv.org/seasonal-events/', label: 'Official event details' }]}
              >
                <p>Collect treats from the downtown shops on the trick-or-treat map.</p>
              </Outing>
              <Outing
                title="Halloween Spooktacular — Stanford Shopping Center"
                when="Saturday, October 31 · 2:00–4:00 PM · Center Pavilion"
                before="Start at Center Pavilion, near Tiffany & Co. and Macy’s. Look for pumpkins outside participating stores."
                image="/events/stanford-shopping-center-halloween-spooktacular-2026.jpg"
                puddlesHref="/event/stanford-shopping-center-halloween-spooktacular-2026-10-31"
                links={[
                  {
                    href: 'https://www.simon.com/mall/stanford-shopping-center/stream/halloween-spooktacular-6290412',
                    label: 'Official event details',
                  },
                ]}
              >
                <p>
                  Collect candy from stores with pumpkins outside, and stop at the pavilion for
                  activities, giveaways, and sweet surprises.
                </p>
              </Outing>
              <Outing
                title="Halloween Bray Parade"
                when="Saturday, October 31 · Meet at Bol Park at 3:30 PM"
                before="Questions go to the Barron Park Association. The site does not have a separate 2026 event page."
                image="/events/halloween-bray-parade-2026.jpg"
                puddlesHref="/event/halloween-bray-parade-bol-park-2026-10-31"
                links={[{ href: 'https://bpapaloalto.org/', label: 'Barron Park Association' }]}
              >
                <p>Meet in Bol Park for the neighborhood Halloween parade.</p>
              </Outing>
            </section>

            <section className="lgg-chapter" id={id('traditions')}>
              <h3 data-guide-section="traditions">7. Famous Halloween traditions in Silicon Valley</h3>
              {showMap ? (
                <Suspense fallback={<div className="guide-map__canvas" aria-hidden="true" />}>
                  <GuidePlacesMap idPrefix={idPrefix} />
                </Suspense>
              ) : null}
              <p>
                From Old Palo Alto&apos;s legendary displays to other decorated neighborhood streets,
                some neighborhoods have become Halloween landmarks. These are{' '}
                <b>residential traditions, not scheduled public events</b>; individual displays and
                hours for 2026 are not guaranteed.
              </p>

              <article className="lgg-out">
                <h4 id={id('old-palo-alto')}>Old Palo Alto — The Steve Jobs Halloween Tradition</h4>
                <p className="lgg-when">Area: Waverley Street & Santa Rita Avenue</p>
                <p>
                  One of Palo Alto’s most beloved Halloween traditions. Steve Jobs and his family
                  were known for elaborate decorations, carved pumpkins, and long lines of
                  trick-or-treaters. The family continued the tradition after his passing, helping
                  make Old Palo Alto a favorite Halloween destination.
                </p>
                <p className="lgg-expect">
                  <b>What to expect: </b>
                  Beautiful historic homes, festive decorations, and lively crowds.
                </p>
                <p>
                  <b>2026 status: </b>
                  Individual household participation and street closures have not been confirmed.
                </p>
              </article>

              <article className="lgg-out">
                <h4 id={id('addison')}>Addison Avenue — another Palo Alto Halloween tradition</h4>
                <p className="lgg-when">Area: Addison Avenue, Palo Alto</p>
                <p>
                  Another street associated with elaborate Halloween celebrations and notable Silicon
                  Valley residents, including past festivities linked to former Yahoo CEO Marissa Mayer.
                </p>
                <p className="lgg-expect">
                  <b>What to expect: </b>
                  A residential setting with a history of creative holiday displays.
                </p>
                <p>
                  <b>2026 status: </b>
                  Specific homeowners’ participation is not confirmed. This is a neighborhood
                  tradition, not a scheduled public attraction.
                </p>
              </article>

            </section>

            <section className="lgg-chapter" id={id('neighborhoods')}>
              <h3 data-guide-section="neighborhoods">8. Neighborhoods known for trick-or-treating</h3>
              <p>
                These neighborhoods are local favorites based on past celebrations, not confirmed 2026
                events. <b>Before you go: </b>Participating homes, decorations, hours, parking, and
                street closures can vary. Check local notices and don&apos;t assume a block is
                car-free.
              </p>
              <p className="lgg-when">
                <b>Halloween night: </b>Saturday, October 31, 2026.
              </p>

              <h4>Palo Alto</h4>
              <p>
                <b>Old Palo Alto — Waverley Street: </b>
                Famous for festive homes and large crowds; some blocks have historically been closed
                to cars.
              </p>
              <p id={id('professorville')}>
                <b>Professorville: </b>
                Historic homes and traditional neighborhood trick-or-treating.
              </p>
              <p id={id('crescent-park')}>
                <b>Crescent Park: </b>
                Historic homes and traditional neighborhood trick-or-treating.
              </p>

              <h4>Los Altos</h4>
              <p id={id('orange')}>
                <b>Orange Avenue and nearby streets: </b>
                Old Los Altos streets with a history of decorations and community celebrations.
              </p>

              <h4>Mountain View</h4>
              <p id={id('mercy-bush')}>
                <b>Old Mountain View — Mercy-Bush Park area: </b>
                Often recommended for a walkable neighborhood outing.
              </p>
              <p id={id('shoreline-west')}>
                <b>Shoreline West: </b>
                A neighborhood mentioned by local families for Halloween decorations.
              </p>
              <p id={id('whisman')}>
                <b>Whisman Station: </b>
                Close-set homes and pedestrian paths may make a shorter walk easier with children.
              </p>

              <h4>Los Gatos</h4>
              <p id={id('tait')}>
                <b>Tait Avenue — Almond Grove: </b>
                A long-standing destination for decorated homes and lively trick-or-treating.
              </p>
              <p id={id('johnson')}>
                <b>Johnson Avenue: </b>
                Another popular Halloween street. The town has planned traffic control in the area;
                check final notices for exact closures.
              </p>

              <h4>More Bay Area neighborhood traditions</h4>
              <p id={id('pope')}>
                <b>Pope Street — Menlo Park: </b>
                A locally known trick-or-treating spot in The Willows.
              </p>
              <p id={id('cabrillo')}>
                <b>Cabrillo Avenue — Burlingame: </b>
                A residential tradition in Easton Addition.
              </p>
              <p id={id('belvedere')}>
                <b>Belvedere Street — Cole Valley, San Francisco: </b>
                Decorations, crowds, and hills.
              </p>
              <p id={id('fair-oaks')}>
                <b>Fair Oaks Street — San Francisco: </b>
                A relatively flat residential Halloween stroll.
              </p>
            </section>

            <section className="lgg-chapter" id={id('before')}>
              <h3 data-guide-section="before">9. What to know before trick-or-treating with little ones</h3>
              <p>
                Traditional door-to-door trick-or-treating takes place on <b>Saturday, October 31, 2026</b>.
              </p>
              <p>Individual neighborhoods and homes set their own participation hours. There is no universal start time.</p>
              <p>
                For families with toddlers or preschoolers, starting around 5:30–6 PM may help you
                finish before the evening gets too late.
              </p>
              <p className="lgg-tips-lead">
                <b>A few planning tips:</b>
              </p>
              <ul className="lgg-tips">
                <li>Pick one walkable neighborhood rather than traveling between several crowded streets.</li>
                <li>Visit houses that clearly welcome trick-or-treaters.</li>
                <li>Bring a flashlight or reflective accessories for visibility.</li>
                <li>Expect long lines in famous Halloween neighborhoods.</li>
                <li>Avoid blocking driveways or entering private property outside the invited route.</li>
                <li>Check candy and small treats for age-appropriate choking hazards.</li>
                <li>Let your child’s comfort determine how long you stay.</li>
              </ul>
              <p>
                If your child is not ready for door-to-door trick-or-treating, daytime downtown
                celebrations and library activities are strong alternatives.
              </p>
            </section>

            <section className="lgg-chapter lgg-more" id={id('more')}>
              <h3>More Halloween adventures on Puddles</h3>
              <p>
                There are many ways to celebrate Halloween with little ones, from a morning in costume
                to an evening walk through a decorated neighborhood. Puddles — The Tot Map brings
                together local activities for families with children ages 0–5 around Palo Alto, Los
                Altos, Mountain View, Sunnyvale, and nearby communities.
              </p>
              <Link className="lgg-related" to="/">
                <b>Discover more family activities on Puddles</b>
              </Link>
              <p className="lgg-disclaimer">
                Event times, admission prices, neighborhood participation, and street-closure details may
                change. Verify organizer information before visiting.
              </p>
            </section>
            <div className="lgg-end" aria-hidden="true" />
          </div>
          {showRail ? (
            <aside className="lgg-rail" aria-label="Plan this">
              {railAside ?? (
                <>
                  <h3>Plan this month</h3>
                  <ul>
                    <li>October 24–31, 2026</li>
                    <li>Ages 0–5</li>
                    <li>Halloween night is Saturday</li>
                    <li>One neighborhood is enough</li>
                    <li>Open each event for this year’s hours</li>
                  </ul>
                  <Link className="lgl-textlink" to={COLLECTION}>
                    Halloween picks →
                  </Link>
                </>
              )}
            </aside>
          ) : null}
        </div>
        {afterBody}
      </div>
    </>
  )
}

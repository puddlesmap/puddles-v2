import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BeforeYouGoIcon } from '../components/event-detail/BeforeYouGoIcon'
import { GuidePlacesMap } from '../components/guides/GuidePlacesMap'
import {
  HALLOWEEN_COLLECTION_PATH,
  HALLOWEEN_GUIDE_CHART,
  HALLOWEEN_GUIDE_POSTED,
} from '../data/halloweenGuide'
import type { TipIconKind } from '../utils/eventTips'

const COLLECTION = HALLOWEEN_COLLECTION_PATH

const JUMPS = [
  ['free', 'Free events'],
  ['schools', 'Carnivals'],
  ['parades', 'Downtown'],
  ['stories', 'Stories'],
  ['patches', 'Patches'],
  ['daytime', 'Daytime treats'],
  ['traditions', 'Traditions'],
  ['neighborhoods', 'Neighborhoods'],
  ['before', 'Before you go'],
  ['fit', 'Which plan'],
] as const

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="lgl-textlink" href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  )
}

function OnPuddles({ href, image, label }: { href: string; image?: string; label: string }) {
  return (
    <Link className={image ? 'lgg-event' : 'lgg-event lgg-event--text'} to={href}>
      {image ? <img src={image} alt="" /> : null}
      <span>
        <strong>{label}</strong>
        <span>Open on Puddles</span>
      </span>
    </Link>
  )
}

function iconFor(text: string): TipIconKind {
  const value = text.toLowerCase()
  if (value.includes('food') || value.includes('candy')) return 'food'
  if (value.includes('crowd') || value.includes('busy') || value.includes('line')) return 'crowds'
  if (value.includes('weather') || value.includes('coast') || value.includes('cool')) return 'weather'
  if (value.includes('stroller')) return 'stroller'
  if (value.includes('noise') || value.includes('loud') || value.includes('sound')) return 'sound'
  if (
    value.includes('toddler') ||
    value.includes('baby') ||
    value.includes('preschool') ||
    value.includes('ages')
  ) {
    return 'baby'
  }
  if (
    value.includes('ticket') ||
    value.includes('wristband') ||
    value.includes('admission') ||
    value.includes('paid') ||
    value.includes('$')
  ) {
    return 'ticket'
  }
  return 'info'
}

function IconLine({ kind, label, text }: { kind: TipIconKind; label: string; text: string }) {
  return (
    <p className="lgg-iconline">
      <BeforeYouGoIcon kind={kind} />
      <span>
        {label ? <b>{label} </b> : null}
        {text}
      </span>
    </p>
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
      {why ? <IconLine kind={iconFor(why)} label="Why go:" text={why} /> : null}
      {cost ? <IconLine kind="ticket" label="Cost:" text={cost} /> : null}
      {before
        ? before
            .split(/(?<=\.)\s+/)
            .filter(Boolean)
            .map((line) => <IconLine key={line} kind={iconFor(line)} label="Before you go:" text={line} />)
        : null}
      {important ? <IconLine kind="info" label="Important:" text={important} /> : null}
      {links?.map((link) => (
        <Ext key={link.href} href={link.href}>
          {link.label}
        </Ext>
      ))}
      {puddlesHref ? <OnPuddles href={puddlesHref} image={image} label={title} /> : null}
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
}: {
  idPrefix: string
  jumps: boolean
  rail: boolean
  cover: string
  showMap?: boolean
  heading?: 'h1' | 'h2'
}) {
  const id = (slug: string) => `${idPrefix}-${slug}`
  const Title = heading

  return (
    <>
      <div className="lgg-hero">
        <p className="lgl-eyebrow">October guide</p>
        <Title>Halloween with Little Ones: Your 2026 South Peninsula Guide</Title>
        <p className="lgg-dek">
          From community costume parties to famous Halloween streets, here is how to celebrate with
          little ones around Palo Alto, Los Altos, Mountain View, Sunnyvale, and beyond.
        </p>
        <p className="lgg-date">{HALLOWEEN_GUIDE_POSTED}</p>
      </div>
      <img className="lgg-cover" src={cover} alt="" />
      <div className="lgg-body">
        {jumps ? (
          <nav className="lgg-jumps" aria-label="On this guide">
            {JUMPS.map(([slug, label]) => (
              <a key={slug} href={`#${id(slug)}`}>
                {label}
              </a>
            ))}
          </nav>
        ) : null}
        <div className={rail ? 'lgg-layout lgg-layout--rail' : 'lgg-layout'}>
          <div>
            <p className="lgg-copy">
              Halloween lands on a Saturday this year, giving families a whole weekend to celebrate.
              Around the South Peninsula, the festivities start long before October 31.
            </p>
            <p className="lgg-copy">
              There are neighborhood parades, school carnivals, pumpkin patches, library crafts, and
              a few long-running Silicon Valley Halloween traditions.
            </p>
            <p className="lgg-copy">
              Whether you are planning a toddler’s first trick-or-treat outing or a festive weekend
              with a preschooler, this guide is for families with children ages 0–5.
            </p>
            <ul className="lgg-fit-picks">
              <li>
                <b>Babies and young toddlers.</b> Pumpkin picking, a short outdoor celebration, a
                library visit, or a daytime costume event.
              </li>
              <li>
                <b>Children around 2–3.</b> One community party or a short trick-or-treat outing. A
                few houses can be enough.
              </li>
              <li>
                <b>Preschoolers around 4–5.</b> Carnival games, crafts, costume parades, and a
                pumpkin patch.
              </li>
              <li>
                <b>Sensitive to crowds or noise.</b> Quieter times, non-food treats, or a familiar
                neighborhood. Famous streets can become very busy.
              </li>
            </ul>
            <div className="lgg-chart-wrap">
              <table className="lgg-chart">
                <caption>Ways to spend the month</caption>
                <thead>
                  <tr>
                    <th scope="col">Plan</th>
                    <th scope="col">When</th>
                    <th scope="col">Cost</th>
                    <th scope="col">Best for</th>
                    <th scope="col">Crowd</th>
                  </tr>
                </thead>
                <tbody>
                  {HALLOWEEN_GUIDE_CHART.map((row) => (
                    <tr key={row.plan}>
                      <th scope="row">{row.plan}</th>
                      <td>{row.when}</td>
                      <td>{row.cost}</td>
                      <td>{row.bestFor}</td>
                      <td>{row.crowd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <section className="lgg-chapter" id={id('free')}>
              <h3>1. Free Halloween celebrations close to home</h3>
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
                why="A nearby, flexible Halloween outing with hands-on activities."
                image="https://www.losaltosca.gov/ImageRepository/Document?documentID=2763"
                puddlesHref="/event/family-fun-days-los-altos-community-center-2026-10-24-10-00"
              >
                <p>
                  A community Halloween morning at the Los Altos Community Center with crafts, games,
                  movies, and scavenger hunts.
                </p>
              </Outing>
              <Outing
                title="Magical Bridge Costume Party — Palo Alto"
                when="Sunday, October 25 · 10 AM–1 PM · Free"
                why="An inclusive celebration welcoming children of all ages and abilities."
                links={[{ href: 'https://www.magicalbridge.org/', label: 'Event details' }]}
              >
                <p>
                  Dress up for music, sensory-friendly science play, trick-or-treat bag decorating,
                  and a costume dance party at Magical Bridge Playground.
                </p>
              </Outing>
            </section>

            <section className="lgg-chapter" id={id('schools')}>
              <h3>2. School carnivals and costume parties</h3>
              <p>
                Some of the area’s most memorable Halloween celebrations happen in the school
                community. These events offer rides, games, crafts, and traditions families look
                forward to every fall.
              </p>
              <Outing
                title="Witches’ Delight — Santa Rita Elementary, Los Altos"
                when="Saturday, October 24 · 2–7 PM"
                cost="Free to enter. Games, activities, and food require tickets. Wristbands cover unlimited eligible rides and games, excluding Cake Jam, food, and merchandise."
                why="An afternoon carnival with a festive neighborhood-school atmosphere."
                before="The LASD community is welcome. Purchase tickets or wristbands ahead of time to simplify your visit."
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
                  A 65-year Santa Rita tradition featuring carnival rides, games, bounce houses, a
                  dunk tank, costume contests, and Cake Jam.
                </p>
              </Outing>
              <Outing
                title="Harvest Carnival — Duveneck Elementary, Palo Alto"
                when="Saturday, October 24 · 2:30–5 PM"
                cost="$20 advance child’s wristband for ages 4 and up."
                before="Purchase the wristband through the Duveneck PTA in advance. Check the school’s information for younger children’s activity arrangements."
                image="/events/duveneck-harvest-carnival-2026.jpg"
                puddlesHref="/event/core-weekend-duveneck-harvest-carnival-2026-10-24"
                links={[
                  {
                    href: 'https://duveneck.pausd.org/school-life/calendar',
                    label: 'Duveneck school calendar',
                  },
                ]}
              >
                <p>A fall carnival with games, a petting zoo, crafts, face painting, and a haunted house.</p>
              </Outing>
              <Outing
                title="Fall Festival — Cherry Chase Elementary, Sunnyvale"
                when="Friday, October 30 · 2:30–4:30 PM"
                cost="Paid activities. Check the PTA for ticket options."
                before="Buy through the PTA store, or purchase at the Friday booth for $1 per ticket, according to the event listing. Check participation and ticket details with the organizer."
                puddlesHref="/event/core-weekend-cherry-chase-fall-festival-2026-10-30"
                links={[
                  {
                    href: 'https://cherrychase.sesd.org/about-us/cherry-calendar',
                    label: 'Cherry Chase school calendar',
                  },
                ]}
              >
                <p>A community school festival with games, crafts, face painting, pumpkins, and family activities.</p>
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
              <h3>3. Costume parades and downtown Halloween fun</h3>
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
              <h3>4. Stories, crafts, and Halloween creativity</h3>
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
                title="Spooky StoryWalk® — Sunnyvale"
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
              <h3>5. Pumpkin patches worth a little drive</h3>
              <p>For families who want an outdoor fall adventure, a pumpkin patch can be the main event.</p>
              <Outing
                title="Farmer John’s Pumpkin Farm — Half Moon Bay"
                when="Daily · 9 AM–6 PM"
                cost="Free admission and parking. Pumpkins are purchased separately."
                why="A flexible outing for families who want to pick pumpkins without a large amusement-style experience."
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
              <h3>6. Trick-or-treat before Halloween night</h3>
              <p>
                You do not have to wait until after sunset on October 31. These organized activities
                are useful when a family wants a set place and time.
              </p>
              <Outing
                title="Menlo Park Trunk-or-Treat"
                when="Wednesday, October 28 · 4:30–6 PM · Belle Haven Community Campus"
                image="https://www.menlopark.gov/files/sharedassets/public/v/2/library-and-community-services/images/events/trunkortreat.png"
                puddlesHref="/event/seasonal-drive-belle-haven-trunk-or-treat-2026-10-28"
                links={[
                  {
                    href: 'https://www.menlopark.gov/Citywide-calendar/Community-events/20261028-Trunk-or-Treat',
                    label: 'Official event details',
                  },
                ]}
              >
                <p>Decorated cars, costumes, and community trick-or-treating.</p>
              </Outing>
              <Outing
                title="Hiller Aviation Museum Trunk or Treat"
                when="Thursday, October 29 · 5–7 PM · Free · 601 Skyway Road, San Carlos"
                before="Trunk-or-Treat is free. The indoor Haunted Hangar requires separate paid museum admission."
                links={[{ href: 'https://www.hiller.org/event/trunk-or-treat/', label: 'Official event details' }]}
              >
                <p>Collect treats from decorated cars and airplanes at the museum.</p>
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
              <Outing title="Rancho Shopping Center Trick-or-Treat" when="Saturday, October 31 · 10:30 AM–12:30 PM · Free · Los Altos">
                <p>A daytime shopping-center trick-or-treat celebration with activities for families.</p>
              </Outing>
              <Outing
                title="Mountain View Public Library Trick-or-Treat"
                when="Saturday, October 31 · 10 AM–6 PM · Free"
                why="An indoor alternative for younger children, or for families who prefer non-candy treats."
              >
                <p>Stop by the library for non-food treats during opening hours.</p>
              </Outing>
            </section>

            <section className="lgg-chapter" id={id('traditions')}>
              <h3>7. Famous Halloween traditions in Silicon Valley</h3>
              {showMap ? <GuidePlacesMap idPrefix={idPrefix} /> : null}
              <p>Halloween in Silicon Valley has its own local folklore.</p>
              <p>
                Some streets have become known for elaborate decorations, neighborhood gatherings, and
                traditions passed down over many years.
              </p>
              <p>
                These places are worth knowing about, and they are different from formally scheduled
                public events. A tradition’s past popularity does not guarantee that a particular
                display or household will participate in 2026.
              </p>

              <article className="lgg-out">
                <h4 id={id('old-palo-alto')}>Old Palo Alto — the Steve Jobs Halloween tradition</h4>
                <p className="lgg-when">Area: Waverley Street and Santa Rita Avenue</p>
                <p>Old Palo Alto has long been one of the region’s best-known Halloween destinations.</p>
                <p>
                  The late Steve Jobs was known for celebrating Halloween, and accounts from former
                  neighbors describe elaborate displays, carved pumpkins, and long lines of
                  trick-or-treaters. His family’s Halloween tradition continued after his death in
                  2011.
                </p>
                <p>Today, the surrounding historic streets remain part of Palo Alto’s Halloween folklore.</p>
                <p>
                  <b>What to expect: </b>
                  Historic homes, seasonal decorations, and potentially very large crowds.
                </p>
                <p>
                  <b>2026 status: </b>
                  The neighborhood’s reputation is well documented, but individual homeowner
                  participation and any street closure must be confirmed separately.
                </p>
              </article>

              <article className="lgg-out">
                <h4 id={id('addison')}>Addison Avenue — another Palo Alto Halloween tradition</h4>
                <p className="lgg-when">Area: Addison Avenue, Palo Alto</p>
                <p>
                  Another street associated with elaborate Halloween celebrations and notable Silicon
                  Valley residents, including past festivities linked to former Yahoo CEO Marissa Mayer.
                </p>
                <p>
                  <b>What to expect: </b>
                  A residential setting with a history of creative holiday displays.
                </p>
                <p>
                  <b>2026 status: </b>
                  Specific homeowners’ participation is not confirmed. This is a neighborhood
                  tradition, not a scheduled public attraction.
                </p>
              </article>

              <article className="lgg-out">
                <h4 id={id('pirate-manor')}>Pirate Manor — Los Altos</h4>
                <p className="lgg-when">Area: Manor Way, Los Altos</p>
                <p>
                  Pirate Manor is a local Halloween creation known for its pirate-themed display,
                  created by a group of Bay Area enthusiasts. It is one example of the creativity
                  behind neighborhood Halloween celebrations.
                </p>
                <p>
                  <b>2026 status: </b>
                  Historical displays are documented, but this year’s opening dates and hours have not
                  been verified. The website’s schedule contains older event years.
                </p>
                <Ext href="https://www.piratemanor.com/">Visit Pirate Manor’s website</Ext>
              </article>
            </section>

            <section className="lgg-chapter" id={id('neighborhoods')}>
              <h3>8. Best neighborhoods for trick-or-treating</h3>
              <p>
                If you are hoping for a more traditional Halloween night, these neighborhoods have a
                history of decorated homes or strong community participation.
              </p>
              <p className="lgg-when">Halloween night: Saturday, October 31, 2026</p>

              <h4>Palo Alto</h4>
              <h5>Old Palo Alto — Waverley Street</h5>
              <p>
                One of the region’s most famous Halloween areas. Historically, certain blocks have been
                closed to vehicles for large pedestrian crowds.
              </p>
              <p>
                <b>Best for: </b>
                Families interested in a lively Halloween atmosphere.
              </p>
              <p>
                <b>2026 status: </b>
                Current closure limits and household participation require confirmation.
              </p>
              <h5>Professorville and Crescent Park</h5>
              <p>Known for historic houses and neighborhood Halloween decorations.</p>
              <p>
                <b>Best for: </b>
                A residential trick-or-treat stroll with a traditional Palo Alto neighborhood feel.
              </p>
              <p>
                <b>2026 status: </b>
                No uniform neighborhood-wide hours or street closures confirmed.
              </p>

              <h4>Los Altos</h4>
              <h5 id={id('orange')}>Orange Avenue and surrounding streets</h5>
              <p>
                Old Los Altos has a history of neighborhood Halloween celebrations, including past
                street-closure efforts.
              </p>
              <p>
                <b>Best for: </b>
                Families who want to explore historic residential streets.
              </p>
              <p>
                <b>2026 status: </b>
                No confirmed current closure schedule. Do not assume the area is car-free.
              </p>
              <h5>Manor Way</h5>
              <p>Known for the historic Pirate Manor display.</p>
              <p>
                <b>Best for: </b>
                Families interested in unusual Halloween decorations.
              </p>
              <p>
                <b>2026 status: </b>
                Display opening unconfirmed.
              </p>

              <h4>Mountain View</h4>
              <h5 id={id('mercy-bush')}>Old Mountain View — Mercy-Bush Park area</h5>
              <p>
                A frequently mentioned local favorite for neighborhood trick-or-treating, with many
                homes close enough for a relatively short walk.
              </p>
              <p>
                <b>Best for: </b>
                Families seeking a nearby residential Halloween experience.
              </p>
              <h5 id={id('shoreline-west')}>Shoreline West</h5>
              <p>Another neighborhood local residents have recommended for festive decorations and trick-or-treating.</p>
              <p>
                <b>Best for: </b>
                Families who prefer staying within Mountain View.
              </p>
              <h5 id={id('whisman')}>Whisman Station</h5>
              <p>
                With closely spaced homes and some pedestrian-only paths, Whisman Station may be
                convenient for younger children walking from door to door.
              </p>
              <p>
                <b>Best for: </b>
                Families who value a shorter, easier walking route over elaborate displays.
              </p>
              <p>All three are community recommendations, rather than officially scheduled Halloween events.</p>

              <h4>Los Gatos</h4>
              <h5 id={id('tait')}>Tait Avenue — Almond Grove</h5>
              <p>A long-standing Halloween destination with decorated homes, large crowds, and a tradition of street closures.</p>
              <h5 id={id('johnson')}>Johnson Avenue</h5>
              <p>Another popular Halloween street with a history of vehicle restrictions during peak trick-or-treat hours.</p>
              <p>
                <b>2026 status: </b>
                Los Gatos has arranged traffic-control services for Halloween, including the Tait and
                Johnson areas. Check the town’s final closure notices for the exact blocks and times.
              </p>
              <Ext href="https://www.losgatosca.gov/">Los Gatos official website</Ext>

              <h4>More Bay Area neighborhood traditions</h4>
              <h5 id={id('pope')}>Pope Street — Menlo Park</h5>
              <p>A residential neighborhood in The Willows known locally for Halloween trick-or-treating.</p>
              <h5 id={id('cabrillo')}>Cabrillo Avenue — Burlingame</h5>
              <p>A traditional residential Halloween area in Easton Addition. Do not assume the street is closed to vehicles.</p>
              <h5 id={id('belvedere')}>Belvedere Street — Cole Valley, San Francisco</h5>
              <p>A well-known Halloween destination with decorated homes and large crowds. Expect hills and a busy evening.</p>
              <h5 id={id('fair-oaks')}>Fair Oaks Street — San Francisco</h5>
              <p>A neighborhood Halloween tradition with a relatively flat walking environment.</p>
              <p>
                These are historical and community-based recommendations. Exact 2026 closure
                information and participation vary.
              </p>
            </section>

            <section className="lgg-chapter" id={id('before')}>
              <h3>9. What to know before trick-or-treating with little ones</h3>
              <p>
                Traditional door-to-door trick-or-treating takes place on <b>Saturday, October 31, 2026</b>.
              </p>
              <p>Individual neighborhoods and homes set their own participation hours. There is no universal start time.</p>
              <p>
                For families with toddlers or preschoolers, starting around 5:30–6 PM may help you
                finish before the evening gets too late.
              </p>
              <p>
                <b>A few planning tips:</b>
              </p>
              <div className="lgg-tips">
                <IconLine kind="stroller" label="" text="Pick one walkable neighborhood rather than traveling between several crowded streets." />
                <IconLine kind="info" label="" text="Visit houses that clearly welcome trick-or-treaters." />
                <IconLine kind="info" label="" text="Bring a flashlight or reflective accessories for visibility." />
                <IconLine kind="crowds" label="" text="Expect long lines in famous Halloween neighborhoods." />
                <IconLine kind="info" label="" text="Avoid blocking driveways or entering private property outside the invited route." />
                <IconLine kind="baby" label="" text="Check candy and small treats for age-appropriate choking hazards." />
                <IconLine kind="baby" label="" text="Let your child’s comfort determine how long you stay." />
              </div>
              <p>
                If your child is not ready for door-to-door trick-or-treating, daytime downtown
                celebrations and library activities are strong alternatives.
              </p>
              <p>
                You can also check <Ext href="https://nextdoor.com/treat_map/">Nextdoor’s Treat Map</Ext> for
                voluntarily participating homes. Listings are not guaranteed.
              </p>
            </section>

            <section className="lgg-chapter" id={id('fit')}>
              <h3>10. Which Halloween plan fits your family?</h3>
              <h4>For babies and young toddlers</h4>
              <p>
                Consider pumpkin picking, a short outdoor celebration, a library visit, or a daytime
                costume event. These offer seasonal fun without a long evening.
              </p>
              <h4>For children around 2–3</h4>
              <p>
                Try one main activity, such as a community party or a short trick-or-treat outing. A
                few houses may be more enjoyable than an entire crowded neighborhood.
              </p>
              <h4>For preschoolers around 4–5</h4>
              <p>
                Carnival games, interactive crafts, costume parades, and a more involved pumpkin patch
                may be especially engaging.
              </p>
              <h4>For children sensitive to crowds or noise</h4>
              <p>
                Consider quieter times, non-food trick-or-treat options, or a familiar neighborhood.
                Famous Halloween streets can become very busy.
              </p>
              <p>The best Halloween experience is the one your family enjoys together.</p>
            </section>

            <section className="lgg-chapter" id={id('more')}>
              <h3>More Halloween adventures on Puddles</h3>
              <p>
                There are many ways to celebrate Halloween with little ones, from a morning in costume
                to an evening walk through a decorated neighborhood.
              </p>
              <p>
                Puddles — The Tot Map brings together local activities for families with children ages
                0–5 around Palo Alto, Los Altos, Mountain View, Sunnyvale, and nearby communities.
              </p>
              <Link className="lgg-related" to={COLLECTION}>
                <span className="lgl-eyebrow">On Puddles</span>
                <b>Explore more Halloween activities</b>
                <p className="lgg-dek">The seasonal collection, with this month’s events.</p>
              </Link>
              <p className="lgg-disclaimer">
                Event times, admission prices, neighborhood participation, and street-closure details may
                change. Verify organizer information before visiting. References to famous residential
                Halloween traditions describe historical public accounts, not guaranteed homeowner
                participation this year.
              </p>
            </section>
          </div>
          {rail ? (
            <aside className="lgg-rail" aria-label="Plan this">
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
            </aside>
          ) : null}
        </div>
      </div>
    </>
  )
}

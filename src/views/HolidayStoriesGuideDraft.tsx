import { useEffect, type ReactNode } from 'react'
import { FeaturedExperience } from '../components/guides/FeaturedExperience'
import { QuickPickGroup } from '../components/guides/QuickPick'
import {
  HOLIDAY_STORIES_GUIDE_EVENT_IDS as IDS,
  HOLIDAY_STORIES_GUIDE_SLUG,
  HOLIDAY_STORIES_OUTING_IMAGES as IMAGES,
} from '../data/holidayStoriesGuide'
import { trackGuideSectionViewed } from '../utils/analytics'

const GS = HOLIDAY_STORIES_GUIDE_SLUG

export function HolidayStoriesGuideDraft({
  idPrefix,
  afterBody,
  linkFinder = true,
}: {
  idPrefix: string
  afterBody?: ReactNode
  linkFinder?: boolean
}) {
  const id = (slug: string) => `${idPrefix}-${slug}`
  const anchor = (slug: string) => ({ eventAnchorId: id(slug) })

  useEffect(() => {
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
          trackGuideSectionViewed(GS, sectionId)
        }
      },
      { threshold: 0.35 },
    )
    for (const node of nodes) observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="lgg-body">
      <section className="lgg-chapter" id={id('finder')}>
        <h3 data-guide-section="finder">Find your kind of winter outing</h3>
        <QuickPickGroup>
          <li>
            <p className="gem-quick">
              <span className="gem-quick__category">Theater & Ballet — </span>
              {linkFinder ? (
                <>
                  <a className="gem-quick__link" href={`#${id('little-red')}`}>
                    Little Red Riding Hood
                  </a>
                  {' · '}
                  <a className="gem-quick__link" href={`#${id('night-before-christmas')}`}>
                    The Night Before Christmas
                  </a>
                  {' · '}
                  <a className="gem-quick__link" href={`#${id('gingerbread')}`}>
                    The Gingerbread Man
                  </a>
                  {' · '}
                  <a className="gem-quick__link" href={`#${id('nutcracker')}`}>
                    My Very First Nutcracker
                  </a>
                </>
              ) : (
                <>
                  Little Red Riding Hood · The Night Before Christmas · The Gingerbread Man · My Very
                  First Nutcracker
                </>
              )}
            </p>
          </li>
          <li>
            <p className="gem-quick">
              <span className="gem-quick__category">Hanukkah Stories & Crafts — </span>
              {linkFinder ? (
                <>
                  <a className="gem-quick__link" href={`#${id('hanukkah')}`}>
                    Hanukkah Storytime & Crafts
                  </a>
                  {' · '}
                  <a className="gem-quick__link" href={`#${id('menorahs')}`}>
                    Menorahs & Miracles
                  </a>
                </>
              ) : (
                <>Hanukkah Storytime & Crafts · Menorahs & Miracles</>
              )}
            </p>
          </li>
          <li>
            <p className="gem-quick">
              <span className="gem-quick__category">Winter Play & Discovery — </span>
              {linkFinder ? (
                <>
                  <a className="gem-quick__link" href={`#${id('north-pole')}`}>
                    WEE Explore the North Pole
                  </a>
                  {' · '}
                  <a className="gem-quick__link" href={`#${id('wonderlab')}`}>
                    Winter Wonderlab
                  </a>
                  {' · '}
                  <a className="gem-quick__link" href={`#${id('winterfest')}`}>
                    WinterFest
                  </a>
                </>
              ) : (
                <>WEE Explore the North Pole · Winter Wonderlab · WinterFest</>
              )}
            </p>
          </li>
        </QuickPickGroup>
      </section>

      <section className="lgg-chapter" id={id('shows')}>
        <h3 data-guide-section="shows">🎭 Theater & Ballet</h3>

        <FeaturedExperience
          title="Playhouse Series: Little Red Riding Hood · Palo Alto"
          when="Nov 21–22 · Sat/Sun 10 AM & noon; Sun also 2 PM · $20"
          tip="The indoor show lasts about 55 minutes. Meet the cast and learn a song in the courtyard before heading inside. Everyone, including infants, needs a ticket — an in-person box-office waitlist may be available for sold-out shows."
          puddlesHref={`/event/${IDS.littleRed}`}
          guideSlug={GS}
          image={IMAGES['little-red']}
          imageCredit="Archival Playhouse series photo · City of Palo Alto (not this production)"
          imageCreditHref="https://www.paloalto.gov/Departments/Community-Services/Arts-Sciences/Palo-Alto-Childrens-Theatre/Productions/Playhouse-Productions"
          imageCreditKind="Prior edition"
          {...anchor('little-red')}
        >
          <p>
            Watch Little Red Riding Hood unfold in a lively storyteller-style show with simple sets,
            costumes, and plenty of chances to get up and wiggle.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="The Night Before Christmas · Mountain View"
          when="Dec 12 · 11:30 AM & 1:30 PM · Tickets"
          tip="The performance lasts about 45 minutes without intermission. December 11 performances are school-group matinees; purchase public December 12 tickets through the official box office."
          puddlesHref={`/event/${IDS.nightBeforeChristmas}`}
          guideSlug={GS}
          image={IMAGES['night-before-christmas']}
          imageCredit="Peninsula Youth Theatre · official event artwork"
          imageCreditHref="https://pytnet.org/stories-on-stage/the-night-before-christmas/"
          imageCreditKind="Official artwork"
          {...anchor('night-before-christmas')}
        >
          <p>
            Discover a familiar Christmas Eve story retold onstage by an unexpected character who has
            her own side of the tale.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="Playhouse Series: The Gingerbread Man · Palo Alto"
          when="Dec 19–21 · $20"
          tip="The indoor performance lasts about 55 minutes. Families first meet the cast in the courtyard and learn a song. All attendees, including infants, need their own tickets."
          puddlesHref={`/event/${IDS.gingerbread}`}
          guideSlug={GS}
          image={IMAGES.gingerbread}
          imagePosition="center bottom"
          imageCredit="Illustrative story art · DylanIsChilling · CC BY-SA 4.0"
          imageCreditHref="https://commons.wikimedia.org/wiki/File:The_Gingerbread_Man.jpg"
          imageCreditKind="Illustrative"
          {...anchor('gingerbread')}
        >
          <p>
            Follow The Gingerbread Man in a storyteller-style performance with simple costumes,
            familiar characters, and opportunities for children to get up and move.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="My Very First Nutcracker · San Jose"
          when="Dec 20, 22, 23 & 27 · 11 AM · Tickets"
          tip="Pre-show festivities start an hour early, with costumed characters, photo opportunities, and DUPLO/Soft Brick play areas. The one-act ballet lasts about 55 minutes with no intermission. Children age 1 and older need their own ticket."
          puddlesHref={`/event/${IDS.nutcracker}`}
          guideSlug={GS}
          image={IMAGES.nutcracker}
          {...anchor('nutcracker')}
        >
          <p>
            Watch mice and toy soldiers dance through a shortened Nutcracker ballet, with a live
            orchestra and a festive holiday party onstage.
          </p>
        </FeaturedExperience>
      </section>

      <section className="lgg-chapter" id={id('crafts')}>
        <h3 data-guide-section="crafts">🎨 Hanukkah Stories & Crafts</h3>

        <FeaturedExperience
          title="Hanukkah Storytime & Crafts · Palo Alto"
          when="Dec 2 · 4–5:15 PM · Free"
          tip="The organizer offers registration for this free gathering; use its link to confirm a spot."
          puddlesHref={`/event/${IDS.hanukkah}`}
          guideSlug={GS}
          image={IMAGES.hanukkah}
          imageCredit="Oshman Family JCC · Hanukkah events listing"
          imageCreditHref="https://paloaltojcc.org/hanukkah-events/"
          imageCreditKind="Official artwork"
          {...anchor('hanukkah')}
        >
          <p>
            Listen to Hanukkah stories, learn about family traditions, play dreidel, and make a holiday
            craft together.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="Menorahs & Miracles · San Jose"
          when="Dec 6 · 10 AM–2 PM · Museum admission"
          tip="Storytimes are scheduled in English at 12:30 PM, Hebrew at 1 PM, and Russian at 1:30 PM. The celebration takes place inside the museum; check current admission before visiting."
          puddlesHref={`/event/${IDS.menorahs}`}
          guideSlug={GS}
          image={IMAGES.menorahs}
          {...anchor('menorahs')}
        >
          <p>
            Play dreidel, explore Hanukkah traditions through an interactive performance, enjoy songs,
            and follow a museum scavenger hunt.
          </p>
        </FeaturedExperience>
      </section>

      <section className="lgg-chapter" id={id('play')}>
        <h3 data-guide-section="play">❄️ Winter Play & Discovery</h3>
        <p>
          From free library snow play to hands-on museum experiences, here are ways to explore winter
          together.
        </p>

        <FeaturedExperience
          title="WEE Explore the North Pole · San Jose"
          when="Dec 12 · 10:30 AM–12:30 PM · Free"
          tip="Storytime starts at 10:45 AM; Mr. and Mrs. Claus are expected around 11 AM. The snow play is outside on the library patio. Drop in without registering."
          puddlesHref={`/event/${IDS.northPole}`}
          guideSlug={GS}
          image={IMAGES['north-pole']}
          {...anchor('north-pole')}
        >
          <p>
            Play with outdoor snow, hear Mrs. Claus tell stories, make winter crafts, and meet Santa
            during a morning at the library.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="Winter Wonderlab · Sausalito"
          when="Nov 21–Jan 3 · Weekends + select weekdays · Museum admission"
          tip="The gingerbread workshop includes a play area for infants and crawlers. Snow-themed play is offered on weekends only; other activities vary by date. Included with general admission or membership; babies under 1 enter free."
          puddlesHref={`/event/${IDS.wonderlab}`}
          guideSlug={GS}
          image={IMAGES.wonderlab}
          imageCredit="Bay Area Discovery Museum · archival rink photo"
          imageCreditHref="https://bayareadiscoverymuseum.org/events/winter-wonderlab/"
          imageCreditKind="Prior edition"
          {...anchor('wonderlab')}
        >
          <p>
            Glide across an iceless rink, decorate giant gingerbread houses, build toys, and experiment
            with winter-inspired art.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="WinterFest: Frosty Science · Oakland"
          when="Dec 16–Jan 3 · Museum admission"
          tip="Closed Dec 24–25 and Jan 1. Sock Skate, bubble snowfall, and winter-science demos are included with general admission; add-on workshops such as Gingerbread Rovers are separate — check the calendar before you go."
          puddlesHref={`/event/${IDS.winterfest}`}
          guideSlug={GS}
          image={IMAGES.winterfest}
          imageCredit="Chabot Space & Science Center · WinterFest artwork"
          imageCreditHref="https://chabotspace.org/series/winterfest-frosty-science/"
          imageCreditKind="Official artwork"
          {...anchor('winterfest')}
        >
          <p>
            Slip on cozy socks for Sock Skate, experience bubble snowfall, and explore winter-science
            demonstrations across the center.
          </p>
        </FeaturedExperience>
      </section>

      <section className="lgg-chapter" id={id('before')}>
        <h3 data-guide-section="before">💙 Good to know before you go</h3>
        <ul className="lgg-tips">
          <li>
            <b>Trying theater for the first time?</b> Start with a shorter show and consider whether
            your child enjoys sitting through a story.
          </li>
          <li>
            <b>Looking for room to move?</b> The museums offer play and discovery alongside scheduled
            seasonal programming.
          </li>
          <li>
            <b>Planning around naps?</b> Compare matinee times with museum hours before booking
            tickets.
          </li>
          <li>
            <b>Bringing a stroller?</b> Check the venue&apos;s entry, parking, and restroom information
            before visiting.
          </li>
        </ul>
      </section>

      {afterBody}
    </div>
  )
}

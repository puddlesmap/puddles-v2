import { useEffect, type ReactNode } from 'react'
import { FeaturedExperience } from '../components/guides/FeaturedExperience'
import { QuickPickGroup } from '../components/guides/QuickPick'
import {
  HOLIDAY_STORIES_GUIDE_EVENT_IDS as IDS,
  HOLIDAY_STORIES_GUIDE_SLUG,
  HOLIDAY_STORIES_OUTING_IMAGES as IMAGES,
  HOLIDAY_STORIES_SECTION_CLAY,
} from '../data/holidayStoriesGuide'
import { HOLIDAY_STORIES_FINDER_TITLE } from '../data/holidayMagicHubGuides'
import { trackGuideSectionViewed } from '../utils/analytics'

const GS = HOLIDAY_STORIES_GUIDE_SLUG

const FINDER_ROWS = [
  {
    category: 'First Shows',
    items: [
      { slug: 'little-red', label: 'Little Red Riding Hood' },
      { slug: 'night-before-christmas', label: 'The Night Before Christmas' },
      { slug: 'gingerbread', label: 'The Gingerbread Man' },
      { slug: 'nutcracker', label: 'My Very First Nutcracker' },
    ],
  },
  {
    category: 'Crafts & Traditions',
    items: [
      { slug: 'hanukkah', label: 'Hanukkah Storytime & Crafts' },
      { slug: 'menorahs', label: 'Menorahs & Miracles' },
    ],
  },
  {
    category: 'Winter Play & Discovery',
    items: [
      { slug: 'north-pole', label: 'WEE Explore the North Pole' },
      { slug: 'wonderlab', label: 'Winter Wonderlab' },
      { slug: 'winterfest', label: 'WinterFest' },
    ],
  },
] as const

export function HolidayStoriesGuideDraft({
  idPrefix,
  afterBody,
  beforeFinder,
  afterFinder,
  linkFinder = true,
  finderLayout = 'inline',
  trackSections = true,
}: {
  idPrefix: string
  afterBody?: ReactNode
  beforeFinder?: ReactNode
  afterFinder?: ReactNode
  linkFinder?: boolean
  finderLayout?: 'inline' | 'bullets'
  trackSections?: boolean
}) {
  const id = (slug: string) => `${idPrefix}-${slug}`
  const anchor = (slug: string) => ({ eventAnchorId: id(slug) })

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
          trackGuideSectionViewed(GS, sectionId)
        }
      },
      { threshold: 0.35 },
    )
    for (const node of nodes) observer.observe(node)
    return () => observer.disconnect()
  }, [trackSections])

  return (
    <div className="lgg-body">
      <section
        className={`lgg-chapter lgg-chapter--finder${finderLayout === 'bullets' ? ' lgg-chapter--finder-bullets' : ''}`}
        id={id('finder')}
      >
        {finderLayout === 'bullets' ? (
          <h2 className="holiday-finder-title" data-guide-section="finder">
            <img
              className="holiday-finder-title__clay"
              src={HOLIDAY_STORIES_SECTION_CLAY.finder}
              alt=""
              decoding="async"
            />
            <span>{HOLIDAY_STORIES_FINDER_TITLE}</span>
          </h2>
        ) : (
          <h3 data-guide-section="finder">{HOLIDAY_STORIES_FINDER_TITLE}</h3>
        )}
        {beforeFinder}
        {finderLayout === 'bullets' ? (
          <div className="holiday-finder-table" aria-label={HOLIDAY_STORIES_FINDER_TITLE}>
            {FINDER_ROWS.map((row) => (
              <div className="holiday-finder-table__row" key={row.category}>
                <div className="holiday-finder-table__cat">{row.category}</div>
                <p className="holiday-finder-table__events gem-quick">
                  {linkFinder
                    ? row.items.map((item, index) => (
                        <span key={`${row.category}-${item.slug}`}>
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
                        <span key={item.slug}>
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

      {afterFinder}

      <section className="lgg-chapter" id={id('shows')}>
        <h3 data-guide-section="shows">🎭 First Shows</h3>

        <FeaturedExperience
          title="Playhouse Series: Little Red Riding Hood · Palo Alto"
          when="Nov 21–22 · Sat/Sun 10 AM & noon; Sun also 2 PM · $20"
          tip="Suggested ages 2–6; about 55 minutes. All attendees need tickets. Several performances are already sold out or selling quickly — confirm available seats before you go."
          puddlesHref={`/event/${IDS.littleRed}`}
          guideSlug={GS}
          image={IMAGES['little-red']}
          imageCredit="Archival Playhouse series photo · City of Palo Alto (not this production)"
          imageCreditHref="https://www.paloalto.gov/Departments/Community-Services/Arts-Sciences/Palo-Alto-Childrens-Theatre/Productions/Playhouse-Productions"
          imageCreditKind="Prior edition"
          {...anchor('little-red')}
        >
          <p>
            Watch a playful storyteller-style retelling with opportunities to stand up and wiggle along.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="The Night Before Christmas · Mountain View"
          when="Dec 12 · 11:30 AM & 1:30 PM · Tickets"
          tip="The Dec 11 shows are school matinees; regular public performances are Dec 12."
          puddlesHref={`/event/${IDS.nightBeforeChristmas}`}
          guideSlug={GS}
          image={IMAGES['night-before-christmas']}
          imageCredit="Peninsula Youth Theatre · official event artwork"
          imageCreditHref="https://pytnet.org/stories-on-stage/the-night-before-christmas/"
          imageCreditKind="Official artwork"
          {...anchor('night-before-christmas')}
        >
          <p>
            Follow a holiday story brought to life in a 45-minute children&apos;s theater performance.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="Playhouse Series: The Gingerbread Man · Palo Alto"
          when="Dec 19–21 · $20"
          tip="Suggested ages 2–6; about 55 minutes. Every attendee needs a ticket."
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
            Join an interactive retelling with playful characters and moments for children to
            participate.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="My Very First Nutcracker · San Jose"
          when="Dec 20, 22, 23 & 27 · 11 AM · Tickets"
          tip="About 55 minutes, without intermission. Children ages 1 and older need their own ticket."
          puddlesHref={`/event/${IDS.nutcracker}`}
          guideSlug={GS}
          image={IMAGES.nutcracker}
          {...anchor('nutcracker')}
        >
          <p>
            Watch Clara&apos;s holiday party, playful mice, and toy soldiers come to life in a one-act
            ballet with a live orchestra.
          </p>
        </FeaturedExperience>
      </section>

      <section className="lgg-chapter" id={id('crafts')}>
        <h3 data-guide-section="crafts">🎨 Crafts & Traditions</h3>

        <FeaturedExperience
          title="Hanukkah Storytime & Crafts · Palo Alto"
          when="Dec 2 · 4–5:15 PM · Free"
          tip="For children through age 6; check registration with the organizer."
          puddlesHref={`/event/${IDS.hanukkah}`}
          guideSlug={GS}
          image={IMAGES.hanukkah}
          imageCredit="Oshman Family JCC · Hanukkah events listing"
          imageCreditHref="https://paloaltojcc.org/hanukkah-events/"
          imageCreditKind="Official artwork"
          {...anchor('hanukkah')}
        >
          <p>
            Enjoy Hanukkah stories, songs, candle-making, and dreidel activities together.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="Menorahs & Miracles · San Jose"
          when="Dec 6 · 10 AM–2 PM · Museum admission"
          tip="The museum lists storytime sessions in English, Hebrew, and Russian at different times."
          puddlesHref={`/event/${IDS.menorahs}`}
          guideSlug={GS}
          image={IMAGES.menorahs}
          {...anchor('menorahs')}
        >
          <p>
            Play dreidel games, watch an interactive Hanukkah performance, listen to songs, and explore
            a scavenger hunt.
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
          tip="Recommended ages 0–5; no registration required. Storytime starts 10:45 AM and Santa visits around 11 AM."
          puddlesHref={`/event/${IDS.northPole}`}
          guideSlug={GS}
          image={IMAGES['north-pole']}
          {...anchor('north-pole')}
        >
          <p>
            Play with outdoor snow, hear Mrs. Claus tell stories, make winter crafts, and meet Santa
            during a morning for young children.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="Winter Wonderlab · Sausalito"
          when="Nov 21–Jan 3 · Weekends + select weekdays · Museum admission"
          tip="Included with general admission; babies under 1 enter free. On-site café, changing tables, and free parking are available."
          puddlesHref={`/event/${IDS.wonderlab}`}
          guideSlug={GS}
          image={IMAGES.wonderlab}
          imageCredit="Bay Area Discovery Museum · archival rink photo"
          imageCreditHref="https://bayareadiscoverymuseum.org/events/winter-wonderlab/"
          imageCreditKind="Prior edition"
          {...anchor('wonderlab')}
        >
          <p>
            Try iceless skating, decorate giant play gingerbread houses, and tinker with toys and
            winter-inspired art.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="WinterFest: Frosty Science · Oakland"
          when="Dec 16–Jan 3 · Museum admission"
          tip="The center is closed Dec 24–25 and Jan 1. Some add-on workshops may cost extra; check daily programming."
          puddlesHref={`/event/${IDS.winterfest}`}
          guideSlug={GS}
          image={IMAGES.winterfest}
          imageCredit="Chabot Space & Science Center · WinterFest artwork"
          imageCreditHref="https://chabotspace.org/series/winterfest-frosty-science/"
          imageCreditKind="Official artwork"
          {...anchor('winterfest')}
        >
          <p>
            Explore winter science with hands-on experiments, playful snow-themed activities, and
            indoor discoveries.
          </p>
        </FeaturedExperience>
      </section>

      <section className="lgg-chapter" id={id('before')}>
        <h3 data-guide-section="before">💙 Before You Go</h3>
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

import { useEffect, type ReactNode } from 'react'
import { GuideMidArticleAd } from '../components/ads/GuideMidArticleAd'
import { FeaturedExperience } from '../components/guides/FeaturedExperience'
import { QuickPickGroup } from '../components/guides/QuickPick'
import {
  HELLO_NEW_YEAR_GUIDE_EVENT_IDS as IDS,
  HELLO_NEW_YEAR_GUIDE_SLUG,
  HELLO_NEW_YEAR_OUTING_IMAGES as IMAGES,
  HELLO_NEW_YEAR_SECTION_CLAY,
} from '../data/helloNewYearGuide'
import { HELLO_NEW_YEAR_FINDER_TITLE } from '../data/holidayMagicHubGuides'
import { trackGuideSectionViewed } from '../utils/analytics'

const GS = HELLO_NEW_YEAR_GUIDE_SLUG

const FINDER_ROWS = [
  {
    category: 'Daytime Countdowns',
    items: [
      { slug: 'sunnyvale', label: 'Sunnyvale' },
      { slug: 'palo-alto-noon', label: 'Palo Alto' },
      { slug: 'cdm-noon', label: "Children's Discovery Museum" },
      { slug: 'hiller-noon', label: 'Hiller' },
      { slug: 'badm-noon', label: 'Bay Area Discovery Museum' },
    ],
  },
  {
    category: 'Worth the Trip',
    items: [
      { slug: 'chabot', label: 'Chabot' },
      { slug: 'fairyland', label: "Children's Fairyland" },
      { slug: 'schulz', label: 'Schulz Museum' },
    ],
  },
  {
    category: 'January Traditions',
    items: [
      { slug: 'hakone', label: 'Hakone' },
      { slug: 'tres-reyes', label: 'Three Kings Day' },
      { slug: 'greetings', label: 'New Year card-making' },
    ],
  },
] as const

export function HelloNewYearGuideDraft({
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
              src={HELLO_NEW_YEAR_SECTION_CLAY.finder}
              alt=""
              decoding="async"
            />
            <span>{HELLO_NEW_YEAR_FINDER_TITLE}</span>
          </h2>
        ) : (
          <h3 data-guide-section="finder">{HELLO_NEW_YEAR_FINDER_TITLE}</h3>
        )}
        {beforeFinder}
        {finderLayout === 'bullets' ? (
          <div className="holiday-finder-table" aria-label={HELLO_NEW_YEAR_FINDER_TITLE}>
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

      <section className="lgg-chapter" id={id('nearby')}>
        <h3 data-guide-section="nearby">🎈 Daytime Countdowns</h3>

        <FeaturedExperience
          title="Noon Year's Eve · Sunnyvale"
          when="Wed Dec 30 · 10 AM–noon · Free"
          tip="No registration required, but space is limited and doors close when full. Check the City's event details before visiting."
          puddlesHref={`/event/${IDS.sunnyvale}`}
          guideSlug={GS}
          image={IMAGES.sunnyvale}
          imageCredit="Illustrative photo · Unsplash (not this event)"
          imageCreditHref="https://unsplash.com/photos/1516627145497-ae6968895b74"
          imageCreditKind="Illustrative"
          {...anchor('sunnyvale')}
        >
          <p>
            Dance to music, make crafts, and count down to a balloon drop and juice-box toast before
            lunch.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="Noon Year's Eve Celebration! · Palo Alto"
          when="Thu Dec 31 · 11:30 AM–12:30 PM · Registration required"
          tip="Listed for toddlers (18 months–3 years) and preschoolers (3–5), with registration required and limited space. Register before planning to attend."
          puddlesHref={`/event/${IDS.paloAltoNoon}`}
          guideSlug={GS}
          image={IMAGES['palo-alto-noon']}
          imageCredit="Illustrative photo · Unsplash (craft activity, not this event)"
          imageCreditHref="https://unsplash.com/photos/7bIFpXIgJ5o"
          imageCreditKind="Illustrative"
          {...anchor('palo-alto-noon')}
        >
          <p>
            Welcome the new year with crafts, music, dancing, and a noon ball-and-bubble drop —
            without staying up until midnight.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="Noon Year's Eve · Children's Discovery Museum, San Jose"
          when="Thu Dec 31 · Doors open 9:30 AM · Museum admission"
          tip="Three countdown times offer flexibility around naps. The organizer's page has an outdated weekday label; confirm the final schedule."
          puddlesHref={`/event/${IDS.cdmNoon}`}
          guideSlug={GS}
          image={IMAGES['cdm-noon']}
          {...anchor('cdm-noon')}
        >
          <p>
            Celebrate with confetti-filled ball drops at noon, 1 PM, and 2 PM, each welcoming the new
            year in another time zone.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="Noon Year's Eve · Hiller Aviation Museum, San Carlos"
          when="Thu Dec 31 · 10 AM–1 PM · Special-event ticket details to confirm"
          tip="The museum's main calendar lists the 2026 date, but the linked detail page includes older wording and a sold-out notice. Confirm 2026 admission before you go."
          puddlesHref={`/event/${IDS.hillerNoon}`}
          guideSlug={GS}
          image={IMAGES['hiller-noon']}
          {...anchor('hiller-noon')}
        >
          <p>
            Enjoy children&apos;s music, face painting, and three giant balloon drops at noon
            surrounded by airplanes.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="Noon Year's Eve · Bay Area Discovery Museum, Sausalito"
          when="Thu Dec 31 · 9 AM–2 PM · Special tickets"
          tip="Tickets are required even for members, and capacity is limited. Free parking and on-site food options are available."
          puddlesHref={`/event/${IDS.badmNoon}`}
          guideSlug={GS}
          image={IMAGES['badm-noon']}
          {...anchor('badm-noon')}
        >
          <p>
            Dance to festive music, make hands-on crafts, and count down together to a noon ball drop.
          </p>
        </FeaturedExperience>
      </section>

      <GuideMidArticleAd placementKey={`${GS}-mid-after-nearby`} />

      <section className="lgg-chapter" id={id('trip')}>
        <h3 data-guide-section="trip">🎉 Worth the Trip</h3>

        <FeaturedExperience
          title="Balloon Drop · Chabot Space & Science Center, Oakland"
          when="Thu Dec 31 · 11 AM, noon, 3 PM & 4 PM drops · Ticketed"
          tip="The 11 AM and 3 PM balloon drops are for ages 5 and under. Balloon-drop tickets are separate from museum admission."
          puddlesHref={`/event/${IDS.chabot}`}
          guideSlug={GS}
          image={IMAGES.chabot}
          imageCredit="Illustrative photo · Unsplash (balloon celebration, not this event)"
          imageCreditHref="https://unsplash.com/photos/1530103862676-de8c9debad1d"
          imageCreditKind="Illustrative"
          {...anchor('chabot')}
        >
          <p>
            Count down under colorful balloons, then explore winter-themed science activities around
            the center.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="Countdown in Wonderland · Children's Fairyland, Oakland"
          when="Thu Dec 31 · 10 AM–4 PM · General admission"
          tip="Included with general admission; members enter free. The organizer lists ball drops at noon and 3 PM."
          puddlesHref={`/event/${IDS.fairyland}`}
          guideSlug={GS}
          image={IMAGES.fairyland}
          imageCredit="Children's Fairyland · 2026 event artwork"
          imageCreditHref="https://fairyland.org/event-calendar/countdown-in-wonderland-2/"
          imageCreditKind="Official artwork"
          {...anchor('fairyland')}
        >
          <p>
            Make Wonderland crafts, join a dance party, watch puppet shows, and celebrate with the
            White Rabbit and a balloon drop.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="Happy New Year, Charlie Brown! · Santa Rosa"
          when="Thu Dec 31 · 10 AM–4 PM · Museum admission"
          tip="A Baby Balloon Drop for ages 4 and under takes place at noon, with an all-ages drop at 3 PM."
          puddlesHref={`/event/${IDS.schulz}`}
          guideSlug={GS}
          image={IMAGES.schulz}
          imageCredit="Charles M. Schulz Museum · archival celebration photo"
          imageCreditHref="https://schulzmuseum.org/welcoming-new-year-schulz-museum/"
          imageCreditKind="Prior edition"
          {...anchor('schulz')}
        >
          <p>
            Make Peanuts crafts, watch a Charlie Brown cartoon, and count down with Snoopy-themed
            balloon drops.
          </p>
        </FeaturedExperience>
      </section>

      <section className="lgg-chapter" id={id('january')}>
        <h3 data-guide-section="january">🎍 January Traditions</h3>

        <FeaturedExperience
          title="Oshogatsu · Hakone Gardens, Saratoga"
          when="Jan 2, 2027 · Event schedule to be announced"
          tip="The organizer has confirmed January 2 but has not published the full activity program or event admission yet. Check before making plans."
          puddlesHref={`/event/${IDS.hakone}`}
          guideSlug={GS}
          image={IMAGES.hakone}
          {...anchor('hakone')}
        >
          <p>Welcome the Japanese New Year at Hakone&apos;s traditional Japanese gardens.</p>
        </FeaturedExperience>

        <FeaturedExperience
          title="El Día de los Tres Reyes Magos · Children's Discovery Museum, San Jose"
          when="Sat Jan 9, 2027 (working date; recheck) · 10 AM–2 PM · Museum admission"
          tip="January 9 is the working date based on the organizer's date field, but its description says January 10. Confirm the final date closer to the event before visiting."
          puddlesHref={`/event/${IDS.tresReyes}`}
          guideSlug={GS}
          image={IMAGES['tres-reyes']}
          {...anchor('tres-reyes')}
        >
          <p>
            Enjoy music, dance performances, a Three Kings meet-and-greet, art activities, and Rosca
            de Reyes tasting.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="New Year Greetings! · Village Square Library, San Jose"
          when="Fri Jan 15, 2027 · 3:30–4:30 PM · Free library program"
          tip="The library includes ages 0–5 in the event audience; older children may attend too."
          puddlesHref={`/event/${IDS.greetings}`}
          guideSlug={GS}
          image={IMAGES.greetings}
          imageCredit="Illustrative photo · Compagnons on Unsplash (not this session)"
          imageCreditHref="https://unsplash.com/photos/child-drawing-on-paper-at-table-TJxotQTUr8o"
          imageCreditKind="Illustrative"
          {...anchor('greetings')}
        >
          <p>
            Make New Year greeting cards, enjoy crafts and prizes, and share snacks while supplies
            last.
          </p>
        </FeaturedExperience>
      </section>

      <section className="lgg-chapter" id={id('before')}>
        <h3 data-guide-section="before">💙 Before You Go</h3>
        <ul className="lgg-tips">
          <li>
            <b>Need a countdown before nap?</b> Look for morning or noon celebrations; San Jose&apos;s
            Discovery Museum offers multiple drops.
          </li>
          <li>
            <b>Looking for a child-specific program?</b> Chabot has age-based drop times, and the Schulz
            Museum offers a Baby Balloon Drop.
          </li>
          <li>
            <b>Planning a ticketed outing?</b> Check capacity and reserve ahead for museum events.
          </li>
          <li>
            <b>Celebrating into January?</b> Verify Hakone&apos;s program and the Children&apos;s Discovery
            Museum&apos;s Three Kings Day date before traveling.
          </li>
        </ul>
      </section>

      {afterBody}
    </div>
  )
}

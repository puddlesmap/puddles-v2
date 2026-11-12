import { useEffect, type ReactNode } from 'react'
import { FeaturedExperience } from '../components/guides/FeaturedExperience'
import { QuickPickGroup } from '../components/guides/QuickPick'
import {
  HELLO_NEW_YEAR_GUIDE_EVENT_IDS as IDS,
  HELLO_NEW_YEAR_GUIDE_SLUG,
  HELLO_NEW_YEAR_OUTING_IMAGES as IMAGES,
} from '../data/helloNewYearGuide'
import { trackGuideSectionViewed } from '../utils/analytics'

const GS = HELLO_NEW_YEAR_GUIDE_SLUG

export function HelloNewYearGuideDraft({
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
        <h3 data-guide-section="finder">Find your kind of new-year plan</h3>
        <QuickPickGroup>
          <li>
            <p className="gem-quick">
              <span className="gem-quick__category">City &amp; Library Countdowns — </span>
              {linkFinder ? (
                <>
                  <a className="gem-quick__link" href={`#${id('sunnyvale')}`}>
                    Sunnyvale
                  </a>
                  {' · '}
                  <a className="gem-quick__link" href={`#${id('palo-alto-noon')}`}>
                    Palo Alto
                  </a>
                </>
              ) : (
                <>Sunnyvale · Palo Alto</>
              )}
            </p>
          </li>
          <li>
            <p className="gem-quick">
              <span className="gem-quick__category">Museum &amp; Attraction Countdowns — </span>
              {linkFinder ? (
                <>
                  <a className="gem-quick__link" href={`#${id('cdm-noon')}`}>
                    Children&apos;s Discovery Museum
                  </a>
                  {' · '}
                  <a className="gem-quick__link" href={`#${id('hiller-noon')}`}>
                    Hiller
                  </a>
                  {' · '}
                  <a className="gem-quick__link" href={`#${id('badm-noon')}`}>
                    Bay Area Discovery Museum
                  </a>
                  {' · '}
                  <a className="gem-quick__link" href={`#${id('chabot')}`}>
                    Chabot
                  </a>
                  {' · '}
                  <a className="gem-quick__link" href={`#${id('fairyland')}`}>
                    Children&apos;s Fairyland
                  </a>
                  {' · '}
                  <a className="gem-quick__link" href={`#${id('schulz')}`}>
                    Schulz Museum
                  </a>
                </>
              ) : (
                <>
                  Children&apos;s Discovery Museum · Hiller · Bay Area Discovery Museum · Chabot ·
                  Children&apos;s Fairyland · Schulz Museum
                </>
              )}
            </p>
          </li>
          <li>
            <p className="gem-quick">
              <span className="gem-quick__category">January Celebrations — </span>
              {linkFinder ? (
                <>
                  <a className="gem-quick__link" href={`#${id('hakone')}`}>
                    Hakone
                  </a>
                  {' · '}
                  <a className="gem-quick__link" href={`#${id('tres-reyes')}`}>
                    Three Kings Day
                  </a>
                  {' · '}
                  <a className="gem-quick__link" href={`#${id('greetings')}`}>
                    New Year card-making
                  </a>
                </>
              ) : (
                <>Hakone · Three Kings Day · New Year card-making</>
              )}
            </p>
          </li>
        </QuickPickGroup>
      </section>

      <section className="lgg-chapter" id={id('nearby')}>
        <h3 data-guide-section="nearby">🎈 City &amp; Library Countdowns</h3>

        <FeaturedExperience
          title="Noon Year's Eve · Sunnyvale"
          when="Wed Dec 30 · 10 AM–noon · Free"
          tip="Space is limited; doors close when the ballroom reaches capacity. Advance registration is not required — admission is first come, first served."
          puddlesHref={`/event/${IDS.sunnyvale}`}
          guideSlug={GS}
          image={IMAGES.sunnyvale}
          imageCredit="Illustrative photo · Unsplash (not this event)"
          imageCreditHref="https://unsplash.com/photos/1516627145497-ae6968895b74"
          imageCreditKind="Illustrative"
          {...anchor('sunnyvale')}
        >
          <p>
            Dance to music, make holiday crafts, cheer for a balloon drop, and raise a juice-box toast
            to the new year.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="Noon Year's Eve Celebration! · Palo Alto"
          when="Thu Dec 31 · 11:30 AM–12:30 PM · Free · Registration required"
          tip="Registration is required, and space is limited. Reserve a spot before visiting. Party hats and noisemakers are welcome; dressing up is optional."
          puddlesHref={`/event/${IDS.paloAltoNoon}`}
          guideSlug={GS}
          image={IMAGES['palo-alto-noon']}
          imageCredit="Illustrative photo · Unsplash (craft activity, not this event)"
          imageCreditHref="https://unsplash.com/photos/7bIFpXIgJ5o"
          imageCreditKind="Illustrative"
          {...anchor('palo-alto-noon')}
        >
          <p>
            Make crafts, dance to music, and watch a ball-and-bubble drop at noon while celebrating the
            new year together.
          </p>
        </FeaturedExperience>
      </section>

      <section className="lgg-chapter" id={id('trip')}>
        <h3 data-guide-section="trip">🎉 Museum &amp; Attraction Countdowns</h3>

        <FeaturedExperience
          title="Noon Year's Eve · Children's Discovery Museum, San Jose"
          when="Thu Dec 31 · Doors 9:30 AM · drops noon, 1 PM & 2 PM · Museum admission"
          tip="Ball drops are scheduled at noon, 1 PM, and 2 PM, offering flexibility around naps."
          puddlesHref={`/event/${IDS.cdmNoon}`}
          guideSlug={GS}
          image={IMAGES['cdm-noon']}
          {...anchor('cdm-noon')}
        >
          <p>
            Welcome the new year across time zones with confetti-filled ball drops, cheers, and shared
            countdowns throughout the day.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="Noon Year's Eve · Hiller Aviation Museum, San Carlos"
          when="Thu Dec 31 · 10 AM–1 PM · Special-event tickets"
          tip="Special event tickets are sold online only; check availability after the planned December 1 sales opening. The outdoor obstacle course and jump house are weather permitting. Pizza and hot dogs are planned for purchase on site."
          puddlesHref={`/event/${IDS.hillerNoon}`}
          guideSlug={GS}
          image={IMAGES['hiller-noon']}
          {...anchor('hiller-noon')}
        >
          <p>
            Dance to children&apos;s music, watch puppets and magic, explore airplanes, and celebrate
            three giant balloon drops at noon.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="Noon Year's Eve · Bay Area Discovery Museum, Sausalito"
          when="Thu Dec 31 · 9 AM–2 PM · Special tickets"
          tip="All guests, including members, need event-specific tickets; capacity is limited. Free parking is available on site. The museum says the celebration runs rain or shine."
          puddlesHref={`/event/${IDS.badmNoon}`}
          guideSlug={GS}
          image={IMAGES['badm-noon']}
          {...anchor('badm-noon')}
        >
          <p>
            Dance to festive music, make hands-on crafts, and celebrate together with a noon ball drop
            at the discovery museum.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="Balloon Drop · Chabot Space & Science Center, Oakland"
          when="Thu Dec 31 · 11 AM, noon, 3 PM & 4 PM drops · Ticketed"
          tip="The 11 AM and 3 PM balloon drops are for ages 5 and under; noon and 4 PM are for ages 6–12. A balloon-drop ticket is separate from museum admission; adults and children also need museum admission."
          puddlesHref={`/event/${IDS.chabot}`}
          guideSlug={GS}
          image={IMAGES.chabot}
          imageCredit="Illustrative photo · Unsplash (balloon celebration, not this event)"
          imageCreditHref="https://unsplash.com/photos/1530103862676-de8c9debad1d"
          imageCreditKind="Illustrative"
          {...anchor('chabot')}
        >
          <p>
            Count down under hundreds of colorful balloons, then explore science exhibits and winter
            activities around the center.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="Countdown in Wonderland · Children's Fairyland, Oakland"
          when="Thu Dec 31 · 10 AM–4 PM · drops noon & 3 PM · General admission"
          tip="Balloon drops are scheduled for noon and 3 PM. The event is included with general park admission; review ticket details before visiting."
          puddlesHref={`/event/${IDS.fairyland}`}
          guideSlug={GS}
          image={IMAGES.fairyland}
          imageCredit="Children's Fairyland · 2026 event artwork"
          imageCreditHref="https://fairyland.org/event-calendar/countdown-in-wonderland-2/"
          imageCreditKind="Official artwork"
          {...anchor('fairyland')}
        >
          <p>
            Explore Wonderland crafts and puppet shows, meet the White Rabbit, play among bubbles, and
            celebrate with an early balloon drop.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="Happy New Year, Charlie Brown! · Santa Rosa"
          when="Thu Dec 31 · 10 AM–4 PM · Museum admission"
          tip="A Baby Balloon Drop is at noon for ages 4 and under and their families. All-ages balloon drops are scheduled at noon and 3 PM. The celebration is included with museum admission; members enter free."
          puddlesHref={`/event/${IDS.schulz}`}
          guideSlug={GS}
          image={IMAGES.schulz}
          imageCredit="Charles M. Schulz Museum · archival celebration photo"
          imageCreditHref="https://schulzmuseum.org/welcoming-new-year-schulz-museum/"
          imageCreditKind="Prior edition"
          {...anchor('schulz')}
        >
          <p>
            Make Peanuts crafts, watch Charlie Brown on screen, try a Snoopy dance, and celebrate with
            balloon drops.
          </p>
        </FeaturedExperience>
      </section>

      <section className="lgg-chapter" id={id('january')}>
        <h3 data-guide-section="january">🎍 January Celebrations</h3>

        <FeaturedExperience
          title="Oshogatsu · Hakone Gardens, Saratoga"
          when="Jan 2, 2027 · Time TBD · Admission TBA"
          tip="Hakone has confirmed January 2 but has not yet published the full program, times, or admission. Check the organizer page before making plans."
          puddlesHref={`/event/${IDS.hakone}`}
          guideSlug={GS}
          image={IMAGES.hakone}
          {...anchor('hakone')}
        >
          <p>Welcome the Japanese New Year while exploring Hakone&apos;s traditional Japanese gardens.</p>
        </FeaturedExperience>

        <FeaturedExperience
          title="El Día de los Tres Reyes Magos · Children's Discovery Museum, San Jose"
          when="Sat Jan 9, 2027 · 10 AM–2 PM (working date — reconfirm) · Museum admission"
          tip="Puddles is using Sat Jan 9, 2027 as the working date from the organizer date field (10 AM–2 PM). The page body still mentions January 10 — reconfirm the correct day before you go."
          puddlesHref={`/event/${IDS.tresReyes}`}
          guideSlug={GS}
          image={IMAGES['tres-reyes']}
          {...anchor('tres-reyes')}
        >
          <p>
            Celebrate Three Kings Day with live singing, dancing, a Three Kings meet-and-greet,
            hands-on art, and Rosca de Reyes tasting.
          </p>
        </FeaturedExperience>

        <FeaturedExperience
          title="New Year Greetings! · Village Square Library, San Jose"
          when="Fri Jan 15, 2027 · 3:30–4:30 PM · Free"
          tip="Snacks are available while supplies last."
          puddlesHref={`/event/${IDS.greetings}`}
          guideSlug={GS}
          image={IMAGES.greetings}
          imageCredit="Illustrative photo · Compagnons on Unsplash (not this session)"
          imageCreditHref="https://unsplash.com/photos/child-drawing-on-paper-at-table-TJxotQTUr8o"
          imageCreditKind="Illustrative"
          {...anchor('greetings')}
        >
          <p>
            Make New Year greeting cards and crafts, enjoy prizes, and share snacks at a community
            library celebration.
          </p>
        </FeaturedExperience>
      </section>

      <section className="lgg-chapter" id={id('before')}>
        <h3 data-guide-section="before">💙 Good to know before you go</h3>
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

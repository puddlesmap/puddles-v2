import { Link } from 'react-router-dom'
import {
  HALLOWEEN_EVENTS_HREF,
  HALLOWEEN_GUIDE_POSTED,
  HALLOWEEN_GUIDE_READ,
} from '../data/halloweenGuide'

const GALLERY = [
  {
    src: 'https://www.menlopark.gov/files/sharedassets/public/v/1/library-and-community-services/images/events/children-in-costume-on-santa-cruz-avenue-sidewalk-for-halloween-hoopla-downtown-merchant-trick-or-treating-and-parade.jpg',
    alt: 'Children in costume at Menlo Park Halloween Hoopla',
  },
  {
    src: '/events/witches-delight-2026.png',
    alt: 'Witches’ Delight school carnival',
  },
  {
    src: 'https://www.losaltosca.gov/ImageRepository/Document?documentID=2763',
    alt: 'Halloween Hoopla at Los Altos Community Center',
  },
  {
    src: 'https://www.gamblegarden.org/wp-content/uploads/2018/09/mini-pumpkins-890x890.jpg',
    alt: 'Pumpkins at Gamble Garden',
  },
] as const

const SHOWTIME_WEEKS = [
  {
    day: 'Sat',
    date: 'Oct 24',
    slots: [
      { time: 'Morning', note: 'Free city festivals' },
      { time: 'Afternoon', note: 'School carnivals' },
    ],
  },
  {
    day: 'Thu',
    date: 'Oct 30',
    slots: [{ time: 'Noon–4 PM', note: 'Downtown trick-or-treat' }],
  },
  {
    day: 'Sat',
    date: 'Oct 31',
    slots: [
      { time: 'Daytime', note: 'Library & park events' },
      { time: 'Evening', note: 'Neighborhood walks' },
    ],
    highlight: 'Halloween night',
  },
] as const

const VISIT_FAQ = [
  {
    q: 'Do free events mean free games?',
    a: 'Not always. School carnivals often sell tickets or wristbands for rides and food even when entry is free.',
  },
  {
    q: 'How early should we arrive?',
    a: 'Allow extra walking time at large park festivals and downtown parades. Craft tables can run out of supplies at busy morning events.',
  },
  {
    q: 'Can we trick-or-treat on famous streets?',
    a: 'Residential traditions vary by year. Treat neighborhood walks as optional outings—not confirmed block parties—unless an organizer publishes hours.',
  },
  {
    q: 'Where do I see dates and tickets?',
    a: 'Open each listing on Puddles for this year’s hours, cost, and official links before you go.',
  },
] as const

export function GuideShowtimeStrip() {
  return (
    <section className="gtd-showtimes" aria-label="Key Halloween dates">
      <p className="gtd-showtimes__range">Oct 24–31 · Peak weekend fun</p>
      <ul className="gtd-showtimes__grid">
        {SHOWTIME_WEEKS.map((week) => {
          const highlight = 'highlight' in week ? week.highlight : undefined
          return (
          <li key={week.date} className={highlight ? 'is-highlight' : undefined}>
            <p className="gtd-showtimes__day">
              <span>{week.day}</span>
              <span>{week.date}</span>
            </p>
            <ul className="gtd-showtimes__slots">
              {week.slots.map((slot) => (
                <li key={`${week.date}-${slot.time}`}>
                  <strong>{slot.time}</strong>
                  <span>{slot.note}</span>
                </li>
              ))}
            </ul>
            {highlight ? <p className="gtd-showtimes__badge">{highlight}</p> : null}
          </li>
          )
        })}
      </ul>
    </section>
  )
}

export function GuideFactsAside() {
  return (
    <div className="gtd-facts">
      <div className="gtd-fact">
        <h4>Guide</h4>
        <p>Halloween with Little Ones</p>
      </div>
      <div className="gtd-fact">
        <h4>Updated</h4>
        <p>{HALLOWEEN_GUIDE_POSTED.replace(/^Posted /, '')}</p>
      </div>
      <div className="gtd-fact">
        <h4>Read time</h4>
        <p>{HALLOWEEN_GUIDE_READ}</p>
      </div>
      <div className="gtd-fact">
        <h4>Region</h4>
        <p>Palo Alto, Los Altos, Mountain View, Sunnyvale & nearby</p>
      </div>
      <div className="gtd-fact">
        <h4>Best for</h4>
        <p>Families with children ages 0–5</p>
      </div>
      <Link className="gtd-facts__cta" to={HALLOWEEN_EVENTS_HREF}>
        Browse Halloween events on Puddles →
      </Link>
    </div>
  )
}

export function GuideVisitBlock() {
  return (
    <section className="gtd-visit" aria-labelledby="gtd-visit-title">
      <h3 id="gtd-visit-title">Plan your visit</h3>
      <p className="gtd-visit__lede">
        South Peninsula &amp; nearby · October 2026. Verify each organizer before you go—times and
        street closures change.
      </p>
      <div className="gtd-visit__cols">
        <div>
          <h4>Before you leave home</h4>
          <ul>
            <li>Pick one anchor outing per day; little ones tire quickly at big carnivals.</li>
            <li>Pack snacks, layers, and a backup costume piece for spills.</li>
            <li>Check parking and stroller access on the official event page.</li>
          </ul>
        </div>
        <div>
          <h4>Daytime vs Halloween night</h4>
          <ul>
            <li>Structured trick-or-treat hours work well before October 31.</li>
            <li>Famous streets can be crowded; one neighborhood is enough.</li>
            <li>Pumpkin patches are flexible—go when nap schedules allow.</li>
          </ul>
        </div>
      </div>
      <div className="gtd-faq">
        {VISIT_FAQ.map((item) => (
          <details key={item.q} className="gtd-faq__item">
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

export function GuidePhotoGallery() {
  return (
    <section className="gtd-gallery" aria-label="Gallery">
      <h3>Gallery</h3>
      <ul>
        {GALLERY.map((photo) => (
          <li key={photo.src}>
            <img src={photo.src} alt={photo.alt} loading="lazy" />
          </li>
        ))}
      </ul>
    </section>
  )
}

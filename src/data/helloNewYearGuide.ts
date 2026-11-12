/** Hello, New Year! — companion winter guide. */
export const HELLO_NEW_YEAR_GUIDE_SLUG = 'hello-new-year'
export const HELLO_NEW_YEAR_GUIDE_PATH = '/guides/hello-new-year'

export const HELLO_NEW_YEAR_EVENTS_HREF = '/seasonal/holiday-magic#events'
export const HELLO_NEW_YEAR_CTA_LABEL = 'Explore holiday activities →'

export const HELLO_NEW_YEAR_GUIDE_TITLE = 'Hello, New Year!'
export const HELLO_NEW_YEAR_GUIDE_SUBTITLE = 'SOUTH PENINSULA · AGES 0–5'
export const HELLO_NEW_YEAR_GUIDE_DEK =
  'Balloon drops, January traditions, and little ways to welcome the new year.'

export const HELLO_NEW_YEAR_GUIDE_POSTED = 'Dec 7, 2026'
export const HELLO_NEW_YEAR_GUIDE_READ = '6 min read'

/** SEO (search titles ≠ on-page hero). */
export const HELLO_NEW_YEAR_GUIDE_SEO_TITLE =
  "Bay Area Noon Year's Eve & New Year Events for Kids | Puddles"
export const HELLO_NEW_YEAR_GUIDE_SEO_DESCRIPTION =
  "Find Noon Year's Eve balloon drops, daytime countdowns, and January celebrations for kids ages 0–5 across Palo Alto, Sunnyvale, and the Bay Area."

/** Schulz Museum archival celebration — full-bleed hero / catalog cover. */
export const HELLO_NEW_YEAR_GUIDE_COVER =
  'https://schulzmuseum.org/wp-content/uploads/2015/01/photo-1.jpg'

export const HELLO_NEW_YEAR_GUIDE_EVENT_IDS = {
  sunnyvale: 'guide-noon-years-eve-sunnyvale-2026-12-30',
  paloAltoNoon: 'disc-noon-year-s-eve-celebration-2026-12-31-6a750a3788e9bf28003613ac',
  cdmNoon: 'guide-noon-years-eve-cdm-2026-12-31',
  hillerNoon: 'guide-noon-years-eve-hiller-2026-12-31',
  badmNoon: 'disc-noon-year-s-eve-2026-12-31-regional-badm-noon-years-eve-2026-12-31',
  chabot: 'guide-balloon-drop-chabot-2026-12-31',
  fairyland: 'disc-countdown-in-wonderland-2026-12-31-regional-fairyland-countdown-wonderland-',
  schulz: 'guide-happy-new-year-charlie-brown-2026-12-31',
  hakone: 'guide-oshogatsu-hakone-2027-01-02',
  tresReyes: 'guide-el-dia-de-los-tres-reyes-magos-2027-01-09',
  greetings: 'guide-new-year-greetings-sjpl-2027-01-15',
} as const

export const HELLO_NEW_YEAR_GUIDE_EVENT_COUNT = Object.keys(HELLO_NEW_YEAR_GUIDE_EVENT_IDS).length

export const HELLO_NEW_YEAR_SECTION_CLAY = {
  nearby: '/guides/holiday-lights/magical-01.png',
  trip: '/guides/holiday-lights/magical-09.png',
  january: '/guides/holiday-lights/magical-04.png',
  before: '/seasonal/holiday-magic.png',
} as const

export const HELLO_NEW_YEAR_GUIDE_SECTION_NAV = [
  {
    slug: 'nearby',
    label: 'City & Library',
    imageSrc: HELLO_NEW_YEAR_SECTION_CLAY.nearby,
  },
  {
    slug: 'trip',
    label: 'Museums & More',
    imageSrc: HELLO_NEW_YEAR_SECTION_CLAY.trip,
  },
  {
    slug: 'january',
    label: 'January Events',
    imageSrc: HELLO_NEW_YEAR_SECTION_CLAY.january,
  },
  { slug: 'before', label: 'Before you go', imageSrc: HELLO_NEW_YEAR_SECTION_CLAY.before },
] as const

export const HELLO_NEW_YEAR_OUTING_IMAGES = {
  sunnyvale:
    'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1200&q=80',
  'palo-alto-noon':
    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1200&q=80',
  'cdm-noon': 'https://www.cdm.org/wp-content/uploads/2025/10/noon-years-eve-tile.png',
  'hiller-noon': 'https://www.hiller.org/wp-content/uploads/2022_Tam-DSCF1847_XP2-scaled.jpg',
  'badm-noon':
    'https://bayareadiscoverymuseum.org/wp-content/uploads/2024/09/BADM_events_NoonYears_hero.jpg',
  chabot:
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80',
  fairyland: 'https://fairyland.org/wp-content/uploads/FL26.Countdown.web_WEbbanner.png',
  schulz: 'https://schulzmuseum.org/wp-content/uploads/2015/01/photo-1.jpg',
  hakone:
    'https://static.wixstatic.com/media/831588_ea596011c09041a6b21ce95380b1896b~mv2.jpg/v1/fill/w_600,h_450,al_c/831588_ea596011c09041a6b21ce95380b1896b~mv2.jpg',
  'tres-reyes': 'https://www.cdm.org/wp-content/uploads/2025/06/three-kings-03.png',
  greetings:
    'https://images.unsplash.com/photo-1605627079912-97c3810a11a4?auto=format&fit=crop&w=1200&q=80',
} as const

export const HELLO_NEW_YEAR_RELATED = [
  {
    title: 'Lunar New Year with Little Ones 🧧',
    dek: 'Storytimes, family festivals, crafts, and cultural performances — Coming January 2027.',
  },
  {
    title: 'Holiday Lights & Traditions ✨',
    dek: 'Lights, train rides, Santa visits, and local holiday traditions.',
    href: '/guides/holiday-lights-traditions',
  },
  {
    title: 'Holiday Stories & Play 🎭',
    dek: 'Family shows, stories, crafts, and winter play.',
    href: '/guides/holiday-stories-play',
  },
] as const

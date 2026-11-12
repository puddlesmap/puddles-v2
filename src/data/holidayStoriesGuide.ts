/** Holiday Stories & Play — companion winter guide. */
export const HOLIDAY_STORIES_GUIDE_SLUG = 'holiday-stories-play'
export const HOLIDAY_STORIES_GUIDE_PATH = '/guides/holiday-stories-play'
/** Legacy URL from the prior “Shows & Play” title. */
export const HOLIDAY_STORIES_GUIDE_LEGACY_PATH = '/guides/holiday-stories-shows-play'

export const HOLIDAY_STORIES_EVENTS_HREF = '/seasonal/holiday-magic#events'
export const HOLIDAY_STORIES_CTA_LABEL = 'Explore holiday activities →'

export const HOLIDAY_STORIES_GUIDE_TITLE = 'Holiday Stories & Play'
export const HOLIDAY_STORIES_GUIDE_SUBTITLE = 'SOUTH PENINSULA · AGES 0–5'
export const HOLIDAY_STORIES_GUIDE_DEK =
  'Family shows, stories, crafts, and winter play.'

export const HOLIDAY_STORIES_GUIDE_POSTED = 'Nov 19, 2026'
export const HOLIDAY_STORIES_GUIDE_READ = '5 min read'

/** SEO (search titles ≠ on-page hero). */
export const HOLIDAY_STORIES_GUIDE_SEO_TITLE =
  'Bay Area Holiday Shows, Storytimes & Winter Play | Puddles'
export const HOLIDAY_STORIES_GUIDE_SEO_DESCRIPTION =
  'Discover holiday shows, storytimes, winter crafts, and hands-on museum play for kids ages 0–5 across the Bay Area, with helpful tips before you go.'

/** Winter Wonderlab iceless rink — full-bleed hero / catalog cover. */
export const HOLIDAY_STORIES_GUIDE_COVER =
  'https://bayareadiscoverymuseum.org/wp-content/uploads/2025/10/IcelessWeb.webp'

export const HOLIDAY_STORIES_GUIDE_EVENT_IDS = {
  littleRed: 'core-weekend-playhouse-little-red-riding-hood-2026-11-21',
  nightBeforeChristmas:
    'disc-the-night-before-christmas-stories-on-st-2026-12-11-manual-the-night-before-christmas-storie',
  gingerbread: 'core-weekend-playhouse-gingerbread-man-2026-12-19',
  nutcracker: 'guide-my-very-first-nutcracker-2026-12-20',
  hanukkah: 'guide-hanukkah-storytime-crafts-jcc-2026-12-02',
  menorahs: 'guide-menorahs-miracles-cdm-2026-12-06',
  northPole: 'guide-wee-explore-north-pole-sjpl-2026-12-12',
  wonderlab: 'disc-winter-wonderlab-2026-11-21-regional-badm-winter-wonderlab-2026-11-2',
  winterfest: 'guide-winterfest-frosty-science-chabot-2026-12-16',
} as const

export const HOLIDAY_STORIES_GUIDE_EVENT_COUNT = Object.keys(HOLIDAY_STORIES_GUIDE_EVENT_IDS).length

export const HOLIDAY_STORIES_SECTION_CLAY = {
  shows: '/guides/holiday-lights/magical-08.png',
  crafts: '/guides/holiday-lights/magical-03.png',
  play: '/guides/holiday-lights/magical-01.png',
  before: '/seasonal/holiday-magic.png',
} as const

export const HOLIDAY_STORIES_GUIDE_SECTION_NAV = [
  { slug: 'shows', label: 'Live Shows', imageSrc: HOLIDAY_STORIES_SECTION_CLAY.shows },
  {
    slug: 'crafts',
    label: 'Stories & Crafts',
    imageSrc: HOLIDAY_STORIES_SECTION_CLAY.crafts,
  },
  { slug: 'play', label: 'Winter Play', imageSrc: HOLIDAY_STORIES_SECTION_CLAY.play },
  { slug: 'before', label: 'Before you go', imageSrc: HOLIDAY_STORIES_SECTION_CLAY.before },
] as const

export const HOLIDAY_STORIES_OUTING_IMAGES = {
  'little-red':
    'https://www.paloalto.gov/files/assets/public/v/1/community-services/childrens-theatre/sleeping-beauty-photos-by-karen-ambrose-hickey-22.jpg?h=1002&w=1500',
  'night-before-christmas': 'https://pytnet.org/uploads/xmas.jpg',
  gingerbread: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/The_Gingerbread_Man.jpg',
  nutcracker:
    'https://images.squarespace-cdn.com/content/v1/5c0aacd32714e5a00edb340b/9b016d91-99f3-48df-988e-f58d0926ceda/Nutcracker207.jpg',
  hanukkah:
    'https://uploads.tickettailorassets.com/v1/production/userfiles/xujsgje5beh6xnbt387a.jpg?_a=BAAHWXDQ',
  menorahs:
    'https://www.cdm.org/wp-content/uploads/2018/12/Menorahs-and-Miracles-2018-6_cropped.jpg',
  'north-pole':
    'https://sjpl.bibliocommons.com/events/uploads/images/full/5f38cfad2eb0c611212656da1b398cf3/sjplbe_penguins.jpg',
  wonderlab: 'https://bayareadiscoverymuseum.org/wp-content/uploads/2025/10/IcelessWeb.webp',
  winterfest:
    'https://chabotspace.org/wp-content/uploads/2024/12/Winterfest-web-graphics_241101_SiteSmallFeature_380x250.png',
} as const

export const HOLIDAY_STORIES_RELATED = [
  {
    title: 'Hello, New Year! 🎉',
    dek: 'Balloon drops, January traditions, and little ways to welcome the new year.',
  },
  {
    title: 'Holiday Lights & Traditions ✨',
    dek: 'Lights, train rides, Santa visits, and local holiday traditions.',
    href: '/guides/holiday-lights-traditions',
  },
] as const

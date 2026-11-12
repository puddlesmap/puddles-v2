/** Public Holiday Lights & Traditions guide. */
export const HOLIDAY_GUIDE_SLUG = 'holiday-lights-traditions'

export const HOLIDAY_GUIDE_PATH = '/guides/holiday-lights-traditions'
/** Legacy URL from the prior Holiday Magic guide slug. */
export const HOLIDAY_GUIDE_LEGACY_PATH = '/guides/holiday-magic-with-little-ones'

export const HOLIDAY_COLLECTION_PATH = '/seasonal/holiday-magic'

/** Seasonal page event list. Guide CTA scrolls here. */
export const HOLIDAY_EVENTS_ANCHOR = 'events'

export const HOLIDAY_EVENTS_HREF = `${HOLIDAY_COLLECTION_PATH}#${HOLIDAY_EVENTS_ANCHOR}`

export const HOLIDAY_GUIDE_CTA_LABEL = 'Explore holiday activities →'

/** Holidays at Filoli — glowing pathways (official Filoli photo). */
export const HOLIDAY_GUIDE_COVER =
  'https://filoli.org/media/xbcltkxd/filoli-holiday-lights-inmenlo-11-20-2022-0194-6.jpg'

/** Approved Puddles clay illustration for collection entry + brand moments. */
export const HOLIDAY_GUIDE_ILLUSTRATION = '/seasonal/holiday-magic.png'

/** Article title (seasonal collection stays “Holiday Magic with Little Ones”). */
export const HOLIDAY_GUIDE_TITLE = 'Holiday Lights & Traditions'

export const HOLIDAY_GUIDE_SUBTITLE = 'SOUTH PENINSULA · AGES 0–5'

export const HOLIDAY_GUIDE_DEK =
  'Lights, train rides, Santa visits, and local holiday traditions.'

/** Target publish date for the polished guide. */
export const HOLIDAY_GUIDE_POSTED = 'Nov 11, 2026'
export const HOLIDAY_GUIDE_READ = '8 min read'

/** SEO (search titles ≠ on-page hero). */
export const HOLIDAY_GUIDE_SEO_TITLE =
  'Bay Area Holiday Lights & Santa Events for Kids | Puddles'
export const HOLIDAY_GUIDE_SEO_DESCRIPTION =
  'Find holiday lights, Santa visits, festive train rides, and local celebrations for little ones in Palo Alto, Mountain View, Los Altos, and beyond.'

/** Official / host outing photos for featured guide cards. */
export const HOLIDAY_GUIDE_OUTING_IMAGES = {
  'christmas-tree-lane':
    'https://stanforddaily.com/wp-content/uploads/2021/12/Vivien-Chen_Christmas-Tree-Lane-scaled.jpg',
  filoli:
    'https://filoli.org/media/gisjfdd0/olivia-marshall-thistlewyck-12-3.jpg?height=1230&quality=80&rmode=crop&rxy=0.5%2C0.5078231974492391&width=1640',
  'christmas-in-park':
    'https://christmasinthepark.com/wp-content/uploads/2026/11/CITP_Blinky_Pause_Hero_2026-1536x857.jpg',
  'fantasy-of-lights':
    'https://files.santaclaracounty.gov/exjcpb1516/styles/card_horizontal_850x478/s3/2024-10/fol_arch_1600x900.jpg.webp?VersionId=bpLGf4cKHd1dPv.QbCaaOsQLCjU_g.fL&itok=RcUHeVzf',
  'los-altos-parade':
    'https://static.wixstatic.com/media/8d9896_01a69e7034ca41b5abf8a5f49c2b5c8b%7Emv2.jpg/v1/fill/w_1200,h_800,al_c,q_85,enc_auto/8d9896_01a69e7034ca41b5abf8a5f49c2b5c8b%7Emv2.jpg',
  'los-altos-tree': 'https://downtownlosaltos.org/wp-content/uploads/2018/08/Tree2.jpg',
  'mountain-view-tree':
    'https://i0.wp.com/www.mv-voice.com/wp-content/uploads/2025/11/TreeLighting_web09.jpg?fit=2000%2C1333&ssl=1',
  'german-market':
    'https://resources.finalsite.net/images/t_image_size_4/v1766033817/gissv/ebtvseuoqjsu8mc2ti6u/BarakShrama-socialmediaselects-029.jpg',
  'hiller-santa': 'https://www.hiller.org/wp-content/uploads/santa_2_600x450px-1.jpg',
  'santas-tree-farm':
    'https://assets.simpleviewinc.com/simpleview/image/upload/c_limit,h_1200,q_75,w_1200/v1/crm/sanmateoca/Santas-Tree-train-ride-fdfca2a65056a36_fdfca3dd-5056-a36a-0bdd1712ec5e94a1.jpg',
  caltrain: 'https://www.caltrain.com/files/images/2025-12/Holiday%20Train.jpg',
  'billy-jones':
    'https://static.wixstatic.com/media/ac1bb4_23ec671624e04544875ac2ef042d4005%7Emv2.jpg/v1/fit/w_2500,h_1330,al_c/ac1bb4_23ec671624e04544875ac2ef042d4005%7Emv2.jpg',
} as const

/** Coming-soon related guides (no href → non-interactive teaser rows). */
export const HOLIDAY_GUIDE_RELATED = [
  {
    title: 'Holiday Stories & Play 🎭',
    dek: 'Family shows, stories, crafts, and winter play.',
  },
  {
    title: 'Hello, New Year! 🎉',
    dek: 'Balloon drops, January traditions, and little ways to welcome the new year.',
  },
] as const

/** Puddles clay thumbs for In this guide — brand moments only. */
export const HOLIDAY_GUIDE_SECTION_CLAY = {
  lights: '/guides/holiday-lights/magical-01.png',
  parades: '/guides/holiday-lights/magical-06.png',
  santa: '/guides/holiday-lights/magical-08.png',
  trains: '/guides/holiday-lights/magical-02.png',
  before: HOLIDAY_GUIDE_ILLUSTRATION,
} as const

/** Stable Puddles event IDs used in the guide (when a live record exists). */
export const HOLIDAY_GUIDE_EVENT_IDS = {
  filoli: 'regional-filoli-holidays-2026-11-14',
  festivalOfLightsParade: 'seasonal-los-altos-festival-of-lights-parade-2026-11-29',
  losAltosTree: 'seasonal-los-altos-holiday-tree-celebration-2026-12-04',
  mountainViewTree: 'community-tree-lighting-celebration-civic-center-plaza-2026-12-07-17-30',
  hillerSanta: 'seasonal-hiller-santa-helicopter-2026-12-05',
  onceUponAGarden: 'seasonal-once-upon-a-garden-2026-12-04',
  christmasTreeLane: 'seasonal-christmas-tree-lane-palo-alto-2026-12',
  christmasInThePark: 'regional-christmas-in-the-park-san-jose-2026-11-27',
  fantasyOfLights: 'regional-fantasy-of-lights-vasona-2026-12-05',
  billyJones: 'regional-billy-jones-holiday-night-train-2026-12-14',
  caltrainHolidayTrain: 'seasonal-caltrain-holiday-train-2026-12-05',
  santasTreeFarm: 'regional-santas-tree-farm-half-moon-bay-2026-11-21',
  germanHolidayMarket: 'seasonal-german-holiday-market-mv-2026-12-12',
  holidayStroll: 'manual-23rd-annual-holiday-stroll-2026-11-13',
  holidayMarket: 'manual-holiday-market-downtown-los-altos-2026-12-10',
  glowfari: 'regional-oakland-zoo-glowfari-2026-11-06',
  fairyWinterland: 'regional-fairyland-fairy-winterland-2026-12-12',
  cupertinoTreeLighting: 'seasonal-cupertino-community-tree-lighting-2026-12-04',
  photosynthesis: 'regional-photosynthesis-conservatory-2026-10-01',
  lightscape: 'regional-lightscape-sf-botanical-2026-11-20',
  northPoleNights: 'regional-gilroy-north-pole-nights-2026-11-21',
} as const

export const HOLIDAY_GUIDE_EVENT_COUNT = Object.keys(HOLIDAY_GUIDE_EVENT_IDS).length

export const HOLIDAY_GUIDE_SECTION_NAV = [
  { slug: 'lights', label: 'Lights & Walks', imageSrc: HOLIDAY_GUIDE_SECTION_CLAY.lights },
  {
    slug: 'parades',
    label: 'Town Celebrations',
    imageSrc: HOLIDAY_GUIDE_SECTION_CLAY.parades,
  },
  { slug: 'santa', label: 'Santa Visits', imageSrc: HOLIDAY_GUIDE_SECTION_CLAY.santa },
  { slug: 'trains', label: 'Train Rides', imageSrc: HOLIDAY_GUIDE_SECTION_CLAY.trains },
  { slug: 'before', label: 'Before you go', imageSrc: HOLIDAY_GUIDE_SECTION_CLAY.before },
] as const

export const HALLOWEEN_GUIDE_SLUG = 'halloween-with-little-ones'

export const HALLOWEEN_GUIDE_PATH = '/guides/halloween-with-little-ones'

export const HALLOWEEN_COLLECTION_PATH = '/seasonal/halloween-with-little-ones'

/** Menlo Park Halloween Hoopla — children in costume on Santa Cruz Avenue. */
export const HALLOWEEN_GUIDE_COVER =
  'https://www.menlopark.gov/files/sharedassets/public/v/1/library-and-community-services/images/events/children-in-costume-on-santa-cruz-avenue-sidewalk-for-halloween-hoopla-downtown-merchant-trick-or-treating-and-parade.jpg'

export const HALLOWEEN_GUIDE_POSTED = 'Posted October 22, 2026'
export const HALLOWEEN_GUIDE_READ = '7 min read'

export const HALLOWEEN_GUIDE_CHART = [
  {
    plan: 'Free city mornings',
    when: 'Saturday daytime',
    cost: 'Free',
    bestFor: 'Ages 0–5',
    crowd: 'A full morning in one place',
  },
  {
    plan: 'School carnivals',
    when: 'Saturday afternoon, or Friday before Halloween',
    cost: 'Free to enter. Games and wristbands cost extra.',
    bestFor: 'Preschoolers',
    crowd: 'Festive and busy',
  },
  {
    plan: 'Daytime trick-or-treat',
    when: 'Wednesday through Saturday, before Halloween night',
    cost: 'Free',
    bestFor: 'Younger children who want a set time',
    crowd: 'Downtown can be crowded',
  },
  {
    plan: 'Famous streets on Halloween night',
    when: 'Saturday, October 31, evening',
    cost: 'Free',
    bestFor: 'Families who want a lively night',
    crowd: 'Can be very large',
  },
  {
    plan: 'Pumpkin patches',
    when: 'Daytime, through the season',
    cost: 'Admission is often free. Pumpkins and rides are extra.',
    bestFor: 'A flexible outdoor day',
    crowd: 'Varies by farm and day',
  },
] as const

export type GuidePlaceGroup = 'tradition' | 'neighborhood'

export interface GuidePlace {
  slug: string
  name: string
  group: GuidePlaceGroup
  lat: number
  lng: number
  status: string
}

/** Area pins, not a specific house. */
export const HALLOWEEN_GUIDE_PLACES: GuidePlace[] = [
  {
    slug: 'old-palo-alto',
    name: 'Old Palo Alto',
    group: 'tradition',
    lat: 37.4441,
    lng: -122.1516,
    status: 'Individual household participation and street closures have not been confirmed.',
  },
  {
    slug: 'addison',
    name: 'Addison Avenue',
    group: 'tradition',
    lat: 37.4459,
    lng: -122.1496,
    status: 'A neighborhood tradition. Specific homeowners’ participation is not confirmed for 2026.',
  },
  {
    slug: 'professorville',
    name: 'Professorville',
    group: 'neighborhood',
    lat: 37.4415,
    lng: -122.1522,
    status: 'Historic homes and neighborhood trick-or-treating. Participation varies by year.',
  },
  {
    slug: 'crescent-park',
    name: 'Crescent Park',
    group: 'neighborhood',
    lat: 37.4531,
    lng: -122.149,
    status: 'Historic homes and neighborhood trick-or-treating. Participation varies by year.',
  },
  {
    slug: 'orange',
    name: 'Orange Avenue',
    group: 'neighborhood',
    lat: 37.3787,
    lng: -122.1162,
    status: 'No confirmed current closure schedule. Do not assume the area is car-free.',
  },
  {
    slug: 'mercy-bush',
    name: 'Mercy-Bush, Old Mountain View',
    group: 'neighborhood',
    lat: 37.394,
    lng: -122.0822,
    status: 'A community recommendation, not an officially scheduled event.',
  },
  {
    slug: 'shoreline-west',
    name: 'Shoreline West',
    group: 'neighborhood',
    lat: 37.4135,
    lng: -122.0885,
    status: 'A community recommendation, not an officially scheduled event.',
  },
  {
    slug: 'whisman',
    name: 'Whisman Station',
    group: 'neighborhood',
    lat: 37.3928,
    lng: -122.0608,
    status: 'A community recommendation, not an officially scheduled event.',
  },
  {
    slug: 'tait',
    name: 'Tait Avenue, Los Gatos',
    group: 'neighborhood',
    lat: 37.2272,
    lng: -121.9828,
    status: 'Check Los Gatos closure notices for the exact blocks and times.',
  },
  {
    slug: 'johnson',
    name: 'Johnson Avenue, Los Gatos',
    group: 'neighborhood',
    lat: 37.2294,
    lng: -121.9778,
    status: 'Check Los Gatos closure notices for the exact blocks and times.',
  },
  {
    slug: 'pope',
    name: 'Pope Street, Menlo Park',
    group: 'neighborhood',
    lat: 37.4526,
    lng: -122.1698,
    status: 'Known locally for trick-or-treating. Participation varies by year.',
  },
  {
    slug: 'cabrillo',
    name: 'Cabrillo Avenue, Burlingame',
    group: 'neighborhood',
    lat: 37.5812,
    lng: -122.3528,
    status: 'Do not assume the street is closed to vehicles.',
  },
  {
    slug: 'belvedere',
    name: 'Belvedere Street, San Francisco',
    group: 'neighborhood',
    lat: 37.7636,
    lng: -122.4502,
    status: 'Expect hills and a busy evening. Participation varies by year.',
  },
  {
    slug: 'fair-oaks',
    name: 'Fair Oaks Street, San Francisco',
    group: 'neighborhood',
    lat: 37.7508,
    lng: -122.4248,
    status: 'A relatively flat neighborhood walk. Participation varies by year.',
  },
]

export type DiscoverySourceType = 'calendar' | 'city-page' | 'instagram' | 'facebook' | 'schedule'

/** Weekly rotation only — not every watchlist row. Written back to calendar-watchlist `lastCheck`. */
export type WatchlistCheckStatus =
  | 'checked'
  | 'no-new-events'
  | 'extraction-failed'
  | 'review-needed'

export type AdminManualCheckLink = {
  id: string
  name: string
  why: string
  url: string
  active: boolean
  sourceType: DiscoverySourceType
}

/** Fixed source registry for the browser discovery agent. Not a checklist to open by hand. */
export const ADMIN_MANUAL_CHECK_LINKS: AdminManualCheckLink[] = [
  {
    id: 'sunnyvale-kids',
    name: 'Sunnyvale kids calendar',
    why: 'The site blocks the download. If a row still says POSTPONED, keep watching until city social posts a new date.',
    url: 'https://www.library.sunnyvale.ca.gov/events/kids-events',
    active: true,
    sourceType: 'calendar',
  },
  {
    id: 'sunnyvale-special',
    name: 'Sunnyvale special events',
    why: 'Orchard Music Series and other city events. The next season’s flyer often shows up here.',
    url: 'https://www.sunnyvale.ca.gov/recreation-and-community/special-events',
    active: true,
    sourceType: 'city-page',
  },
  {
    id: 'ig-cityofsunnyvale',
    name: 'Instagram @cityofsunnyvale',
    why: 'City flyers, including the next Orchard season, often post here before the events page updates.',
    url: 'https://www.instagram.com/cityofsunnyvale/',
    active: true,
    sourceType: 'instagram',
  },
  {
    id: 'ig-sunnyvale-recreation',
    name: 'Instagram @sunnyvale_recreation',
    why: 'Recreation nights and series lineups.',
    url: 'https://www.instagram.com/sunnyvale_recreation/',
    active: true,
    sourceType: 'instagram',
  },
  {
    id: 'fb-sunnyvale',
    name: 'City of Sunnyvale Facebook',
    why: 'Grand openings and postponed dates often post here before the library calendar updates.',
    url: 'https://www.facebook.com/CityofSunnyvale/',
    active: true,
    sourceType: 'facebook',
  },
  {
    id: 'fit4mom',
    name: 'FIT4MOM Glofox',
    why: 'The class list is drawn after the page loads, so a download of this URL comes back empty.',
    url: 'https://sunnyvale.fit4mom.com/schedule',
    active: true,
    sourceType: 'schedule',
  },
  {
    id: 'bing-performance',
    name: 'Bing Performance Series',
    why: 'Stanford family concerts. They are not on the Palo Alto city directory.',
    url: 'https://bingschool.stanford.edu/news-events/bing-performance-series',
    active: true,
    sourceType: 'calendar',
  },
  {
    id: 'bing-upcoming',
    name: 'Bing upcoming events',
    why: 'Keep family concerts. Skip coffee talks, staff days, and shows limited to current Bing families.',
    url: 'https://bingschool.stanford.edu/news-events/all-upcoming-events',
    active: true,
    sourceType: 'calendar',
  },
  {
    id: 'mv-special',
    name: 'Mountain View special events',
    why: 'The city site blocks the download.',
    url: 'https://www.mountainview.gov/our-city/departments/community-services/special-events',
    active: true,
    sourceType: 'city-page',
  },
  {
    id: 'magical-bridge',
    name: 'Magical Bridge calendar',
    why: 'Open each event for the hours. Keep Palo Alto, Mountain View, and Sunnyvale.',
    url: 'https://www.magicalbridge.org/calendar',
    active: true,
    sourceType: 'calendar',
  },
  {
    id: 'ipa',
    name: 'IPA USA CA',
    why: 'Pop-up playdates post here first. Confirm on the host page before adding one.',
    url: 'https://www.instagram.com/ca.ipa.usa/',
    active: true,
    sourceType: 'instagram',
  },
  {
    id: 'bunnyhive-mv',
    name: 'The Bunny Hive Mountain View',
    why: 'Standing grownup-and-me classes plus named storytimes. The schedule is the Walla widget on this page (the email list is the same calendar). One row per class. Skip beer and brew pop-ups.',
    url: 'https://www.thebunnyhive.com/mountainview#Schedule',
    active: true,
    sourceType: 'schedule',
  },
  {
    id: 'pact-playhouse',
    name: 'Palo Alto Children’s Theatre',
    why: 'Playhouse and Main Stage showtimes. One production row with sessions, not one card per show.',
    url: 'https://www.paloalto.gov/Departments/Community-Services/Arts-Sciences/Palo-Alto-Childrens-Theatre',
    active: true,
    sourceType: 'calendar',
  },
  {
    id: 'pyt-shows',
    name: 'Peninsula Youth Theatre shows',
    why: 'Family Stories on Stage. Use the shows list, not a single production URL.',
    url: 'https://pytnet.org/shows/',
    active: true,
    sourceType: 'calendar',
  },
  {
    id: 'hidden-villa',
    name: 'Hidden Villa family programs',
    why: 'Weekend farm tours. One row with sessions. Los Altos Hills is core, not Worth a Drive.',
    url: 'https://www.hiddenvilla.org/programs/individuals-families/',
    active: true,
    sourceType: 'calendar',
  },
  {
    id: 'mommypoppins-bay-area',
    name: 'Mommy Poppins · Bay Area (roundup)',
    why: 'Leads only — open the events calendar for a date, then fact-check on the host’s official page.',
    url: 'https://mommypoppins.com/events/2462/san-francisco-bay-area/all/tag/all/age/all/all/all/type/0/deals/0/near/all',
    active: true,
    sourceType: 'calendar',
  },
  {
    id: 'palo-alto-calendar',
    name: 'Palo Alto city calendar',
    why: 'Full dated grid — not only Events Directory.',
    url: 'https://www.paloalto.gov/Home/Calendar',
    active: true,
    sourceType: 'calendar',
  },
  {
    id: 'los-altos-community',
    name: 'Los Altos community events',
    why: 'City hub for parades, Family Fun Days, and seasonal celebrations.',
    url: 'https://www.losaltosca.gov/324/Community-Events',
    active: true,
    sourceType: 'city-page',
  },
  {
    id: 'downtown-los-altos',
    name: 'Downtown Los Altos events',
    why: 'Trick-or-treat and merchant events (skip wine-only listings).',
    url: 'https://downtownlosaltos.org/events/',
    active: true,
    sourceType: 'city-page',
  },
]

/** ISO week of today’s Pacific calendar date, so checks clear when the week changes. */
export function pacificIsoWeekKey(reference = new Date()): string {
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(reference)
  const [year, month, day] = ymd.split('-').map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day))
  const weekday = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - weekday)
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

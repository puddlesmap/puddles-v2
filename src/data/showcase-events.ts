import type { Event } from '../types/event'
import { getAnchorDate, addDays, getThisWeekendRange, startOfDay } from '../utils/dates'
import { enrichPublishingFields } from '../utils/publishing'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80'

const LIBRARY_IMAGE =
  'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80'

const PARK_IMAGE =
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80'

const COMMUNITY_IMAGE =
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80'

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Curated events tied to the anchor date so Today / Tomorrow / Weekend tabs always have content. */
export function getShowcaseEvents(anchor = getAnchorDate()): Event[] {
  const today = startOfDay(anchor)
  const tomorrow = startOfDay(addDays(anchor, 1))
  const { start: sat, end: sun } = getThisWeekendRange(anchor)

  const todayStr = toDateStr(today)
  const tomorrowStr = toDateStr(tomorrow)
  const satStr = toDateStr(sat)
  const sunStr = toDateStr(sun)

  const events: Array<Omit<Event, 'status' | 'isPast' | 'isLive' | 'categoryTags'>> = [
    // —— Today ——
    {
      id: 'showcase-today-1',
      title: 'Music & Movement Circle',
      description:
        'Sing, clap, and wiggle together. A relaxed morning circle for toddlers and caregivers — no registration needed.',
      venue: 'Mitchell Park Library',
      address: '3700 Middlefield Rd, Palo Alto, CA',
      city: 'Palo Alto',
      date: todayStr,
      startTime: '10:30',
      endTime: '11:15',
      ageRange: '0–2',
      ageMin: 0,
      ageMax: 2,
      types: ['Music & Movement', 'Social & Play'],
      cost: 'Free',
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a5d4?auto=format&fit=crop&w=800&q=80',
      eventUrl: 'https://example.com/music-circle',
      verifiedDate: todayStr,
      lat: 37.4177,
      lng: -122.1288,
    },
    {
      id: 'showcase-today-2',
      title: 'Toddler Art Drop-In',
      description:
        'Open-ended art stations with washable paints, crayons, and collage materials. Drop in anytime during the window.',
      venue: 'Rinconada Library',
      address: '1213 Newell Rd, Palo Alto, CA',
      city: 'Palo Alto',
      date: todayStr,
      startTime: '14:00',
      endTime: '15:30',
      ageRange: '2–5',
      ageMin: 2,
      ageMax: 5,
      types: ['Arts & Crafts'],
      cost: 'Free',
      imageUrl: LIBRARY_IMAGE,
      eventUrl: 'https://example.com/art-drop-in',
      verifiedDate: todayStr,
      lat: 37.4281,
      lng: -122.1425,
    },
    {
      id: 'showcase-today-3',
      title: 'Bilingual Storytime',
      description: 'Stories and songs in English and Spanish. All families welcome — stay as long as little ones are engaged.',
      venue: 'Los Altos Library',
      address: '13 S San Antonio Rd, Los Altos, CA',
      city: 'Los Altos',
      date: todayStr,
      startTime: '16:00',
      endTime: '16:45',
      ageRange: '0–5',
      ageMin: 0,
      ageMax: 5,
      types: ['Stories'],
      cost: 'Free',
      imageUrl: FALLBACK_IMAGE,
      eventUrl: 'https://example.com/bilingual-storytime',
      verifiedDate: todayStr,
      lat: 37.3791,
      lng: -122.1142,
    },

    // —— Tomorrow ——
    {
      id: 'showcase-tomorrow-1',
      title: 'Family Storytime',
      description: 'Rhymes, puppets, and picture books for the whole family. Stroller-friendly seating in the story room.',
      venue: 'Downtown Library',
      address: '270 Forest Ave, Palo Alto, CA',
      city: 'Palo Alto',
      date: tomorrowStr,
      startTime: '10:30',
      endTime: '11:00',
      ageRange: '0–5',
      ageMin: 0,
      ageMax: 5,
      types: ['Stories'],
      cost: 'Free',
      imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80',
      eventUrl: 'https://example.com/family-storytime',
      verifiedDate: todayStr,
      lat: 37.4443,
      lng: -122.1598,
    },
    {
      id: 'showcase-tomorrow-2',
      title: 'Outdoor Playgroup at the Park',
      description: 'Casual meet-up for toddlers to run, climb, and play while parents chat. Bring water and a blanket.',
      venue: 'Pioneer Park',
      address: '525 Church St, Mountain View, CA',
      city: 'Mountain View',
      date: tomorrowStr,
      startTime: '09:30',
      endTime: '11:00',
      ageRange: '0–2',
      ageMin: 0,
      ageMax: 2,
      types: ['Outdoor', 'Social & Play'],
      cost: 'Free',
      imageUrl: PARK_IMAGE,
      eventUrl: 'https://example.com/playgroup',
      verifiedDate: todayStr,
      lat: 37.3945,
      lng: -122.0786,
    },

    // —— This weekend (Sat + Sun; may overlap tomorrow on Fri anchor) ——
    {
      id: 'showcase-weekend-sat-1',
      title: 'LEGO Fridays!',
      description:
        'We have the LEGOs! Bring your imagination and build something fun. Snap a pic before you go — creations stay at the library.',
      venue: "Children's Library",
      address: '1276 Harriet St, Palo Alto, CA',
      city: 'Palo Alto',
      date: satStr,
      startTime: '11:30',
      endTime: '12:30',
      ageRange: '2–5',
      ageMin: 2,
      ageMax: 5,
      types: ['Build & Explore'],
      cost: 'Free',
      imageUrl: LIBRARY_IMAGE,
      eventUrl: 'https://example.com/lego-fridays',
      verifiedDate: todayStr,
      lat: 37.4419,
      lng: -122.143,
    },
    {
      id: 'showcase-weekend-sat-2',
      title: 'Farmers Market Kids Corner',
      description: 'Live music, sample fruit, and a mini craft table at the downtown market. Perfect post-nap outing.',
      venue: 'Castro Street Plaza',
      address: 'Castro St, Mountain View, CA',
      city: 'Mountain View',
      date: satStr,
      startTime: '09:00',
      endTime: '12:00',
      ageRange: '0–5',
      ageMin: 0,
      ageMax: 5,
      types: ['Music & Movement', 'Outdoor'],
      cost: 'Free',
      imageUrl: COMMUNITY_IMAGE,
      eventUrl: 'https://example.com/farmers-market',
      verifiedDate: todayStr,
      lat: 37.3941,
      lng: -122.0819,
    },
    {
      id: 'showcase-weekend-sun-1',
      title: 'Celebrating Cultures: Kodomo no Hi Storytime',
      description:
        'A joyful storytime celebrating Children\'s Day with crafts, songs, and picture books from Japan. All ages welcome.',
      venue: 'Mountain View Library',
      address: '585 Franklin St, Mountain View, CA',
      city: 'Mountain View',
      date: sunStr,
      startTime: '11:30',
      endTime: '12:00',
      ageRange: '0–5',
      ageMin: 0,
      ageMax: 5,
      types: ['Stories', 'Arts & Crafts'],
      cost: 'Free',
      imageUrl: FALLBACK_IMAGE,
      eventUrl: 'https://example.com/kodomo-no-hi',
      verifiedDate: todayStr,
      lat: 37.3895,
      lng: -122.0818,
    },
    {
      id: 'showcase-weekend-sun-2',
      title: 'Sunday Stroller Walk',
      description: 'Slow-paced loop around the Magical Bridge playground. Great for new walkers and stroller naps afterward.',
      venue: 'Magical Bridge Playground',
      address: 'Rengstorff Park, Mountain View, CA',
      city: 'Mountain View',
      date: sunStr,
      startTime: '10:00',
      endTime: '11:00',
      ageRange: '0–2',
      ageMin: 0,
      ageMax: 2,
      types: ['Outdoor', 'Social & Play'],
      cost: 'Free',
      imageUrl: PARK_IMAGE,
      eventUrl: 'https://example.com/stroller-walk',
      verifiedDate: todayStr,
      lat: 37.395,
      lng: -122.088,
    },
  ]

  return events.map((event) =>
    enrichPublishingFields({
      ...event,
      categoryTags: [...event.types],
      status: 'Published',
    }),
  )
}

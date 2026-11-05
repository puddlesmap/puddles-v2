import { getSeasonalCollection } from './seasonalDiscovery'
import { zonedCalendarDate } from '../utils/dates'

export type HomeAnnouncementSlide = {
  id: string
  /** Parent-facing bar copy (may include leading emoji). */
  text: string
  /** Optional destination — whole slide is a link when set. */
  href?: string
}

/**
 * Active home announcement slides. Location is always first.
 * Seasonal slides only appear while their collection window is live.
 */
export function getHomeAnnouncements(now: Date = new Date()): HomeAnnouncementSlide[] {
  const today = zonedCalendarDate(now)
  const slides: HomeAnnouncementSlide[] = [
    {
      id: 'core-cities',
      text: '📍 Palo Alto · Los Altos · Mountain View · Sunnyvale + nearby adventures.',
    },
  ]

  const holiday = getSeasonalCollection('holiday-magic')
  if (holiday && holiday.activeFrom <= today && today <= holiday.activeUntil) {
    slides.push({
      id: 'holiday-magic',
      text: '✨ Holiday fun with little ones? Explore seasonal picks →',
      href: '/seasonal/holiday-magic',
    })
  }

  return slides
}

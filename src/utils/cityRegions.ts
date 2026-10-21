import { WELCOME_LAUNCH_CITIES } from './welcomeOnboarding'

/** Neighborhoods that browse with a launch city (same region, not Worth a Drive). */
export const CITY_REGION_ALIASES: Record<string, (typeof WELCOME_LAUNCH_CITIES)[number]> = {
  'Los Altos Hills': 'Los Altos',
}

/** Launch-city name parents pick in Browse. Los Altos Hills maps here. */
export function browseRegionForCity(city: string): string {
  const trimmed = city.trim()
  return CITY_REGION_ALIASES[trimmed] ?? trimmed
}

/** True for Palo Alto / Los Altos (including Hills) / Mountain View / Sunnyvale. */
export function isLaunchAreaCity(city: string): boolean {
  const region = browseRegionForCity(city)
  return (WELCOME_LAUNCH_CITIES as readonly string[]).includes(region)
}

/** Home and Browse location key for published events outside the four core cities. */
export const OTHER_CITIES_FILTER = 'other'

/** Browse / Admin city chips: Los Altos includes Los Altos Hills. */
export function matchesBrowseCityFilter(eventCity: string, filterCity: string): boolean {
  if (!filterCity || filterCity === 'all' || filterCity === 'nearby') return true
  if (filterCity === OTHER_CITIES_FILTER) return !isLaunchAreaCity(eventCity)
  if (eventCity === filterCity) return true
  return browseRegionForCity(eventCity) === browseRegionForCity(filterCity)
}

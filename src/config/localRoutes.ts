import type { City } from '../types/event'
import { SITE } from './site'

export type LocalCitySlug = 'palo-alto' | 'los-altos' | 'mountain-view'

export const LOCAL_CITY_ROUTES: Record<LocalCitySlug, City> = {
  'palo-alto': 'Palo Alto',
  'los-altos': 'Los Altos',
  'mountain-view': 'Mountain View',
}

export const LOCAL_CITY_SLUGS = Object.keys(LOCAL_CITY_ROUTES) as LocalCitySlug[]

export function cityDocumentTitle(citySlug: LocalCitySlug): string {
  return `${LOCAL_CITY_ROUTES[citySlug]} Activities for Ages 0\u20135 | ${SITE.name}`
}

export function cityMetaDescription(citySlug: LocalCitySlug): string {
  const city = LOCAL_CITY_ROUTES[citySlug]
  return `Find storytimes, music, drop-ins, library events, community programs, and local family activities for ages 0\u20135 in ${city}.`
}

export function cityIntroCopy(citySlug: LocalCitySlug): string {
  const city = LOCAL_CITY_ROUTES[citySlug]
  return `Puddles lists upcoming storytimes, music sessions, drop-ins, library events, and community programs for ages 0\u20135 in ${city}.`
}

export function isLocalCityPath(pathname: string): pathname is `/${LocalCitySlug}` {
  return LOCAL_CITY_SLUGS.includes(pathname.slice(1) as LocalCitySlug)
}

export function localCitySlugFromPath(pathname: string): LocalCitySlug | null {
  const slug = pathname.slice(1) as LocalCitySlug
  return slug in LOCAL_CITY_ROUTES ? slug : null
}

export function resolveCitySlugParam(value: string | null): City | null {
  if (!value) return null
  if (value in LOCAL_CITY_ROUTES) return LOCAL_CITY_ROUTES[value as LocalCitySlug]

  const cities = Object.values(LOCAL_CITY_ROUTES)
  return cities.includes(value as City) ? (value as City) : null
}

export function cityBrowseHref(citySlug: LocalCitySlug): string {
  return `/browse?city=${citySlug}`
}

export function cityMapHref(citySlug: LocalCitySlug): string {
  return `/map?city=${citySlug}`
}

export function citySlugForCity(city: City): LocalCitySlug | null {
  const entry = Object.entries(LOCAL_CITY_ROUTES).find(([, name]) => name === city)
  return entry ? (entry[0] as LocalCitySlug) : null
}

export function cityPathForCity(city: City): string {
  const slug = citySlugForCity(city)
  return slug ? `/${slug}` : '/browse'
}

import { LOCAL_CITY_ROUTES } from '@/config/localRoutes'
import {
  getActiveSeasonalCollection,
  getSeasonalCollection,
  isSeasonalCollectionSlug,
} from '@/data/seasonalDiscovery'

const EXPERIMENT_SEASONAL = /^\/experiment\/seasonal-discovery\/([a-z0-9-]+)$/
const PUBLIC_SEASONAL = /^\/seasonal\/([a-z0-9-]+)$/

export function seasonalSlugFromPath(pathname: string): string | null {
  const experiment = pathname.match(EXPERIMENT_SEASONAL)
  if (experiment && isSeasonalCollectionSlug(experiment[1])) return experiment[1]
  const pub = pathname.match(PUBLIC_SEASONAL)
  if (pub && isSeasonalCollectionSlug(pub[1])) return pub[1]
  if (pathname === '/seasonal') return getActiveSeasonalCollection()?.slug ?? null
  return null
}

export function isExperimentSeasonalCollection(pathname: string): boolean {
  const experiment = pathname.match(EXPERIMENT_SEASONAL)
  return Boolean(experiment && isSeasonalCollectionSlug(experiment[1]))
}

function searchParams(search: string): URLSearchParams {
  return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
}

function hasBrowseShareQuery(params: URLSearchParams): boolean {
  return Boolean(
    params.get('city') || params.get('activity') || params.get('age') || params.get('view'),
  )
}

/** Preferred URL for crawlers. Filtered Browse and old seasonal paths point at the public page. */
export function publicCanonicalPath(pathname: string, search = ''): string {
  const experiment = pathname.match(EXPERIMENT_SEASONAL)
  if (experiment && isSeasonalCollectionSlug(experiment[1])) {
    return `/seasonal/${experiment[1]}`
  }

  if (pathname === '/browse') {
    const params = searchParams(search)
    const city = params.get('city')
    const onlyCity = Boolean(city && !params.get('activity') && !params.get('age') && !params.get('view'))
    if (onlyCity && city && city in LOCAL_CITY_ROUTES) return `/${city}`
  }

  return pathname
}

/** noindex for personal Saved pages and Browse URLs that encode a temporary filter. */
export function publicRobots(pathname: string, search = ''): string | undefined {
  if (pathname === '/saved' || pathname.startsWith('/saved/')) return 'noindex, nofollow'
  if (pathname.startsWith('/experiment/seasonal-discovery')) return 'noindex, follow'
  if (pathname === '/browse' || pathname === '/browse-v2' || pathname === '/map') {
    if (hasBrowseShareQuery(searchParams(search))) return 'noindex, follow'
  }
  return undefined
}

export function publicDescription(pathname: string): string | undefined {
  if (pathname === '/browse' || pathname === '/browse-v2') {
    return 'Browse storytimes, music, drop-ins, and other activities for ages 0–5 in Palo Alto, Los Altos, Mountain View, and Sunnyvale.'
  }
  if (pathname === '/map') {
    return 'See activities for ages 0–5 on a map around Palo Alto, Los Altos, Mountain View, and Sunnyvale.'
  }
  if (pathname === '/share') {
    return 'Tell Puddles about a local activity, an idea, or something on a listing that needs a fix.'
  }
  if (pathname === '/about') {
    return 'Puddles lists local activities for ages 0–5, starting on the South Peninsula.'
  }
  if (pathname === '/saved') {
    return 'Activities you have saved on Puddles.'
  }
  if (pathname === '/guides') {
    return 'Short guides for little ones on the South Peninsula, starting with Halloween.'
  }

  const slug = seasonalSlugFromPath(pathname)
  if (pathname === '/seasonal' || slug || isExperimentSeasonalCollection(pathname)) {
    const collection = slug ? getSeasonalCollection(slug) : getActiveSeasonalCollection()
    return collection?.description
  }

  if (pathname.slice(1) in LOCAL_CITY_ROUTES) return undefined
  return undefined
}

export function publicOgImage(pathname: string): string | undefined {
  const slug = seasonalSlugFromPath(pathname)
  if (!slug) return undefined
  const image = getSeasonalCollection(slug)?.illustrationSrc
  return image || undefined
}

import { absoluteUrl, canonicalUrl, SITE } from '../config/site'
import { getActiveSeasonalCollection, getSeasonalCollection } from '../data/seasonalDiscovery'
import {
  publicCanonicalPath,
  publicDescription,
  publicOgImage,
  publicRobots,
  seasonalSlugFromPath,
} from '../seo/publicPaths'
import {
  cityDocumentTitle,
  cityMetaDescription,
  localCitySlugFromPath,
} from '../config/localRoutes'
import type { Event } from '../types/event'
import {
  eventDetailPath,
  eventIdFromPathname,
} from './eventPages'
import {
  eventMetaDescription,
  eventOgDescription,
  eventOgImageUrl,
  eventPageTitle,
} from './eventShare'

const SEP = ' · '

export function formatDocumentTitle(page: string, brand = SITE.name): string {
  return `${page}${SEP}${brand}`
}

export function homeDocumentTitle(): string {
  return SITE.siteTitle
}

export function getDocumentTitle(pathname: string, search = ''): string {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)

  if (pathname === '/') return homeDocumentTitle()

  if (pathname === '/map') return formatDocumentTitle('Map')

  if (pathname === '/browse' || pathname === '/browse-v2' || pathname === '/experiment-browse-3') {
    if (params.get('view') === 'map') return formatDocumentTitle('Map')
    return formatDocumentTitle('Browse Bay Area Activities')
  }

  if (pathname === '/experiment-browse-map') return formatDocumentTitle('Map')

  if (pathname === '/share') return formatDocumentTitle('Share with Us')
  if (pathname === '/contact') return formatDocumentTitle('Contact')
  if (pathname === '/privacy') return formatDocumentTitle('Privacy Policy')
  if (pathname === '/about') return formatDocumentTitle('About')

  const citySlug = localCitySlugFromPath(pathname)
  if (citySlug) return cityDocumentTitle(citySlug)

  if (pathname.startsWith('/admin')) return formatDocumentTitle('Admin')

  if (pathname === '/discovery') return formatDocumentTitle('Discovery')
  if (pathname === '/browse-v1' || pathname === '/browse-v2') {
    return formatDocumentTitle('Browse Bay Area Activities')
  }
  if (pathname === '/experiment-browse') return formatDocumentTitle('Browse Bay Area Activities')
  if (pathname === '/experiment-welcome') return formatDocumentTitle('Welcome Experiment')
  if (pathname === '/experiment/seasonal-discovery') {
    return formatDocumentTitle('Seasonal Discovery Experiment')
  }
  if (pathname === '/experiment/seasonal-discovery/calendar') {
    return formatDocumentTitle('Seasonal Theme Calendar')
  }
  if (pathname === '/experiment/seasonal-discovery/hello-fall') {
    return formatDocumentTitle('Hello, Fall')
  }
  if (pathname === '/experiment/seasonal-discovery/halloween-with-little-ones') {
    return formatDocumentTitle('Halloween fun for little ones')
  }
  if (pathname === '/guides/halloween-with-little-ones') {
    return 'Bay Area Halloween Events for Toddlers & Preschoolers | Puddles'
  }
  if (
    pathname === '/guides/holiday-lights-traditions' ||
    pathname === '/guides/holiday-magic-with-little-ones'
  ) {
    return 'Bay Area Holiday Lights & Santa Events for Kids | Puddles'
  }
  if (
    pathname === '/guides/holiday-stories-play' ||
    pathname === '/guides/holiday-stories-shows-play'
  ) {
    return 'Bay Area Holiday Shows, Storytimes & Winter Play | Puddles'
  }
  if (pathname === '/guides/hello-new-year') {
    return "Bay Area Noon Year's Eve & New Year Events for Kids | Puddles"
  }
  if (pathname === '/experiment/local-guides-layouts') {
    return formatDocumentTitle('Local Guides Layouts')
  }
  if (pathname === '/experiment/guide-card-mockups') {
    return formatDocumentTitle('Guide Card Mockups')
  }
  if (
    pathname === '/experiment/guide-tiny-dances' ||
    pathname === '/experiment/guide-content-mockups'
  ) {
    return formatDocumentTitle('Guide content mockups')
  }
  if (pathname === '/experiment/guides-home-mockups') {
    return formatDocumentTitle('Guides home mockups')
  }
  if (pathname === '/guides') {
    return 'Bay Area Family Activity Guides for Ages 0–5 | Puddles'
  }
  if (pathname === '/seasonal' || pathname.startsWith('/seasonal/')) {
    const slug = seasonalSlugFromPath(pathname)
    if (slug === 'holiday-magic') {
      return 'Bay Area Holiday Events for Kids (2026) | Puddles'
    }
    const collection = slug ? getSeasonalCollection(slug) : getActiveSeasonalCollection()
    return formatDocumentTitle(collection?.title ?? 'Seasonal Picks')
  }
  if (pathname === '/saved') return formatDocumentTitle('Saved')
  if (pathname === '/experiment/community-events-mockup') {
    return formatDocumentTitle('Community Events Mockup')
  }
  if (pathname === '/experiment/launch-expand-mockup') {
    return formatDocumentTitle('Event Card Badges Mockup')
  }
  if (pathname === '/experiment/browse-v2-mockup') {
    return formatDocumentTitle('Browse · Version 2-2 · User Test')
  }
  if (pathname === '/experiment/browse-v3-mockup') {
    return formatDocumentTitle('Browse · Version 3 · User Test')
  }
  if (pathname === '/experiment/browse-card-layout-mockup') {
    return formatDocumentTitle('Browse Card Layout Comparison')
  }
  if (pathname === '/experiment/browse-card-design-reference') {
    return formatDocumentTitle('Browse Card Design Reference')
  }
  if (pathname === '/experiment/browse-live-vs-option2') {
    return formatDocumentTitle('Live vs V3 Option 2')
  }
  if (pathname === '/experiment/home-launch-preview') {
    return formatDocumentTitle('Home Launch Preview')
  }
  if (pathname === '/experiment/seasonal-launch-review') {
    return formatDocumentTitle('Seasonal Launch Review')
  }
  if (pathname === '/experiment/hallmark-home-mockup') {
    return formatDocumentTitle('Hallmark Home Mockup')
  }
  if (pathname === '/experiment/home-apricot-band') {
    return formatDocumentTitle('Home Persimmon Band Mockup')
  }
  if (pathname === '/experiment/seasonal-back-nav-mockup') {
    return formatDocumentTitle('Seasonal Back Nav Mockup')
  }
  if (pathname === '/experiment/home-browse-chips-mockup') {
    return formatDocumentTitle('Home Browse Chips Mockup')
  }
  if (pathname === '/experiment/farm-season-ages-mockup') {
    return formatDocumentTitle('Farm Season Ages Mockup')
  }
  if (pathname === '/experiment/sunnyvale-library-images-mockup') {
    return formatDocumentTitle('Sunnyvale Library Images Mockup')
  }
  if (pathname === '/experiment/hallmark-hello-fall-mockup') {
    return formatDocumentTitle('Hallmark Hello Fall Mockup')
  }
  if (pathname === '/experiment/saved-and-picks') {
    return formatDocumentTitle('Saved and Puddles Picks')
  }
  if (pathname === '/experiment/puddles-picks-signup') {
    return formatDocumentTitle('Puddles Picks signup exploration')
  }
  if (pathname === '/experiment/saved') return formatDocumentTitle('Saved Experiment')
  if (pathname === '/experiment/saved/flow') return formatDocumentTitle('Saved sign-in flow')
  if (pathname === '/experiment/saved/heart') return formatDocumentTitle('Saved heart spec')
  if (pathname === '/experiment/saved-reminder-mockup') {
    return formatDocumentTitle('Saved reminder mockup')
  }
  if (
    pathname === '/experiment/event-detail-fullpage' ||
    pathname.startsWith('/experiment/event-detail-fullpage/')
  ) {
    return formatDocumentTitle('Event detail full-page mock')
  }
  if (pathname === '/experiment/saved-list') {
    return formatDocumentTitle('Saved list mobile variants')
  }
  if (pathname === '/experiment/where-when-search') {
    return formatDocumentTitle('Where / When search mock')
  }
  if (pathname === '/experiment/where-when-home-browse') {
    return formatDocumentTitle('Where / When Home + Browse mock')
  }
  if (pathname === '/experiment/home-where-when-pill') {
    return formatDocumentTitle('Home Where / When pill mock')
  }
  if (pathname === '/experiment/browse-where-when-pill') {
    return formatDocumentTitle('Browse Where / When pill mock')
  }
  if (pathname === '/experiment/browse-typeahead-filters') {
    return formatDocumentTitle('Browse typeahead filters mock')
  }
  if (pathname === '/experiment/holiday-magic-filters') {
    return formatDocumentTitle('Holiday Magic typeahead filters mock')
  }
  if (pathname === '/share-experiment') return formatDocumentTitle('Share Experiment')
  if (pathname === '/about-experiment' || pathname === '/experiment_about') {
    return formatDocumentTitle('About Experiment')
  }
  if (pathname === '/home-v1') return formatDocumentTitle('Home V1')
  if (pathname === '/home-experiment-1') return formatDocumentTitle('Home Experiment 1')
  if (pathname === '/home-experiment-2') return formatDocumentTitle('Home Experiment 2')
  if (pathname === '/home-experiment-3') return formatDocumentTitle('Home Experiment 3')
  if (pathname === '/home-experiment-4') return formatDocumentTitle('Home Experiment 4')
  if (pathname === '/typography-experiment') return formatDocumentTitle('Typography Experiments')
  if (pathname === '/typography-experiment/home') return formatDocumentTitle('Typography Home')
  if (pathname === '/typography-experiment/about') return formatDocumentTitle('Typography About')
  if (pathname === '/typography-experiment/about-style/home') {
    return formatDocumentTitle('Typography About Style')
  }
  if (
    pathname === '/typography-experiment/about-style/share' ||
    pathname === '/typography-experiment/share'
  ) {
    return formatDocumentTitle('Typography Share')
  }
  if (pathname === '/logo-lab') return formatDocumentTitle('Logo Lab')
  if (pathname === '/maintenance') return formatDocumentTitle('Maintenance')

  return formatDocumentTitle('Page Not Found')
}

function setMeta(attr: 'name' | 'property', key: string, content: string): void {
  if (typeof document === 'undefined') return

  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attr, key)
    document.head.appendChild(element)
  }
  element.content = content
}

function removeMeta(attr: 'name' | 'property', key: string): void {
  if (typeof document === 'undefined') return
  document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)?.remove()
}

function setCanonical(href: string): void {
  if (typeof document === 'undefined') return

  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.appendChild(element)
  }
  element.href = href
}

function applyRobotsMeta(pathname: string, robots?: string): void {
  if (robots) {
    setMeta('name', 'robots', robots)
    return
  }

  if (pathname.startsWith('/admin')) {
    setMeta('name', 'robots', 'noindex, nofollow')
    return
  }

  removeMeta('name', 'robots')
}

function applyMetaTags(
  title: string,
  pathname: string,
  options: {
    description?: string
    socialDescription?: string
    ogImage?: string
    robots?: string
    canonicalPath?: string
    search?: string
  } = {},
): void {
  const canonical = canonicalUrl(options.canonicalPath ?? publicCanonicalPath(pathname, options.search ?? ''))
  const citySlug = localCitySlugFromPath(pathname)
  const pageDescription = options.description ?? publicDescription(pathname)
  const description = pageDescription ?? (citySlug ? cityMetaDescription(citySlug) : SITE.description)
  const socialDescription =
    options.socialDescription ?? pageDescription ?? (citySlug ? cityMetaDescription(citySlug) : SITE.ogDescription)
  const ogTitle = pathname === '/' ? homeDocumentTitle() : title
  const ogImage = options.ogImage ?? absoluteUrl(publicOgImage(pathname) ?? SITE.ogImagePath)

  setCanonical(canonical)
  setMeta('name', 'description', description)
  setMeta('property', 'og:title', ogTitle)
  setMeta('property', 'og:description', socialDescription)
  setMeta('property', 'og:url', canonical)
  setMeta('property', 'og:site_name', SITE.siteName)
  setMeta('property', 'og:type', 'website')
  setMeta('property', 'og:image', ogImage)
  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', ogTitle)
  setMeta('name', 'twitter:description', socialDescription)
  setMeta('name', 'twitter:image', ogImage)
  applyRobotsMeta(pathname, options.robots ?? publicRobots(pathname, options.search ?? ''))
}

export function applyEventPageMeta(event: Event): void {
  const pathname = eventDetailPath(event)
  const title = eventPageTitle(event)
  const description = eventMetaDescription(event)
  const socialDescription = eventOgDescription(event)
  const image = eventOgImageUrl(event)

  if (typeof document !== 'undefined') {
    document.title = title
  }

  applyMetaTags(title, pathname, {
    description,
    socialDescription,
    ogImage: image,
  })
  setMeta('property', 'og:type', 'article')
  setMeta('property', 'og:title', event.title)
  setMeta('name', 'twitter:title', event.title)
}

export function applyUnavailableEventPageMeta(pathname: string, eventTitle?: string): void {
  const title = eventTitle
    ? formatDocumentTitle('Activity unavailable')
    : formatDocumentTitle('Activity unavailable')

  if (typeof document !== 'undefined') {
    document.title = title
  }

  applyMetaTags(title, pathname, {
    description: 'This activity is no longer listed on Puddles.',
    socialDescription: 'This activity is no longer listed on Puddles.',
    robots: 'noindex, nofollow',
  })
}

export function setPageTitle(title: string, pathname: string, search = ''): void {
  if (typeof document !== 'undefined') {
    document.title = title
  }
  applyMetaTags(title, pathname, { search })
}

export function applySiteMeta(pathname: string, search = ''): void {
  if (eventIdFromPathname(pathname)) return

  const title = getDocumentTitle(pathname, search)
  setPageTitle(title, pathname, search)
}

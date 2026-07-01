import { absoluteUrl, canonicalUrl, SITE } from '../config/site'
import {
  cityDocumentTitle,
  cityMetaDescription,
  localCitySlugFromPath,
} from '../config/localRoutes'
import type { Event } from '../types/event'
import {
  eventDetailPath,
  eventDocumentTitle,
  eventIdFromPathname,
  eventMetaDescription,
} from './eventPages'

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

  if (pathname === '/browse' || pathname === '/experiment-browse-3') {
    if (params.get('view') === 'map') return formatDocumentTitle('Map')
    return formatDocumentTitle('Browse Bay Area Activities')
  }

  if (pathname === '/experiment-browse-map') return formatDocumentTitle('Map')

  if (pathname === '/share') return formatDocumentTitle('Share with Us')
  if (pathname === '/about') return formatDocumentTitle('About')

  const citySlug = localCitySlugFromPath(pathname)
  if (citySlug) return cityDocumentTitle(citySlug)

  if (pathname.startsWith('/admin')) return formatDocumentTitle('Admin')

  if (pathname === '/discovery') return formatDocumentTitle('Discovery')
  if (pathname === '/browse-v1') return formatDocumentTitle('Browse Bay Area Activities')
  if (pathname === '/experiment-browse') return formatDocumentTitle('Browse Bay Area Activities')
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
  } = {},
): void {
  const canonical = canonicalUrl(pathname)
  const citySlug = localCitySlugFromPath(pathname)
  const description = options.description ?? (citySlug ? cityMetaDescription(citySlug) : SITE.description)
  const socialDescription =
    options.socialDescription ?? (citySlug ? cityMetaDescription(citySlug) : SITE.ogDescription)
  const ogTitle = pathname === '/' ? homeDocumentTitle() : title
  const ogImage = options.ogImage ?? absoluteUrl(SITE.ogImagePath)

  setCanonical(canonical)
  setMeta('name', 'description', description)
  setMeta('property', 'og:title', ogTitle)
  setMeta('property', 'og:description', socialDescription)
  setMeta('property', 'og:url', canonical)
  setMeta('property', 'og:site_name', SITE.name)
  setMeta('property', 'og:type', 'website')
  setMeta('property', 'og:image', ogImage)
  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', ogTitle)
  setMeta('name', 'twitter:description', socialDescription)
  setMeta('name', 'twitter:image', ogImage)
  applyRobotsMeta(pathname, options.robots)
}

export function applyEventPageMeta(event: Event): void {
  const pathname = eventDetailPath(event)
  const title = eventDocumentTitle(event)
  const description = eventMetaDescription(event)
  const image = event.imageUrl?.trim()

  if (typeof document !== 'undefined') {
    document.title = title
  }

  applyMetaTags(title, pathname, {
    description,
    socialDescription: description,
    ogImage: image && image !== '#' ? image : absoluteUrl(SITE.ogImagePath),
  })
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

export function setPageTitle(title: string, pathname: string): void {
  if (typeof document !== 'undefined') {
    document.title = title
  }
  applyMetaTags(title, pathname)
}

export function applySiteMeta(pathname: string, search = ''): void {
  if (eventIdFromPathname(pathname)) return

  const title = getDocumentTitle(pathname, search)
  setPageTitle(title, pathname)
}

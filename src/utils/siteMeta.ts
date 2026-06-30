import { absoluteUrl, canonicalUrl, SITE } from '../config/site'

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

  if (pathname === '/browse' || pathname === '/experiment-browse-3') {
    if (params.get('view') === 'map') return formatDocumentTitle('Map')
    return formatDocumentTitle('Browse Events')
  }

  if (pathname === '/experiment-browse-map') return formatDocumentTitle('Map')

  if (pathname === '/share') return formatDocumentTitle('Share with Us')
  if (pathname === '/about') return formatDocumentTitle('About')

  if (pathname.startsWith('/admin')) return formatDocumentTitle('Admin')

  if (pathname === '/discovery') return formatDocumentTitle('Discovery')
  if (pathname === '/browse-v1') return formatDocumentTitle('Browse Events')
  if (pathname === '/experiment-browse') return formatDocumentTitle('Browse Events')
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

function applyMetaTags(title: string, pathname: string): void {
  const canonical = canonicalUrl(pathname)

  setCanonical(canonical)
  setMeta('name', 'description', SITE.description)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', SITE.ogDescription)
  setMeta('property', 'og:url', canonical)
  setMeta('property', 'og:site_name', SITE.name)
  setMeta('property', 'og:type', 'website')
  setMeta('property', 'og:image', absoluteUrl(SITE.ogImagePath))
  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', SITE.ogDescription)
  setMeta('name', 'twitter:image', absoluteUrl(SITE.ogImagePath))
}

export function setPageTitle(title: string, pathname: string): void {
  if (typeof document !== 'undefined') {
    document.title = title
  }
  applyMetaTags(title, pathname)
}

export function applySiteMeta(pathname: string, search = ''): void {
  const title = getDocumentTitle(pathname, search)
  setPageTitle(title, pathname)
}

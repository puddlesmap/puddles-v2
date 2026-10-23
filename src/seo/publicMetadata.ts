import type { Metadata } from 'next'
import { absoluteUrl, SITE } from '@/config/site'
import {
  cityDocumentTitle,
  cityMetaDescription,
  type LocalCitySlug,
} from '@/config/localRoutes'
import {
  getActiveSeasonalCollection,
  getSeasonalCollection,
  isSeasonalCollectionSlug,
} from '@/data/seasonalDiscovery'
import { formatDocumentTitle } from '@/utils/siteMeta'
import { publicCanonicalPath, publicDescription } from '@/seo/publicPaths'

function pageMetadata(pathname: string, title: string, description: string, imagePath?: string): Metadata {
  const canonical = absoluteUrl(publicCanonicalPath(pathname) === pathname ? pathname : publicCanonicalPath(pathname))
  const image = absoluteUrl(imagePath ?? SITE.ogImagePath)
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      siteName: SITE.siteName,
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export function browseMetadata(): Metadata {
  const pathname = '/browse'
  return pageMetadata(
    pathname,
    formatDocumentTitle('Browse Bay Area Activities'),
    publicDescription(pathname) ?? SITE.description,
  )
}

export function mapMetadata(): Metadata {
  const pathname = '/map'
  return pageMetadata(pathname, formatDocumentTitle('Map'), publicDescription(pathname) ?? SITE.description)
}

export function shareMetadata(): Metadata {
  const pathname = '/share'
  return pageMetadata(
    pathname,
    formatDocumentTitle('Share with Us'),
    publicDescription(pathname) ?? SITE.description,
  )
}

export function aboutMetadata(): Metadata {
  const pathname = '/about'
  return pageMetadata(pathname, formatDocumentTitle('About'), publicDescription(pathname) ?? SITE.description)
}

export function guidesMetadata(): Metadata {
  const pathname = '/guides'
  return pageMetadata(pathname, formatDocumentTitle('Guides'), publicDescription(pathname) ?? SITE.description)
}

export function savedMetadata(): Metadata {
  const pathname = '/saved'
  return {
    ...pageMetadata(pathname, formatDocumentTitle('Saved'), publicDescription(pathname) ?? SITE.description),
    robots: { index: false, follow: false },
  }
}

export function cityMetadata(slug: LocalCitySlug): Metadata {
  const pathname = `/${slug}`
  return pageMetadata(pathname, cityDocumentTitle(slug), cityMetaDescription(slug))
}

export function seasonalIndexMetadata(): Metadata {
  const active = getActiveSeasonalCollection()
  const description =
    active?.description ??
    'Seasonal picks for little ones near Palo Alto, Los Altos, Mountain View, and Sunnyvale.'
  return pageMetadata(
    '/seasonal',
    formatDocumentTitle(active?.title ?? 'Seasonal Picks'),
    description,
    active?.illustrationSrc,
  )
}

export function seasonalSlugMetadata(slug: string): Metadata {
  if (!isSeasonalCollectionSlug(slug)) {
    return { title: formatDocumentTitle('Seasonal Picks'), robots: { index: false, follow: false } }
  }
  const collection = getSeasonalCollection(slug)
  const pathname = `/seasonal/${slug}`
  return pageMetadata(
    pathname,
    formatDocumentTitle(collection?.title ?? 'Seasonal Picks'),
    collection?.description ?? SITE.description,
    collection?.illustrationSrc,
  )
}

/** Old collection URLs stay reachable. The public canonical is /seasonal/:slug. */
export function experimentSeasonalMetadata(slug: string): Metadata {
  if (!isSeasonalCollectionSlug(slug)) {
    return { robots: { index: false, follow: false } }
  }
  const meta = seasonalSlugMetadata(slug)
  return { ...meta, robots: { index: false, follow: true } }
}

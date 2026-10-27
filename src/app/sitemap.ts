import type { MetadataRoute } from 'next'
import { getPublicEventsFromCatalog } from '@/data/events'
import { SITE } from '@/config/site'
import { eventDetailPath } from '@/utils/eventPages'
import syncMeta from '@/data/sync-meta.json'

const STATIC_PATHS = [
  '/',
  '/browse',
  '/map',
  '/share',
  '/about',
  '/guides',
  '/guides/halloween-with-little-ones',
  '/seasonal',
  '/seasonal/hello-fall',
  '/seasonal/halloween-with-little-ones',
  '/seasonal/holiday-magic',
  '/palo-alto',
  '/los-altos',
  '/mountain-view',
  '/sunnyvale',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(syncMeta.syncedAt)
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: path === '/' ? SITE.url : `${SITE.url}${path}`,
    lastModified,
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : 0.8,
  }))

  const eventEntries: MetadataRoute.Sitemap = getPublicEventsFromCatalog().map((event) => ({
    url: `${SITE.url}${eventDetailPath(event)}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticEntries, ...eventEntries]
}

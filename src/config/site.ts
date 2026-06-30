export const SITE = {
  url: 'https://puddlesmap.com',
  name: 'Puddles',
  siteTitle: 'Puddles · The Tot Map',
  titleTemplate: '%s · Puddles',
  description:
    'Find storytimes, music, drop-ins, and local family moments for ages 0–5 in the Bay Area. Starting in Palo Alto, Los Altos, and Mountain View.',
  ogDescription:
    'Find storytimes, music, drop-ins, and local family moments for ages 0–5 in the Bay Area.',
  ogImagePath: '/og-image.png',
  themeColor: '#FFFFFF',
} as const

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE.url}${normalized}`
}

export function canonicalUrl(pathname: string): string {
  if (pathname === '/') return SITE.url
  return absoluteUrl(pathname)
}

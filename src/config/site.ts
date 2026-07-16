export const SITE = {
  url: 'https://puddlesmap.com',
  name: 'Puddles',
  siteName: 'Puddles the tot map',
  siteTitle: 'Puddles the tot map | Bay Area Activities for Ages 0–5',
  titleTemplate: '%s · Puddles',
  description:
    'Find storytimes, music, drop-ins, library events, community programs, and local family activities for ages 0–5 in the Bay Area. Starting in Palo Alto, Los Altos, and Mountain View.',
  ogDescription:
    'Find storytimes, music, drop-ins, library events, community programs, and local family activities for ages 0–5 in the Bay Area.',
  ogImagePath: '/og-image.png',
  themeColor: '#FFFFFF',
  social: {
    instagram: 'https://www.instagram.com/puddlesmap/',
    facebook: 'https://www.facebook.com/profile.php?id=61591864649613',
  },
} as const

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE.url}${normalized}`
}

export function canonicalUrl(pathname: string): string {
  if (pathname === '/') return SITE.url
  return absoluteUrl(pathname)
}

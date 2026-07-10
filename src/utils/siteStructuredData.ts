import { SITE } from '../config/site'

export const websiteStructuredDataId = 'puddles-website-jsonld'

export const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE.siteName,
  alternateName: ['Puddles', 'puddlesmap.com'],
  url: `${SITE.url}/`,
} as const

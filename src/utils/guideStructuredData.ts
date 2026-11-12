import { absoluteUrl, SITE } from '../config/site'

export function buildGuideArticleJsonLd({
  headline,
  description,
  path,
  image,
  datePublished,
  dateModified,
}: {
  headline: string
  description: string
  path: string
  image: string
  datePublished: string
  dateModified?: string
}): Record<string, unknown> {
  const url = absoluteUrl(path)
  const imageUrl = image.startsWith('http') ? image : absoluteUrl(image)

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    image: [imageUrl],
    datePublished,
    dateModified: dateModified ?? datePublished,
    author: {
      '@type': 'Organization',
      name: SITE.siteName,
      url: `${SITE.url}/`,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.siteName,
      url: `${SITE.url}/`,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/brand/puddles-p-mark.png'),
      },
    },
  }
}

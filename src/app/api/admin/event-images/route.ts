import { isIP } from 'node:net'
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import {
  ADMIN_SESSION_COOKIE,
  isAdminAuthEnabled,
  parseCookies,
  verifySessionToken,
} from '../../../../../netlify/lib/admin-session.mjs'
import { saveAsset } from '../../../../../netlify/lib/social-studio-store.mjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_PAGE_BYTES = 1_500_000
const MAX_UPLOAD_BYTES = 8_000_000
const MAX_RESULTS = 3

type ImageCandidate = {
  imageUrl: string
  sourceUrl: string
  sourceLabel: string
  sourceType: 'official_event' | 'official_social'
  altText: string
  reason: string
  score: number
}

function adminOk(request: NextRequest): boolean {
  if (!isAdminAuthEnabled()) return true
  const cookies = parseCookies(request.headers.get('cookie') || '')
  return verifySessionToken(cookies[ADMIN_SESSION_COOKIE] ?? '')
}

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '')
  if (host === 'localhost' || host.endsWith('.local')) return true
  if (isIP(host)) {
    if (host.includes(':')) return true
    const [a, b] = host.split('.').map(Number)
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    )
  }
  return false
}

function safeHttpUrl(value: string, base?: string): URL | null {
  try {
    const url = new URL(value, base)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    if (url.username || url.password || isPrivateHostname(url.hostname)) return null
    return url
  } catch {
    return null
  }
}

function attr(tag: string, name: string): string {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))
  return (match?.[1] || match?.[2] || match?.[3] || '').replaceAll('&amp;', '&').trim()
}

function sourceType(url: URL): ImageCandidate['sourceType'] {
  return /(^|\.)((instagram|facebook|fb|tiktok)\.com)$/i.test(url.hostname)
    ? 'official_social'
    : 'official_event'
}

function sourceLabel(url: URL): string {
  const social = sourceType(url) === 'official_social'
  return social ? `Official social · ${url.hostname}` : `Official page · ${url.hostname}`
}

async function fetchOfficialHtml(input: string): Promise<{ html: string; url: URL }> {
  let url = safeHttpUrl(input)
  if (!url) throw new Error('Use a public http(s) official source URL.')

  for (let redirects = 0; redirects <= 3; redirects += 1) {
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(8_000),
      headers: { 'User-Agent': 'Puddles image review/1.0' },
    })
    if (response.status >= 300 && response.status < 400) {
      const next = safeHttpUrl(response.headers.get('location') || '', url.href)
      if (!next) throw new Error('Official source redirected to an unsupported URL.')
      url = next
      continue
    }
    if (!response.ok) throw new Error(`Official source returned ${response.status}.`)
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) throw new Error('Official source did not return a web page.')
    const length = Number(response.headers.get('content-length') || 0)
    if (length > MAX_PAGE_BYTES) throw new Error('Official source page is too large to inspect.')
    return { html: (await response.text()).slice(0, MAX_PAGE_BYTES), url }
  }
  throw new Error('Official source redirected too many times.')
}

function collectJsonImages(value: unknown, found: Array<{ url: string; alt: string }>) {
  if (Array.isArray(value)) {
    for (const item of value) collectJsonImages(item, found)
    return
  }
  if (!value || typeof value !== 'object') return
  const record = value as Record<string, unknown>
  const image = record.image
  if (typeof image === 'string') found.push({ url: image, alt: String(record.name || '') })
  else if (Array.isArray(image)) collectJsonImages(image, found)
  else if (image && typeof image === 'object') {
    const imageRecord = image as Record<string, unknown>
    const url = imageRecord.url || imageRecord.contentUrl
    if (typeof url === 'string') found.push({ url, alt: String(record.name || '') })
  }
  for (const child of Object.values(record)) {
    if (child && typeof child === 'object' && child !== image) collectJsonImages(child, found)
  }
}

function extractCandidates(html: string, pageUrl: URL): ImageCandidate[] {
  const candidates: ImageCandidate[] = []
  const seen = new Set<string>()

  function add(rawUrl: string, altText: string, reason: string, score: number) {
    const url = safeHttpUrl(rawUrl, pageUrl.href)
    if (!url || seen.has(url.href)) return
    const decodedUrl = decodeURIComponent(url.href)
    if (
      /[{}<>]/.test(decodedUrl) ||
      /\.(?:svg|gif)(?:$|[?#])/i.test(url.href) ||
      /(loading|spinner|placeholder|monogram|transparent-pixel)/i.test(decodedUrl)
    ) return
    const pageSection = pageUrl.pathname.split('/').filter(Boolean)[0] || ''
    const imageSection = url.pathname.match(/^\/([^/]+)\/wp-content\//)?.[1] || ''
    if (
      url.hostname === pageUrl.hostname &&
      pageSection &&
      imageSection &&
      imageSection !== pageSection
    ) return
    if (
      score < 90 &&
      (
        /(favicon|sprite|tracking|pixel|spacer|avatar|logo|lockup|brand|streak|divider|pattern|(?:^|[-_/])icons?(?:[-_.?/]|$))/i.test(url.href) ||
        /facebook\.com\/tr|google-analytics|doubleclick|\/collect\?/i.test(url.href)
      )
    ) return
    seen.add(url.href)
    candidates.push({
      imageUrl: url.href,
      sourceUrl: pageUrl.href,
      sourceLabel: sourceLabel(pageUrl),
      sourceType: sourceType(pageUrl),
      altText: altText.trim(),
      reason,
      score,
    })
  }

  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const key = (attr(tag, 'property') || attr(tag, 'name')).toLowerCase()
    const content = attr(tag, 'content')
    if (['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src'].includes(key)) {
      add(content, '', key.startsWith('og:') ? 'Official page featured image' : 'Official page social image', 100)
    }
  }

  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    if (attr(tag, 'rel').toLowerCase() === 'image_src') {
      add(attr(tag, 'href'), '', 'Official page featured image', 95)
    }
  }

  for (const script of html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || []) {
    const raw = script.replace(/^<script\b[^>]*>/i, '').replace(/<\/script>$/i, '')
    try {
      const found: Array<{ url: string; alt: string }> = []
      collectJsonImages(JSON.parse(raw), found)
      for (const item of found) add(item.url, item.alt, 'Official event structured data', 90)
    } catch {
      // Invalid JSON-LD should not prevent the rest of the page from being inspected.
    }
  }

  for (const tag of html.match(/<img\b[^>]*>/gi) || []) {
    const srcset = attr(tag, 'srcset').split(',').at(-1)?.trim().split(/\s+/)[0] || ''
    const src = attr(tag, 'data-src') || attr(tag, 'data-lazy-src') || srcset || attr(tag, 'src')
    const width = Number(attr(tag, 'width') || 0)
    const height = Number(attr(tag, 'height') || 0)
    const altText = attr(tag, 'alt')
    let score = 40
    if (width >= 600 || height >= 600) score += 15
    if (/\b(event|family|festival|children|kids|art|music|farm|pumpkin)\b/i.test(altText)) score += 10
    if (/\b(logo|icon|headshot|sponsor)\b/i.test(altText)) score -= 25
    add(src, altText, altText ? `Official page image · “${altText}”` : 'Image on official page', score)
  }

  return candidates.sort((a, b) => b.score - a.score).slice(0, MAX_RESULTS)
}

async function search(request: NextRequest) {
  const body = (await request.json()) as { sourceUrls?: unknown }
  const urls = Array.isArray(body.sourceUrls)
    ? [...new Set(body.sourceUrls.map(String).map((url) => url.trim()).filter(Boolean))].slice(0, 2)
    : []
  if (urls.length === 0) {
    return NextResponse.json({ ok: false, error: 'Add an official event, organizer or social URL.' }, { status: 400 })
  }

  const candidates: ImageCandidate[] = []
  const errors: string[] = []
  for (const url of urls) {
    try {
      const page = await fetchOfficialHtml(url)
      candidates.push(...extractCandidates(page.html, page.url))
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Could not inspect an official source.')
    }
  }
  const deduped = [...new Map(candidates.map((candidate) => [candidate.imageUrl, candidate])).values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)

  return NextResponse.json({ ok: true, candidates: deduped, errors })
}

async function upload(request: NextRequest) {
  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'Choose an image file.' }, { status: 400 })
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return NextResponse.json({ ok: false, error: 'Use a JPEG, PNG or WebP image.' }, { status: 400 })
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ ok: false, error: 'Image must be smaller than 8 MB.' }, { status: 400 })
  }
  const png = await sharp(Buffer.from(await file.arrayBuffer()))
    .rotate()
    .resize({ width: 1600, height: 2000, fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer()
  const asset = await saveAsset(png, 'png')
  return NextResponse.json({
    ok: true,
    imageUrl: `/api/social-studio/media?token=${asset.token}`,
    sourceLabel: `Manual upload · ${file.name}`,
  })
}

export async function POST(request: NextRequest) {
  if (!adminOk(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    return request.headers.get('content-type')?.includes('multipart/form-data')
      ? await upload(request)
      : await search(request)
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Image review failed.' },
      { status: 500 },
    )
  }
}

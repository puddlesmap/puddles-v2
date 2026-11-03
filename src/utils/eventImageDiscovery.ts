/**
 * Relevance filters for Admin official-page image recommendations.
 * Prefer no recommendation over an irrelevant logo, social icon, or chrome graphic.
 */

export type EventImageDiscoveryContext = {
  title?: string
  description?: string
  venue?: string
  types?: string[]
}

export type ScoredImageCandidate = {
  imageUrl: string
  altText: string
  reason: string
  score: number
}

/** Absolute reject: social icons, logos, UI chrome, trackers, tiny assets. */
const IRRELEVANT_URL_RE =
  /(favicon|sprite|logo|icon|avatar|pixel|placeholder|spinner|transparent|all-white|wordmark|lockup|brand|badge|social[-_]?share|share[-_]?(?:btn|button|icon)|facebook|instagram|linkedin|twitter|tiktok|youtube|pinterest|whatsapp|threads\.net|mastodon|btn[-_]|button[-_]|nav[-_]|menu[-_]|header[-_]?logo|site[-_]?logo|org[-_]?logo|word[-_]?mark|monogram|emoji|tracking|analytics|doubleclick|ads?[-_/]|banner[-_]?ad|promo[-_]?banner|sponsor|seal|crest|watermark|(?:^|[-_/])mark(?:[-_.?]|$)|fga-mark)/i

const IRRELEVANT_ALT_RE =
  /\b(logo|icon|favicon|avatar|sponsor|badge|share|follow us|facebook|instagram|linkedin|twitter|tiktok|youtube|pinterest|social)\b/i

const SOCIAL_OR_CDN_HOST_RE =
  /(^|\.)(facebook\.com|fbcdn\.net|instagram\.com|cdninstagram\.com|linkedin\.com|licdn\.com|twimg\.com|twitter\.com|tiktok\.com|tiktokcdn\.com|ytimg\.com|youtube\.com|pinterest\.com|pinimg\.com|whatsapp\.com)($|\/)/i

const THEME_CHROME_PATH_RE =
  /\/(wp-content\/themes|wp-includes|assets\/(?:icons?|ui|svg)|static\/(?:icons?|ui)|images\/(?:icons?|social|share))\//i

const RELEVANT_ALT_RE =
  /\b(event|family|festival|children|kids|toddler|preschool|art|music|farm|pumpkin|halloween|storytime|craft|parade|garden|museum|workshop|class|outdoor|play)\b/i

const MIN_ACCEPT_SCORE = 55
const MAX_RESULTS = 3

function tokenize(text: string): string[] {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 4)
}

function uniqueTokens(parts: Array<string | undefined>): string[] {
  return [...new Set(parts.flatMap((part) => tokenize(part || '')))]
}

export function isIrrelevantEventImageUrl(imageUrl: string): boolean {
  const url = String(imageUrl || '').trim()
  if (!url || !/^https?:\/\//i.test(url)) return true
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return true
  }
  const decoded = decodeURIComponent(parsed.href)
  if (/[{}<>]/.test(decoded)) return true
  if (/\.(?:svg|gif|ico)(?:$|[?#])/i.test(parsed.pathname)) return true
  if (SOCIAL_OR_CDN_HOST_RE.test(parsed.hostname + parsed.pathname)) return true
  if (IRRELEVANT_URL_RE.test(decoded)) return true
  if (THEME_CHROME_PATH_RE.test(parsed.pathname)) return true

  const sized = parsed.pathname.match(/-(\d+)x(\d+)\.(?:jpe?g|png|webp)$/i)
  if (sized && (Number(sized[1]) < 240 || Number(sized[2]) < 180)) return true

  return false
}

export function scoreOfficialImageCandidate(input: {
  imageUrl: string
  altText?: string
  reason?: string
  baseScore?: number
  width?: number
  height?: number
  context?: EventImageDiscoveryContext
}): ScoredImageCandidate | null {
  const imageUrl = String(input.imageUrl || '').trim()
  if (isIrrelevantEventImageUrl(imageUrl)) return null

  const altText = String(input.altText || '').trim()
  if (IRRELEVANT_ALT_RE.test(altText)) return null

  let score = Number.isFinite(input.baseScore) ? Number(input.baseScore) : 40
  const width = Number(input.width || 0)
  const height = Number(input.height || 0)
  if (width >= 600 || height >= 600) score += 15
  if (width > 0 && width < 200) score -= 30
  if (height > 0 && height < 150) score -= 30

  if (RELEVANT_ALT_RE.test(altText)) score += 12

  const haystack = `${imageUrl} ${altText} ${input.reason || ''}`.toLowerCase()
  const contextTokens = uniqueTokens([
    input.context?.title,
    input.context?.venue,
    input.context?.description,
    ...(input.context?.types || []),
  ])
  let tokenHits = 0
  for (const token of contextTokens) {
    if (haystack.includes(token)) tokenHits += 1
  }
  if (tokenHits > 0) score += Math.min(24, tokenHits * 8)
  else if (input.context?.title?.trim()) {
    // Featured image without any event/title signal is often site chrome or an unrelated program.
    score -= 18
  }

  // Prefer real photos over graphics / PNGs that often carry logos.
  if (/\.(?:jpe?g|webp)(?:$|[?#])/i.test(imageUrl)) score += 6
  if (/\.png(?:$|[?#])/i.test(imageUrl) && !tokenHits) score -= 8

  if (score < MIN_ACCEPT_SCORE) return null

  const reason =
    input.reason?.trim() ||
    (altText ? `Official page image · “${altText}”` : 'Photo on the official page')

  return {
    imageUrl,
    altText,
    reason,
    score,
  }
}

export function rankOfficialImageCandidates(
  candidates: ScoredImageCandidate[],
  max = MAX_RESULTS,
): ScoredImageCandidate[] {
  const seen = new Set<string>()
  const ranked: ScoredImageCandidate[] = []
  for (const candidate of [...candidates].sort((a, b) => b.score - a.score)) {
    const key = candidate.imageUrl.replace(/-\d+x\d+(?=\.(?:jpe?g|png|webp))/i, '').split('?')[0]
    if (seen.has(key)) continue
    seen.add(key)
    ranked.push(candidate)
    if (ranked.length >= max) break
  }
  return ranked
}

export function discoveryImageCacheKey(
  sourceUrl: string,
  context: EventImageDiscoveryContext = {},
): string {
  return [
    sourceUrl.trim(),
    context.title?.trim() || '',
    context.venue?.trim() || '',
    (context.types || []).join(','),
  ].join('|')
}

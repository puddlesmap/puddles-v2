export type TipIconKind =
  | 'ticket'
  | 'baby'
  | 'stroller'
  | 'accessibility'
  | 'restroom'
  | 'food'
  | 'weather'
  | 'crowds'
  | 'sound'
  | 'info'

export const TIP_ICON_PREFIXES: TipIconKind[] = [
  'ticket',
  'baby',
  'stroller',
  'accessibility',
  'restroom',
  'food',
  'weather',
  'crowds',
  'sound',
  'info',
]

export type EventTipLine = {
  icon: TipIconKind
  text: string
}

const LEGACY_TIP_PREFIX: Record<string, TipIconKind> = {
  access: 'accessibility',
  bath: 'restroom',
  sun: 'weather',
  music: 'sound',
}

const TIP_PREFIX_TOKENS = [...TIP_ICON_PREFIXES, ...Object.keys(LEGACY_TIP_PREFIX)]

const TIP_PREFIX_SPLIT_RE = new RegExp(
  `(?=\\b(?:${TIP_PREFIX_TOKENS.join('|')})\\|)`,
  'gi',
)

function resolveTipIcon(rawPrefix: string): TipIconKind {
  const key = rawPrefix.trim().toLowerCase()
  if (LEGACY_TIP_PREFIX[key]) return LEGACY_TIP_PREFIX[key]
  if (TIP_ICON_PREFIXES.includes(key as TipIconKind)) return key as TipIconKind
  return 'info'
}

function splitPrefixedTipSegments(line: string): string[] {
  const trimmed = line.trim()
  if (!trimmed) return []
  const matches = [...trimmed.matchAll(TIP_PREFIX_SPLIT_RE)]
  if (matches.length === 0) return [trimmed]
  const segments: string[] = []
  for (let index = 0; index < matches.length; index += 1) {
    const start = matches[index].index ?? 0
    const end =
      index + 1 < matches.length ? (matches[index + 1].index ?? trimmed.length) : trimmed.length
    segments.push(trimmed.slice(start, end).trim())
  }
  return segments.filter(Boolean)
}

/** Parse one Good to know line (with optional icon prefix). */
export function parseEventTipLine(line: string): EventTipLine {
  const trimmed = line.trim()
  const pipe = trimmed.match(/^([a-z]+)\|([\s\S]*)$/i)
  if (pipe) {
    return {
      icon: resolveTipIcon(pipe[1]),
      text: pipe[2].trim(),
    }
  }
  return { icon: 'info', text: trimmed }
}

/** Split sheet Tips into display bullets — one per non-empty line, with optional icons. */
export function parseEventTips(tips?: string | null): EventTipLine[] {
  if (!tips?.trim()) return []
  const items: EventTipLine[] = []
  for (const rawLine of tips.split(/\r?\n/)) {
    for (const segment of splitPrefixedTipSegments(rawLine)) {
      const parsed = parseEventTipLine(segment)
      if (parsed.text.trim()) items.push(parsed)
    }
  }
  return items
}

export function hasEventTips(tips?: string | null): boolean {
  return parseEventTips(tips).length > 0
}

/** Practical / parent-prep sentences → Good to know (tips). */
export const TIP_SENTENCE_RE =
  /\b(bring (a |your )?(small )?blanket|lawn\s*chairs?|yoga\s*mats?|meditation cushions?|regist(?:er|ration)|sign[\s-]?up|rsvp|tickets?|weather dependent|inclement weather|weather permitting|no performances during|events? are weather|rain or shine|cancelled due to weather|canceled due to weather|indoors? or outdoors?|indoor\/outdoor|accompanied by an? adult|must be accompanied|first[\s-]come|space is limited|no registration|walk[\s-]?ins|pre[\s-]?register|costumes?(?: and accessories)? encouraged|legos? will stay|children under \d+|recommended age)\b/i

const TIP_EXCLUDE_RE =
  /\b(imagination|steam|early childhood development|problem solving|self-confidence|oceans of possibilities|earn badges)\b/i

export function splitSentences(text: string): string[] {
  return String(text ?? '')
    .replace(/\*+/g, '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12)
}

function normalizeTip(raw: string): string {
  const tip = String(raw ?? '')
    .replace(/\*+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.$/, '')
  if (tip.length < 8) return ''
  return /[.!?]$/.test(tip) ? tip : `${tip}.`
}

/** Pull weather/prep lines out of description into Good to know tips. */
export function extractTipsFromText(
  plainDescription: string,
  existingTips: string | string[] = '',
): string {
  const tips: string[] = []
  const seen = new Set<string>()

  function addTip(raw: string) {
    const tip = normalizeTip(raw)
    if (!tip) return
    const key = tip.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    tips.push(tip)
  }

  const existing = Array.isArray(existingTips)
    ? existingTips
    : existingTips.split('\n').filter(Boolean)
  for (const raw of existing) addTip(raw)

  for (const sentence of splitSentences(plainDescription)) {
    if (TIP_EXCLUDE_RE.test(sentence)) continue
    if (TIP_SENTENCE_RE.test(sentence)) addTip(sentence.slice(0, 280))
  }

  return tips.join('\n')
}

/** Remove tip sentences from description after they were extracted. */
export function descriptionWithoutTips(plainDescription: string, tipsText: string): string {
  if (!tipsText) return plainDescription
  const tipKeys = tipsText
    .split('\n')
    .map((t) => t.toLowerCase().replace(/\.$/, '').slice(0, 40))
  const kept = splitSentences(plainDescription).filter((sentence) => {
    const key = sentence.toLowerCase().slice(0, 40)
    return !tipKeys.some((tip) => key.includes(tip.slice(0, 30)) || tip.includes(key.slice(0, 30)))
  })
  return kept.length ? kept.join(' ') : plainDescription
}

/**
 * Library ops / accessibility form boilerplate (e.g. SCCLD ASL form + phone/email).
 * Discard entirely — not parent-prep tips.
 */
export const LOGISTICS_SENTENCE_RE =
  /\b(accessibility accommodations|sccld\.org\/accessibility|ask@lib\.sccgov\.org|need assistance with the form|speak with a staff member at your local library)\b/i

/** Trailing truncated accessibility block (often cut mid-sentence in feeds). */
const TRAILING_ACCESSIBILITY_BLOCK_RE =
  /\s*For accessibility accommodations[\s\S]*$/i

export function stripLogisticsFromDescription(text: string): string {
  const plain = String(text ?? '')
  if (!plain.trim()) return plain

  const withoutTrailing = plain.replace(TRAILING_ACCESSIBILITY_BLOCK_RE, '').trim()
  const source = withoutTrailing || plain
  const kept = splitSentences(source).filter((sentence) => !LOGISTICS_SENTENCE_RE.test(sentence))

  if (kept.length === 0) {
    if (LOGISTICS_SENTENCE_RE.test(plain) || TRAILING_ACCESSIBILITY_BLOCK_RE.test(plain)) {
      return withoutTrailing
    }
    return plain
  }

  return kept
    .join(' ')
    .replace(TRAILING_ACCESSIBILITY_BLOCK_RE, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Split sheet Tips into display bullets — one per non-empty line. */
export function parseEventTips(tips?: string | null): string[] {
  if (!tips?.trim()) return []
  return tips
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function hasEventTips(tips?: string | null): boolean {
  return parseEventTips(tips).length > 0
}

/** Practical / parent-prep sentences → Good to know (tips). */
export const TIP_SENTENCE_RE =
  /\b(bring (a |your )?(small )?blanket|lawn\s*chairs?|yoga\s*mats?|meditation cushions?|regist(?:er|ration)|sign[\s-]?up|rsvp|tickets?|weather dependent|inclement weather|weather permitting|no performances during|events? are weather|rain or shine|cancelled due to weather|canceled due to weather|indoors? or outdoors?|indoor\/outdoor|accompanied by|caregivers?|first[\s-]come|space is limited|no registration|walk[\s-]?ins|pre[\s-]?register|costumes?(?: and accessories)? encouraged|legos? will stay|must be accompanied|children under \d+|recommended age)\b/i

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

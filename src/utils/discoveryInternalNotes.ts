/** Admin-only review / editorial lines — never parent-facing Good to know. */

const LEAD_NOTE_LINE_RE = /^Lead note:\s*/i

/** Strong signals: line is internal, not for parents. */
const INTERNAL_REVIEW_LINE_RES: RegExp[] = [
  LEAD_NOTE_LINE_RE,
  /^editorial:\s*/i,
  /^admin:\s*/i,
  /\bverify\b.*\bbefore publish\b/i,
  /\bbefore publish\b/i,
  /\bconfirm\b.*\bbefore publish\b/i,
  /\bone puddles row per program\b/i,
  /\blink each series to\b/i,
  /\bdo not list open seats\b/i,
  /\bopen seats in public copy\b/i,
  /\bverify ticket pricing\b/i,
  /\bverify (?:time|hours|whether|holiday)\b/i,
  /\bverify .* on (?:the )?official\b/i,
  /^verify time\b/i,
  /\bkeep in (?:admin|seasonal|hidden)\b/i,
  /\bdo not go live\b/i,
  /\bqueued for\b/i,
  /\breview needed\b/i,
  /^lower priority:/i,
  /\boverlap puddles\b/i,
  /\bpuddles row per\b/i,
  /\bnot (?:for|on) (?:the )?public\b/i,
  /\binternal (?:note|only)\b/i,
]

/** Softer signals: flag in Admin if still in parent tips — do not auto-strip unless combined with editorial shape. */
const INTERNAL_LANGUAGE_FLAG_RES: RegExp[] = [
  /\bverify\b/i,
  /\bbefore publish\b/i,
  /\bqueued\b/i,
  /\breview needed\b/i,
  /\bone row per program\b/i,
  /\bopen seats\b/i,
  /\bfact-check in chat\b/i,
]

export function isLeadNoteLine(line: string): boolean {
  return LEAD_NOTE_LINE_RE.test(line.trim())
}

export function isInternalReviewNoteLine(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false
  return INTERNAL_REVIEW_LINE_RES.some((re) => re.test(trimmed))
}

/** Parent-facing Good to know warnings (line still shown until editor moves it). */
export function flagInternalLanguageInParentTip(line: string): string | null {
  const trimmed = line.trim()
  if (!trimmed || isInternalReviewNoteLine(trimmed)) return null
  if (!INTERNAL_LANGUAGE_FLAG_RES.some((re) => re.test(trimmed))) return null
  return 'This line sounds like an internal review note — move it to Internal notes if parents should not see it.'
}

export type SplitTipsResult = {
  parentTips: string
  /** Admin-only lines (newline-separated in forms). */
  internalNotes: string[]
}

function parseNoteBlock(text?: string | null): string[] {
  if (!text?.trim()) return []
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

/** Classify tips + optional stored internal block for Admin editing. */
export function splitTipsForAdmin(
  tips?: string | null,
  storedInternalReviewNotes?: string | null,
): SplitTipsResult {
  const internalNotes: string[] = []
  const parentLines: string[] = []
  const seenInternal = new Set<string>()

  function pushInternal(line: string) {
    const normalized = line.replace(LEAD_NOTE_LINE_RE, '').trim() || line.trim()
    const key = normalized.toLowerCase()
    if (!key || seenInternal.has(key)) return
    seenInternal.add(key)
    internalNotes.push(normalized)
  }

  for (const line of parseNoteBlock(storedInternalReviewNotes)) {
    pushInternal(line)
  }

  for (const line of parseNoteBlock(tips)) {
    if (isInternalReviewNoteLine(line)) {
      pushInternal(line)
    } else {
      parentLines.push(line)
    }
  }

  return {
    parentTips: parentLines.join('\n'),
    internalNotes,
  }
}

/** Split parent-facing tips from ingest/agent "Lead note:" lines. @deprecated use splitTipsForAdmin */
export function splitLeadNotesFromTips(tips?: string | null): {
  parentTips: string
  internalLines: string[]
} {
  const { parentTips, internalNotes } = splitTipsForAdmin(tips)
  return { parentTips, internalLines: internalNotes }
}

/** Tips safe to store on public events (parent-facing only). */
export function stripInternalNotesForPublish(tips?: string | null): string {
  return splitTipsForAdmin(tips).parentTips
}

/** @deprecated alias */
export function stripLeadNotesForPublish(tips?: string | null): string {
  return stripInternalNotesForPublish(tips)
}

export function joinInternalReviewNotes(lines: string[]): string {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
}

export function parentTipWarnings(parentTips: string): string[] {
  const warnings: string[] = []
  for (const line of parseNoteBlock(parentTips)) {
    const flag = flagInternalLanguageInParentTip(line)
    if (flag) warnings.push(flag)
  }
  return [...new Set(warnings)]
}

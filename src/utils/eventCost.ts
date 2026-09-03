import type { CostLabel } from '../types/event'

/**
 * Short label for card / image pills. Detail pages keep the full authored cost
 * (e.g. "Paid · First class free" → badge "Paid", detail keeps the full string).
 */
export function formatCostBadgeLabel(cost: string): string {
  const trimmed = String(cost ?? '').replace(/\s+/g, ' ').trim()
  if (!trimmed) return trimmed
  if (/^paid\b/i.test(trimmed) && /first class free/i.test(trimmed)) return 'Paid'
  return trimmed
}

export function parseCost(raw: string): CostLabel {
  const original = String(raw ?? '').trim()
  const value = original.toLowerCase()
  if (!value) return 'Free'

  // Prefer a concrete price over labels like Low-cost / Free when both appear.
  const amountMatch = original.match(/\$?\s*(\d+(?:\.\d+)?)/)
  if (amountMatch && /\$/.test(original)) {
    const n = Number(amountMatch[1])
    if (Number.isFinite(n) && n > 0) {
      const rounded = Number.isInteger(n) ? String(Math.trunc(n)) : String(n)
      return `$${rounded}`
    }
  }

  if (/\bpaid\b/.test(value)) {
    // Keep authored labels like "Paid · First class free" for detail pages.
    const preserved = original.replace(/\s+/g, ' ').trim()
    if (/first class free/i.test(preserved) || /·/.test(preserved)) {
      return preserved as CostLabel
    }
    return 'Paid'
  }
  if (/\blow(?:-|\s*)cost\b/.test(value) || value.includes('low-cost') || value === 'low') {
    return 'Low-cost'
  }
  if (/\bfree\b/.test(value) || value === '0' || value === '$0') return 'Free'

  if (amountMatch) {
    const n = Number(amountMatch[1])
    if (!Number.isFinite(n) || n <= 0) return 'Free'
    const rounded = Number.isInteger(n) ? String(Math.trunc(n)) : String(n)
    return `$${rounded}`
  }

  return 'Free'
}

/** Pull a sticker price like $10 from description/tips. */
export function extractDollarCostFromText(text: string): string | null {
  const hay = String(text ?? '')
  if (!hay.trim()) return null

  const contextual =
    hay.match(
      /\b(?:join(?:\s+at\s+the\s+door)?|admission|entry|tickets?|fee|cost|price|members?(?:\s+only)?)\b[^$\n]{0,48}\$\s*(\d+(?:\.\d+)?)/i,
    ) ||
    hay.match(
      /\$\s*(\d+(?:\.\d+)?)[^.\n]{0,40}\b(?:at\s+the\s+door|admission|entry|to\s+join|fee)\b/i,
    )
  if (contextual) {
    const n = Number(contextual[1])
    if (Number.isFinite(n) && n > 0) {
      return `$${Number.isInteger(n) ? Math.trunc(n) : n}`
    }
  }

  const bare = hay.match(/\$\s*(\d+(?:\.\d+)?)/)
  if (bare) {
    const n = Number(bare[1])
    if (Number.isFinite(n) && n > 0) {
      return `$${Number.isInteger(n) ? Math.trunc(n) : n}`
    }
  }
  return null
}

/**
 * Sheet Cost column, upgraded with a $ amount from copy when the sheet only
 * says Low-cost / Paid (or Free but copy names an entry fee).
 */
export function resolveEventCost(
  sheetRaw: string,
  description = '',
  tips = '',
): CostLabel {
  const fromSheet = parseCost(sheetRaw)
  if (/^\$\d/.test(fromSheet)) return fromSheet

  const fromText = extractDollarCostFromText([description, tips].filter(Boolean).join('\n'))
  if (!fromText) return fromSheet

  if (fromSheet === 'Low-cost' || fromSheet === 'Paid') return fromText

  if (fromSheet === 'Free') {
    const hay = [description, tips].filter(Boolean).join('\n')
    if (
      /\b(?:join(?:\s+at\s+the\s+door)?|admission|entry|ticket|fee|members?(?:\s+only)?)\b/i.test(
        hay,
      ) &&
      /\$\s*\d/.test(hay)
    ) {
      return fromText
    }
  }

  return fromSheet
}

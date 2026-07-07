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

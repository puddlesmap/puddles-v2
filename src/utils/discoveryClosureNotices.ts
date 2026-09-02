/** Holiday / closure calendar rows from libraries — not family outings. */
export function isLibraryClosureNotice(input: {
  title?: string
  description?: string
  tips?: string
}): boolean {
  const title = String(input.title ?? '').trim()
  const lowerTitle = title.toLowerCase()

  if (/^closed\b/i.test(title)) return true
  if (/\bclosed for\b/i.test(lowerTitle)) return true
  if (/\blibrary closed\b/i.test(lowerTitle)) return true
  if (/\bbranch library closed\b/i.test(lowerTitle)) return true

  const body = [input.description, input.tips].filter(Boolean).join(' ').toLowerCase()
  if (
    /\b(will be closed|locations will be closed|all sccld locations will be closed)\b/.test(body) &&
    !/\b(storytime|workshop|class|concert|festival|yoga)\b/.test(lowerTitle)
  ) {
    return true
  }

  return false
}

/** Holiday / closure calendar rows from libraries — not family outings. */
export function isLibraryClosureNotice(input: {
  title?: string
  description?: string
  tips?: string
  categoryTags?: string[]
}): boolean {
  const title = String(input.title ?? '').trim()
  const lowerTitle = title.toLowerCase()
  const tags = Array.isArray(input.categoryTags) ? input.categoryTags : []

  if (tags.some((tag) => /scheduled closure\/holiday/i.test(String(tag)))) return true

  if (/^closed\b/i.test(title)) return true
  if (/^early closure\b/i.test(title)) return true
  if (/\bclosed for\b/i.test(lowerTitle)) return true
  if (/\bclosing early\b/i.test(lowerTitle)) return true
  if (/\bcloses early\b/i.test(lowerTitle)) return true
  if (/\blibrary closed\b/i.test(lowerTitle)) return true
  if (/\bbranch library closed\b/i.test(lowerTitle)) return true
  if (/\blibrary closes at\b/i.test(lowerTitle)) return true
  if (/\bbranch library closes at\b/i.test(lowerTitle)) return true

  const body = [input.description, input.tips].filter(Boolean).join(' ').toLowerCase()
  if (
    /\b(will be closed|will close at|locations will be closed|all sccld locations will be closed|all sccld locations will close|closing early at|will be closing early)\b/.test(
      body,
    ) &&
    !/\b(storytime|workshop|class|concert|festival|yoga|board game|lego)\b/.test(lowerTitle)
  ) {
    return true
  }

  return false
}

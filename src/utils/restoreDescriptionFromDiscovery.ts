import catalog from '../data/discovery-candidates.json'

type DiscoveryCandidate = {
  id?: string
  title?: string
  date?: string
  venue?: string
  eventUrl?: string
  description?: string
}

let descriptionIndex: Map<string, string> | null = null

function buildDiscoveryDescriptionIndex(): Map<string, string> {
  const index = new Map<string, string>()
  const candidates = (catalog as { candidates?: DiscoveryCandidate[] }).candidates ?? []

  for (const candidate of candidates) {
    const description = candidate.description?.trim()
    if (!description || description.length < 20) continue

    if (candidate.id) index.set(`id:${candidate.id}`, description)

    const url = candidate.eventUrl?.trim()
    if (url && url !== '#') {
      const slug = url.replace(/\/$/, '').split('/').filter(Boolean).pop()?.toLowerCase()
      if (slug) index.set(`url:${slug}`, description)
    }

    if (candidate.title && candidate.date && candidate.venue) {
      const matchKey = `${candidate.title}|${candidate.date}|${candidate.venue}`.toLowerCase()
      index.set(`match:${matchKey}`, description)
    }
  }

  return index
}

function getDiscoveryDescriptionIndex(): Map<string, string> {
  if (!descriptionIndex) descriptionIndex = buildDiscoveryDescriptionIndex()
  return descriptionIndex
}

export function isTruncatedDescription(description: string): boolean {
  return /\.\.\.\s*$/.test(description.trim())
}

export function restoreDescriptionFromDiscovery(
  event: {
    id?: string
    title?: string
    date?: string
    venue?: string
    eventUrl?: string
  },
  description: string,
): string {
  if (!isTruncatedDescription(description)) return description

  const index = getDiscoveryDescriptionIndex()
  const candidates: string[] = []

  if (event.id) {
    const byId = index.get(`id:${event.id}`)
    if (byId) candidates.push(byId)
  }

  const url = event.eventUrl?.trim()
  if (url && url !== '#') {
    const slug = url.replace(/\/$/, '').split('/').filter(Boolean).pop()?.toLowerCase()
    if (slug) {
      const byUrl = index.get(`url:${slug}`)
      if (byUrl) candidates.push(byUrl)
    }
  }

  if (event.title && event.date && event.venue) {
    const byMatch = index.get(`match:${event.title}|${event.date}|${event.venue}`.toLowerCase())
    if (byMatch) candidates.push(byMatch)
  }

  const best = candidates
    .filter((candidate) => candidate.length > description.length && !isTruncatedDescription(candidate))
    .sort((a, b) => b.length - a.length)[0]

  return best ?? description
}

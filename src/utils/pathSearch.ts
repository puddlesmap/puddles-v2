/** Compare path + query without letting parameter order look like a new URL. */
export function toPathSearch(pathname: string, search: string): string {
  const raw = search.startsWith('?') ? search.slice(1) : search
  const params = new URLSearchParams(raw)
  const keys = [...new Set(params.keys())].sort()
  const sorted = new URLSearchParams()
  for (const key of keys) {
    for (const value of params.getAll(key).sort()) sorted.append(key, value)
  }
  const query = sorted.toString()
  return `${pathname}${query ? `?${query}` : ''}`
}

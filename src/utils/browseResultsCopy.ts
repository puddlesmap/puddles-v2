export function getBrowseResultsSummary(eventCount: number, city: string): string {
  const location = city === 'nearby' ? 'you' : city === 'all' ? 'all cities' : city
  const noun = eventCount === 1 ? 'event' : 'events'
  return `${eventCount} ${noun} near ${location}`
}

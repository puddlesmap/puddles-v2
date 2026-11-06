import type { Event } from '../types/event'
import { getEventModalAgeLabel } from './ageRange'
import { getEventAgeRecommendation } from './eventAgeRecommendation'
import {
  eventUsesSeasonalWhen,
  formatSeasonalDetailWhen,
  type SeasonalWhenRow,
} from './formatSeasonalSchedule'

/**
 * Single Ages line for event detail (mock / future prod).
 * Prefer organizer recommendation; else filter bucket label.
 */
export function getEventDetailAgeLabel(event: Event): string {
  const rec = getEventAgeRecommendation(event).label?.trim()
  if (rec) return rec
  return getEventModalAgeLabel(event.ageRange)
}

/**
 * Seasonal WHEN rows with schedule + Through on one line when both exist.
 * Status and italic notes stay on their own rows.
 */
export function formatSeasonalDetailWhenCompact(
  event: Event,
  now: Date = new Date(),
): SeasonalWhenRow[] {
  const { rows } = formatSeasonalDetailWhen(event, now)
  if (!eventUsesSeasonalWhen(event) || rows.length < 2) return rows

  const [status, ...rest] = rows
  const throughIndex = rest.findIndex((row) => row.text.startsWith('Through '))
  if (throughIndex < 0) return rows

  const beforeThrough = rest.slice(0, throughIndex).filter((row) => row.variant !== 'note')
  const notes = rest.slice(0, throughIndex).filter((row) => row.variant === 'note')
  const through = rest[throughIndex]
  const after = rest.slice(throughIndex + 1)

  const scheduleParts = beforeThrough.map((row) => row.text).filter(Boolean)
  const merged = [...scheduleParts, through.text].filter(Boolean).join(' · ')

  return [{ text: status.text }, ...(merged ? [{ text: merged }] : []), ...notes, ...after].filter(
    (row) => Boolean(row.text),
  )
}

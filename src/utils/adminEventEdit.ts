import type { AdminEventEditableFields } from '../types/adminEventEdit'
import type { ActivityType, City, Event } from '../types/event'
import { ACTIVITY_TYPES } from '../types/event'
import { applyEventCopyEnrichment } from './applyEventCopyEnrichment'
import { resolveAgeFromSheetAndText } from './discoveryAgeHints'
import { resolveEventCost } from './eventCost'
import { publishEventsToSite } from './publishEvents'
import { enrichPublishingFields } from './publishing'

function asCity(raw: string): City {
  const cities: City[] = ['Palo Alto', 'Los Altos', 'Mountain View']
  const hit = cities.find((city) => city.toLowerCase() === raw.trim().toLowerCase())
  return hit ?? ((raw.trim() || 'Palo Alto') as City)
}

function asActivityTypes(values: string[]): ActivityType[] {
  const matched = values
    .map((value) => ACTIVITY_TYPES.find((type) => type.toLowerCase() === value.toLowerCase()))
    .filter((value): value is ActivityType => Boolean(value))
  return matched.length > 0 ? matched : ['Other']
}

export function editableFieldsFromEvent(event: Event): AdminEventEditableFields {
  return {
    title: event.title,
    description: event.description,
    tips: event.tips ?? '',
    venue: event.venue,
    room: event.room ?? '',
    address: event.address,
    city: event.city,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    ageRange: event.ageRange,
    types: [...event.types],
    cost: event.cost,
    eventUrl: event.eventUrl,
    imageUrl: event.imageUrl,
    lastChecked: event.verifiedDate,
    status: event.status === 'Expired' ? 'Published' : event.status,
  }
}

export function mergeEditsIntoEvent(event: Event, edits: AdminEventEditableFields): Event {
  const inferredAge = resolveAgeFromSheetAndText(edits.description, edits.tips ?? '')
  const tips = edits.tips?.trim()

  const merged: Event = {
    ...event,
    title: edits.title.trim(),
    description: edits.description,
    venue: edits.venue.trim(),
    address: edits.address.trim(),
    city: asCity(edits.city),
    date: edits.date,
    startTime: edits.startTime,
    endTime: edits.endTime,
    ageRange: inferredAge?.ageRange ?? edits.ageRange,
    ageMin: inferredAge?.ageMin ?? event.ageMin,
    ageMax: inferredAge?.ageMax ?? event.ageMax,
    types: asActivityTypes(edits.types),
    cost: resolveEventCost(edits.cost, edits.description, tips ?? ''),
    eventUrl: edits.eventUrl.trim() || '#',
    imageUrl: edits.imageUrl.trim(),
    verifiedDate: edits.lastChecked.trim() || event.verifiedDate,
    status: edits.status,
  }

  if (tips) merged.tips = tips
  else delete merged.tips

  const room = edits.room.trim()
  if (room) merged.room = room
  else delete merged.room

  return merged
}

export function prepareEventForPublish(event: Event, edits: AdminEventEditableFields): Event {
  const merged = mergeEditsIntoEvent(event, edits)
  const enriched = applyEventCopyEnrichment({
    ...merged,
    sheetTypesRaw: merged.types.join(', '),
  })
  return enrichPublishingFields(enriched)
}

export async function saveAndPublishEvent(
  event: Event,
  edits: AdminEventEditableFields,
): Promise<{ message: string; event: Event }> {
  const prepared = prepareEventForPublish(event, edits)
  const message = await publishEventsToSite([prepared])
  return { message, event: prepared }
}

/** Mark an event cancelled and publish — keeps the detail URL with a cancelled banner. */
export async function cancelAndPublishEvent(
  event: Event,
): Promise<{ message: string; event: Event }> {
  const edits = editableFieldsFromEvent(event)
  edits.status = 'Cancelled'
  if (!edits.tips.trim()) {
    edits.tips = 'This activity was cancelled.'
  }
  return saveAndPublishEvent(event, edits)
}

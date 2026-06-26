/** Same-origin proxy for sheet write API — Netlify function (prod) or vite middleware (dev). */
export const SHEET_API_PATH = '/api/sheet-api'

export type SheetApiAction =
  | {
      action: 'appendSubmission'
      payload: AppendSubmissionPayload
    }
  | {
      action: 'updateSubmissionStatus'
      payload: { id: string; status: string }
    }
  | {
      action: 'promoteSubmission'
      payload: { id: string }
    }
  | {
      action: 'updateEventStatus'
      payload: { id: string; status: string }
    }

export interface AppendSubmissionPayload {
  submissionType: 'Event' | 'Idea'
  eventName: string
  locationName?: string
  address?: string
  city?: string
  date?: string
  startTime?: string
  endTime?: string
  link?: string
  additionalInfo?: string
  submittedByEmail?: string
  submittedAt?: string
  internalNotes?: string
  types?: string
  ageRange?: string
  cost?: string
  costType?: string
  costDetail?: string
  signupRequirement?: string
  signupLinkInfo?: string
  eventDescription?: string
  parentTips?: string
  eventType?: string
}

interface SheetApiResponse<T = unknown> {
  ok: boolean
  result?: T
  error?: string
}

function apiHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  const key = import.meta.env.VITE_PUDDLES_API_KEY
  if (key) headers['X-Puddles-Api-Key'] = key
  return headers
}

export async function callSheetApi<T>(request: SheetApiAction): Promise<T> {
  const response = await fetch(SHEET_API_PATH, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(request),
  })

  let data: SheetApiResponse<T>
  try {
    data = (await response.json()) as SheetApiResponse<T>
  } catch {
    throw new Error('Sheet API returned an invalid response')
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.error || `Sheet API failed (${response.status})`)
  }

  return data.result as T
}

export function buildActivitySubmissionRow(
  payload: import('../types/submission').ActivitySubmissionPayload,
): AppendSubmissionPayload {
  const city =
    payload.city === 'Other' && payload.cityOther
      ? payload.cityOther
      : payload.city

  const scheduleNote =
    payload.eventType === 'Recurring class' ? payload.scheduleDescription : ''

  const internalNotes = [
    payload.eventType,
    payload.recurringDay ? `Day: ${payload.recurringDay}` : '',
    scheduleNote,
    payload.signupRequirement ? `Signup: ${payload.signupRequirement}` : '',
    payload.signupLinkInfo ? `Signup link: ${payload.signupLinkInfo}` : '',
    payload.reviewOnly ? 'Review only (Other city)' : '',
    payload.venueId && payload.venueId !== 'custom' ? `Venue ID: ${payload.venueId}` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  return {
    submissionType: 'Event',
    eventType: payload.eventType,
    eventName: payload.eventName,
    locationName: payload.placeOrAddress,
    address: '',
    city,
    date: payload.date,
    startTime: payload.startTime,
    endTime: payload.endTime,
    ageRange: payload.ageRange,
    link: payload.link,
    costType: payload.costType,
    costDetail: payload.costDetail,
    signupRequirement: payload.signupRequirement,
    signupLinkInfo: payload.signupLinkInfo,
    eventDescription: payload.eventDescription,
    parentTips: payload.parentTips,
    submittedByEmail: payload.submittedByEmail,
    submittedAt: payload.submittedAt,
    internalNotes,
  }
}

export function buildIdeaSubmissionRow(
  payload: import('../types/submission').IdeaSubmissionPayload,
): AppendSubmissionPayload {
  return {
    submissionType: 'Idea',
    eventName: payload.additionalInfo.slice(0, 120) || 'Idea submission',
    types: payload.ideaTypes.join(', '),
    additionalInfo: payload.additionalInfo,
    submittedByEmail: payload.submittedByEmail,
    submittedAt: payload.submittedAt,
  }
}

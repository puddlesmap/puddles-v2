import type { ShareCity } from '../data/shareVenues'

export interface ShareActivityFormState {
  category: 'one-time' | 'recurring' | null
  title: string
  city: ShareCity | null
  cityOther: string
  venueId: string | null
  placeOrAddress: string
  useCustomLocation: boolean
  eventDate: string
  recurringDay: string
  startTime: string
  endTime: string
  scheduleDescription: string
  link: string
  submittedByEmail: string
}

export function isShareCityOther(city: ShareCity | null): boolean {
  return city === 'Other'
}

export function isLaunchCity(city: ShareCity | null): city is 'Palo Alto' | 'Los Altos' | 'Mountain View' {
  return city === 'Palo Alto' || city === 'Los Altos' || city === 'Mountain View'
}

function hasValidLocation(state: ShareActivityFormState): boolean {
  if (!state.city) return false

  if (isShareCityOther(state.city) || state.useCustomLocation) {
    return state.placeOrAddress.trim().length >= 2
  }

  return !!state.venueId
}

function hasValidSchedule(state: ShareActivityFormState): boolean {
  if (!state.category) return false

  if (state.category === 'one-time') {
    if (!state.eventDate || !state.startTime) return false
    if (state.endTime && state.endTime <= state.startTime) return false
    return true
  }

  if (state.category === 'recurring') {
    if (!state.recurringDay) return false
    if (!state.startTime) return false
    if (state.endTime && state.endTime <= state.startTime) return false
    return true
  }

  return false
}

export function canSubmitShareActivity(state: ShareActivityFormState, isSubmitting: boolean): boolean {
  if (isSubmitting || !state.category) return false
  if (state.title.trim().length < 3) return false
  if (!state.city) return false
  if (isShareCityOther(state.city) && state.cityOther.trim().length < 2) return false
  if (!hasValidLocation(state)) return false
  if (!hasValidSchedule(state)) return false
  return true
}

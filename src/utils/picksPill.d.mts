import type { NewsletterSignupSource } from '../types/audience'

export const PICKS_PILL_DISMISS_DAYS: number

export type PicksPillPage = 'home' | 'browse' | 'seasonal' | 'guide'

export function picksPillPage(pathname: string): PicksPillPage | null

export function picksPillSignupSource(
  page: PicksPillPage,
): Extract<
  NewsletterSignupSource,
  | 'puddles_picks_pill_home'
  | 'puddles_picks_pill_browse'
  | 'puddles_picks_pill_seasonal'
  | 'puddles_picks_pill_guide'
>

export function isPicksPillDismissed(until: string | null | undefined, now?: number): boolean

export function picksPillDismissUntil(now?: number, days?: number): string

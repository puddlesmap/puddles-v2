export type NewsletterStatus = 'subscribed' | 'unsubscribed' | 'none'

export type NewsletterSignupSource =
  | 'puddles_picks'
  | 'puddles_picks_card'
  | 'puddles_picks_pill'
  | 'puddles_picks_pill_home'
  | 'puddles_picks_pill_browse'
  | 'puddles_picks_pill_seasonal'
  | 'puddles_picks_pill_guide'
  | 'puddles_picks_popup'
  | 'homepage'
  | 'guide'
  | 'footer'
  | 'admin'

export interface AudienceSavePayload {
  eventId: string
  savedAt: string
  removedAt?: string
}

export interface AudienceContinueResponse {
  ok: boolean
  error?: string
  userId?: string
  email?: string
  emailVerified?: boolean
  saves?: Array<{ eventId: string; savedAt: string }>
  sent?: boolean
  throttled?: boolean
}

export interface AudienceSaveView {
  eventId: string
  savedAt: string
}

export interface AudienceRow {
  email: string
  userId: string | null
  hasAccount: boolean
  emailVerifiedAt: string | null
  createdAt: string | null
  lastSeenAt: string | null
  lastLoginSentAt?: string | null
  newsletterStatus: NewsletterStatus
  subscribedAt: string | null
  unsubscribedAt: string | null
  signupSource: NewsletterSignupSource | null
  consentVersion: string | null
  savedCount: number | null
  saves: AudienceSaveView[]
}

export interface AudienceSummary {
  total: number
  parents: number
  verified: number
  newsletterOnly: number
  overlap: number
  subscribed: number
}

export interface AudienceAdminView {
  ok: boolean
  error?: string
  rows: AudienceRow[]
  summary: AudienceSummary
}

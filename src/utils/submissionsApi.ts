import type { SheetSubmission } from '../types/submission'
import type { AppendSubmissionPayload } from './sheetApi'

export const SUBMISSIONS_API_PATH = '/api/submissions'

export async function submitSubmissionToAdmin(
  payload: AppendSubmissionPayload,
): Promise<{ id: string; status: string; submittedAt: string }> {
  const response = await fetch(SUBMISSIONS_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ payload }),
  })

  let data: {
    ok?: boolean
    error?: string
    result?: { id: string; status: string; submittedAt: string }
    submission?: SheetSubmission
  }
  try {
    data = (await response.json()) as typeof data
  } catch {
    throw new Error('Submission request returned an invalid response')
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.error || `Submission failed (${response.status})`)
  }

  const result = data.result || {
    id: data.submission?.id || '',
    status: data.submission?.status || 'New',
    submittedAt: data.submission?.submittedAt || '',
  }
  if (!result.id) throw new Error('Submission saved but no id was returned.')
  return result
}

export async function refreshSubmissionsFromAdminStore(): Promise<{
  submissions: SheetSubmission[]
  refreshedAt: string
}> {
  const response = await fetch(SUBMISSIONS_API_PATH, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  })

  let data: {
    ok?: boolean
    error?: string
    submissions?: SheetSubmission[]
    refreshedAt?: string
  }
  try {
    data = (await response.json()) as typeof data
  } catch {
    throw new Error('Could not refresh submissions')
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.error || `Refresh failed (${response.status})`)
  }

  return {
    submissions: data.submissions || [],
    refreshedAt: data.refreshedAt || new Date().toISOString(),
  }
}

export async function patchSubmissionsInAdminStore(
  updates: Array<Partial<SheetSubmission> & { id: string }>,
): Promise<void> {
  const response = await fetch(SUBMISSIONS_API_PATH, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates }),
  })

  let data: { ok?: boolean; error?: string }
  try {
    data = (await response.json()) as typeof data
  } catch {
    throw new Error('Could not update submissions')
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.error || `Update failed (${response.status})`)
  }
}

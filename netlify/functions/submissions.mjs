import { hasAdminSession, isAdminAuthEnabled, jsonResponse, unauthorizedResponse } from '../lib/admin-session.mjs'
import { mirrorSubmissionToGoogleSheet } from '../lib/mirror-submission-sheet.mjs'
import {
  appendSubmissionToGithub,
  loadSubmissionsFromGithub,
  patchSubmissionsInGithub,
} from '../lib/submissions-store.mjs'

function parseBody(event) {
  try {
    return JSON.parse(event.body || '{}')
  } catch {
    return null
  }
}

export async function handler(event) {
  const method = event.httpMethod

  if (method === 'OPTIONS') {
    return jsonResponse(204, { ok: true })
  }

  // Public form intake → Admin store (required) + Google Sheet (best-effort mirror)
  if (method === 'POST') {
    const body = parseBody(event)
    if (!body) return jsonResponse(400, { ok: false, error: 'Invalid JSON body' })

    const payload = body.payload || body
    const result = await appendSubmissionToGithub({ payload })
    if (!result.ok || !result.submission) {
      return jsonResponse(result.status || 502, {
        ok: false,
        error: result.error || 'Could not save submission',
      })
    }

    const sheetMirror = await mirrorSubmissionToGoogleSheet({
      payload: {
        ...payload,
        id: result.submission.id,
        submittedAt: result.submission.submittedAt,
        status: result.submission.status,
      },
    })

    return jsonResponse(200, {
      ok: true,
      message: sheetMirror.ok
        ? 'Submission saved to Admin and Google Sheet.'
        : sheetMirror.skipped
          ? 'Submission saved to Admin. Google Sheet mirror skipped (not configured).'
          : 'Submission saved to Admin. Google Sheet mirror failed (Admin still has it).',
      sheetMirrored: Boolean(sheetMirror.ok),
      sheetMirrorError: sheetMirror.ok ? undefined : sheetMirror.error,
      submission: result.submission,
      result: {
        id: result.submission.id,
        status: result.submission.status,
        submittedAt: result.submission.submittedAt,
      },
    })
  }

  // Admin-only refresh / patch
  if (!isAdminAuthEnabled() || !hasAdminSession(event)) {
    return unauthorizedResponse()
  }

  if (method === 'GET') {
    const result = await loadSubmissionsFromGithub()
    return jsonResponse(result.status || (result.ok ? 200 : 502), {
      ok: result.ok,
      error: result.error,
      submissions: result.submissions || [],
      refreshedAt: result.refreshedAt,
    })
  }

  if (method === 'PATCH') {
    const body = parseBody(event)
    if (!body) return jsonResponse(400, { ok: false, error: 'Invalid JSON body' })
    const updates = body.updates || (body.id ? [body] : [])
    const result = await patchSubmissionsInGithub({ updates })
    return jsonResponse(result.status || (result.ok ? 200 : 502), {
      ok: result.ok,
      error: result.error,
      message: result.message,
      patched: result.patched,
      submissions: result.submissions,
    })
  }

  return jsonResponse(405, { ok: false, error: 'Method not allowed' })
}

import { hasAdminSession, isAdminAuthEnabled, jsonResponse, unauthorizedResponse } from '../lib/admin-session.mjs'
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

  // Public form intake
  if (method === 'POST') {
    const body = parseBody(event)
    if (!body) return jsonResponse(400, { ok: false, error: 'Invalid JSON body' })

    const result = await appendSubmissionToGithub({
      payload: body.payload || body,
    })
    return jsonResponse(result.status || (result.ok ? 200 : 502), {
      ok: result.ok,
      message: result.message,
      error: result.error,
      submission: result.submission,
      result: result.submission
        ? {
            id: result.submission.id,
            status: result.submission.status,
            submittedAt: result.submission.submittedAt,
          }
        : undefined,
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

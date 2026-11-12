import { jsonResponse } from '../lib/admin-session.mjs'
import { processContactRequest } from '../lib/contact-core.mjs'
import { appendSubmissionToGithub } from '../lib/submissions-store.mjs'

function parseBody(event) {
  try {
    return JSON.parse(event.body || '{}')
  } catch {
    return null
  }
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, { ok: true })
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Method not allowed' })
  }

  const body = parseBody(event)
  if (!body) return jsonResponse(400, { ok: false, error: 'Invalid request.' })

  const result = await processContactRequest(body, {
    appendSubmission: appendSubmissionToGithub,
  })

  if (!result.ok) {
    return jsonResponse(result.status || 400, {
      ok: false,
      error: result.error || 'Could not send your message.',
    })
  }

  // Never echo email, message, or inbox address to the client.
  return jsonResponse(200, { ok: true })
}

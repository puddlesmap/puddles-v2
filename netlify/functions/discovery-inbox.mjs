import { hasAdminSession, isAdminAuthEnabled, jsonResponse, unauthorizedResponse } from '../lib/admin-session.mjs'
import {
  decideInboxCandidate,
  enqueueInboxUrl,
  postAgentInbox,
  readInbox,
} from '../lib/discovery-inbox-store.mjs'

function parseBody(event) {
  try {
    return JSON.parse(event.body || '{}')
  } catch {
    return null
  }
}

function bearerOk(event) {
  const token = process.env.DISCOVERY_INBOX_TOKEN?.trim() || ''
  if (!token) return false
  const header = event.headers?.authorization || event.headers?.Authorization || ''
  return header === `Bearer ${token}`
}

function adminOk(event) {
  if (!isAdminAuthEnabled()) return true
  return hasAdminSession(event)
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return jsonResponse(204, { ok: true })

  if (event.httpMethod === 'GET') {
    if (!adminOk(event)) return unauthorizedResponse()
    const result = await readInbox()
    return jsonResponse(result.status || (result.ok ? 200 : 502), {
      ok: result.ok,
      error: result.error,
      inbox: result.inbox,
    })
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Use GET or POST.' })
  }

  const body = parseBody(event)
  if (!body) return jsonResponse(400, { ok: false, error: 'Invalid JSON body' })

  if (bearerOk(event) && body.pullPending === true && !Array.isArray(body.candidates)) {
    const result = await readInbox()
    if (!result.ok) return jsonResponse(result.status || 502, { ok: false, error: result.error })
    return jsonResponse(200, { ok: true, pendingUrls: result.inbox.pendingUrls || [] })
  }

  if (bearerOk(event)) {
    const result = await postAgentInbox({ body })
    return jsonResponse(result.status || (result.ok ? 200 : 502), {
      ok: result.ok,
      error: result.error,
      errors: result.errors,
      received: result.received,
      upserted: result.upserted,
      dropped: result.dropped,
      pendingUrls: result.pendingUrls,
    })
  }

  if (!adminOk(event)) return unauthorizedResponse()

  if (body.action === 'enqueue-url') {
    const result = await enqueueInboxUrl({ sourceUrl: body.sourceUrl })
    return jsonResponse(result.status || (result.ok ? 200 : 502), {
      ok: result.ok,
      error: result.error,
      inbox: result.inbox,
    })
  }

  if (body.action === 'decide') {
    const result = await decideInboxCandidate({ input: body })
    return jsonResponse(result.status || (result.ok ? 200 : 502), {
      ok: result.ok,
      error: result.error,
      candidate: result.candidate,
      inbox: result.inbox,
    })
  }

  return jsonResponse(400, { ok: false, error: 'Unknown inbox action.' })
}

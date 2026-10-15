import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_SESSION_COOKIE,
  isAdminAuthEnabled,
  parseCookies,
  verifySessionToken,
} from '../../../../netlify/lib/admin-session.mjs'
import { getGitHubConfig } from '../../../../netlify/lib/publish-events.mjs'
import {
  decideInboxCandidate,
  enqueueInboxUrl,
  loadCatalogEvents,
  postAgentInbox,
  readInbox,
} from '../../../../netlify/lib/discovery-inbox-store.mjs'
import {
  applyAgentPost,
  applyDecision,
  emptyInbox,
  enqueueUrl,
} from '../../../utils/discoveryInboxCore.mjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const LOCAL_PATH = path.join(process.cwd(), 'data/discovery/agent-inbox.json')

function hasSession(request: NextRequest) {
  const cookies = parseCookies(request.headers.get('cookie') || '')
  return verifySessionToken(cookies[ADMIN_SESSION_COOKIE] ?? '')
}

function adminOk(request: NextRequest) {
  if (!isAdminAuthEnabled()) return true
  return hasSession(request)
}

function bearerOk(request: NextRequest) {
  const token = process.env.DISCOVERY_INBOX_TOKEN?.trim() || ''
  if (!token) return false
  return request.headers.get('authorization') === `Bearer ${token}`
}

function useGitHubInbox() {
  return process.env.NODE_ENV !== 'development' && getGitHubConfig().ok
}

function readLocal() {
  try {
    return { ...emptyInbox(), ...JSON.parse(readFileSync(LOCAL_PATH, 'utf8')) }
  } catch {
    return emptyInbox()
  }
}

function writeLocal(inbox: unknown) {
  writeFileSync(LOCAL_PATH, `${JSON.stringify(inbox, null, 2)}\n`)
}

export async function GET(request: NextRequest) {
  if (!adminOk(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  if (useGitHubInbox()) {
    const result = await readInbox()
    return NextResponse.json(
      { ok: result.ok, error: result.error, inbox: result.inbox },
      { status: result.status || (result.ok ? 200 : 502) },
    )
  }
  return NextResponse.json({ ok: true, inbox: readLocal() })
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {}
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const github = useGitHubInbox()

  if (bearerOk(request) && body.pullPending === true && !Array.isArray(body.candidates)) {
    if (github) {
      const result = await readInbox()
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: result.status || 502 })
      }
      return NextResponse.json({ ok: true, pendingUrls: result.inbox.pendingUrls || [] })
    }
    return NextResponse.json({ ok: true, pendingUrls: readLocal().pendingUrls || [] })
  }

  if (bearerOk(request)) {
    if (github) {
      const result = await postAgentInbox({ body })
      return NextResponse.json(result, { status: result.status || (result.ok ? 200 : 502) })
    }
    const result = applyAgentPost(readLocal(), body, loadCatalogEvents())
    if (result.errors.length > 0 && result.upserted === 0) {
      return NextResponse.json({ ok: false, error: result.errors[0], errors: result.errors }, { status: 400 })
    }
    writeLocal(result.inbox)
    return NextResponse.json({
      ok: true,
      received: result.received,
      upserted: result.upserted,
      dropped: result.dropped,
      errors: result.errors,
      pendingUrls: result.inbox.pendingUrls,
    })
  }

  if (!adminOk(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  if (body.action === 'enqueue-url') {
    if (github) {
      const result = await enqueueInboxUrl({ sourceUrl: String(body.sourceUrl || '') })
      return NextResponse.json(
        { ok: result.ok, error: result.error, inbox: result.inbox },
        { status: result.status || (result.ok ? 200 : 502) },
      )
    }
    const queued = enqueueUrl(readLocal(), String(body.sourceUrl || ''))
    if (!queued.ok || !queued.inbox) {
      return NextResponse.json({ ok: false, error: queued.error }, { status: 400 })
    }
    writeLocal(queued.inbox)
    return NextResponse.json({ ok: true, inbox: queued.inbox })
  }

  if (body.action === 'decide') {
    if (github) {
      const result = await decideInboxCandidate({ input: body })
      return NextResponse.json(result, { status: result.status || (result.ok ? 200 : 502) })
    }
    const decided = applyDecision(readLocal(), body)
    if (!decided.ok || !decided.inbox) {
      return NextResponse.json({ ok: false, error: decided.error }, { status: 404 })
    }
    writeLocal(decided.inbox)
    return NextResponse.json({ ok: true, candidate: decided.candidate, inbox: decided.inbox })
  }

  return NextResponse.json({ ok: false, error: 'Unknown inbox action.' }, { status: 400 })
}

import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_SESSION_COOKIE,
  parseCookies,
  verifySessionToken,
  isAdminAuthEnabled,
} from '../../../../netlify/lib/admin-session.mjs'
import { publishEventsToGithub } from '../../../../netlify/lib/publish-events.mjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function hasSession(request: NextRequest) {
  const cookies = parseCookies(request.headers.get('cookie') || '')
  return verifySessionToken(cookies[ADMIN_SESSION_COOKIE] ?? '')
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthEnabled() || !hasSession(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  let body: { events?: unknown[] } = {}
  try {
    body = (await request.json()) as { events?: unknown[] }
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const result = await publishEventsToGithub({ events: body.events || [] })
  return NextResponse.json(
    {
      ok: result.ok,
      message: result.message,
      error: result.error,
      upserted: result.upserted,
      inserted: result.inserted,
      eventCount: result.eventCount,
      liveCount: result.liveCount,
    },
    { status: result.status || (result.ok ? 200 : 502) },
  )
}

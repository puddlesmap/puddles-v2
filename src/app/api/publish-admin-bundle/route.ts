import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_SESSION_COOKIE,
  parseCookies,
  verifySessionToken,
  isAdminAuthEnabled,
} from '../../../../netlify/lib/admin-session.mjs'
import { publishAdminBundle } from '../../../../netlify/lib/publish-bundle.mjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function hasSession(request: NextRequest) {
  const cookies = parseCookies(request.headers.get('cookie') || '')
  return verifySessionToken(cookies[ADMIN_SESSION_COOKIE] ?? '')
}

export async function POST(request: NextRequest) {
  if (isAdminAuthEnabled() && !hasSession(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  let body: { items?: unknown[]; seasonal?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }
  const result = await publishAdminBundle({
    items: (body.items || []) as never[],
    seasonal: (body.seasonal || null) as null,
  })
  return NextResponse.json(result, { status: result.status || (result.ok ? 200 : 502) })
}

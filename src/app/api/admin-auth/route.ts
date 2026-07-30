import { NextRequest, NextResponse } from 'next/server'
import {
  clearSessionCookieHeader,
  createSessionToken,
  getAdminPassword,
  isAdminAuthEnabled,
  sessionCookieHeader,
  verifySessionToken,
  ADMIN_SESSION_COOKIE,
  parseCookies,
} from '../../../../netlify/lib/admin-session.mjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function eventFromRequest(request: NextRequest) {
  return {
    headers: {
      host: request.headers.get('host') || '',
      cookie: request.headers.get('cookie') || '',
    },
  }
}

function hasSession(request: NextRequest) {
  const cookies = parseCookies(request.headers.get('cookie') || '')
  return verifySessionToken(cookies[ADMIN_SESSION_COOKIE])
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    ok: true,
    authRequired: isAdminAuthEnabled(),
    authenticated: hasSession(request),
  })
}

export async function POST(request: NextRequest) {
  const event = eventFromRequest(request)
  let body: { action?: string; password?: string } = {}
  try {
    body = (await request.json()) as { action?: string; password?: string }
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  if (body.action === 'logout') {
    const response = NextResponse.json({ ok: true })
    response.headers.set('Set-Cookie', clearSessionCookieHeader(event))
    response.headers.set('Cache-Control', 'no-store')
    return response
  }

  if (!isAdminAuthEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Admin password is not configured. Set ADMIN_PASSWORD on Netlify.',
      },
      { status: 503 },
    )
  }

  const password = String(body.password || '')
  if (!password || password !== getAdminPassword()) {
    return NextResponse.json({ ok: false, error: 'Incorrect password' }, { status: 401 })
  }

  const token = createSessionToken()
  const response = NextResponse.json({ ok: true })
  response.headers.set('Set-Cookie', sessionCookieHeader(token, event))
  return response
}

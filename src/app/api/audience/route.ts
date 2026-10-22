import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_SESSION_COOKIE,
  isAdminAuthEnabled,
  parseCookies,
  verifySessionToken,
} from '../../../../netlify/lib/admin-session.mjs'
import {
  applyContinue,
  applyRequestLogin,
  applySubscribeNewsletter,
  applySyncSaves,
  applyUnsubscribeNewsletter,
  applyVerifyParent,
  readAudienceView,
  readParentSessionView,
} from '../../../../netlify/lib/audience-store.mjs'
import { readParentSession, requestOrigin } from '../../../../netlify/lib/parent-session.mjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function adminOk(request: NextRequest) {
  if (!isAdminAuthEnabled()) return true
  const cookies = parseCookies(request.headers.get('cookie') || '')
  return verifySessionToken(cookies[ADMIN_SESSION_COOKIE] ?? '')
}

function denied() {
  return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
}

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : 'Audience store failed.'
  return NextResponse.json({ ok: false, error: message }, { status: 500 })
}

function publicResult(result: {
  ok?: boolean
  status?: number
  error?: string
  userId?: string
  email?: string
  emailVerified?: boolean
  saves?: unknown
  alreadySubscribed?: boolean
  sent?: boolean
  throttled?: boolean
}) {
  if (!result?.ok) {
    return NextResponse.json(
      { ok: false, error: result?.error || 'Request failed.' },
      { status: result?.status || 400 },
    )
  }
  return NextResponse.json({
    ok: true,
    userId: result.userId,
    email: result.email,
    emailVerified: result.emailVerified,
    saves: result.saves,
    alreadySubscribed: result.alreadySubscribed,
    sent: result.sent,
    throttled: result.throttled,
  })
}

export async function GET(request: NextRequest) {
  if (!adminOk(request)) return denied()
  try {
    return NextResponse.json(await readAudienceView())
  } catch (error) {
    return failure(error)
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {}
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const action = String(body.action || '')
    if (action === 'continue') {
      return publicResult(
        await applyContinue({
          email: body.email,
          userId: body.userId,
          saves: body.saves,
        }),
      )
    }
    if (action === 'request_login') {
      const continued = await applyContinue({
        email: body.email,
        userId: body.userId,
        saves: body.saves,
      })
      if (!continued?.ok) return publicResult(continued)
      return publicResult(
        await applyRequestLogin(
          { email: body.email, userId: continued.userId },
          { origin: requestOrigin(request) },
        ),
      )
    }
    if (action === 'session') {
      const session = readParentSession(request)
      if (!session?.userId) return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 })
      return publicResult(await readParentSessionView(session.userId))
    }
    if (action === 'sync_saves') {
      const session = readParentSession(request)
      if (!session?.userId) return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 })
      return publicResult(
        await applySyncSaves({
          userId: session.userId,
          saves: body.saves,
        }),
      )
    }
    if (action === 'subscribe_newsletter') {
      return publicResult(
        await applySubscribeNewsletter({
          email: body.email,
          signupSource: body.signupSource,
        }),
      )
    }
    return NextResponse.json({ ok: false, error: 'Unknown audience action.' }, { status: 400 })
  } catch (error) {
    return failure(error)
  }
}

export async function PATCH(request: NextRequest) {
  if (!adminOk(request)) return denied()
  let body: Record<string, unknown> = {}
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const action = String(body.action || '')
    if (action === 'verify') {
      const result = await applyVerifyParent({ userId: body.userId })
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: result.status || 400 })
      }
      return NextResponse.json(await readAudienceView())
    }
    if (action === 'unsubscribe') {
      const result = await applyUnsubscribeNewsletter({ email: body.email })
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: result.status || 400 })
      }
      return NextResponse.json(await readAudienceView())
    }
    return NextResponse.json({ ok: false, error: 'Unknown admin action.' }, { status: 400 })
  } catch (error) {
    return failure(error)
  }
}

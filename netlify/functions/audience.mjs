import { hasAdminSession, isAdminAuthEnabled, jsonResponse, unauthorizedResponse } from '../lib/admin-session.mjs'
import {
  applyClerkParent,
  applyContinue,
  applyRequestLogin,
  applySetSaveReminder,
  applySubscribeNewsletter,
  applySyncSaves,
  applyUnsubscribeNewsletter,
  applyVerifyParent,
  bindAudienceRequest,
  readAudienceView,
  readParentSessionView,
} from '../lib/audience-store.mjs'
import { readClerkAudienceUser } from '../lib/clerk-audience.mjs'
import { readParentSession, requestOrigin } from '../lib/parent-session.mjs'
import { verifyReminderTurnOffToken } from '../lib/reminderCore.mjs'

function parseBody(event) {
  try {
    return JSON.parse(event.body || '{}')
  } catch {
    return null
  }
}

function adminOk(event) {
  if (!isAdminAuthEnabled()) return true
  return hasAdminSession(event)
}

function publicResult(result) {
  if (!result?.ok) {
    return jsonResponse(result?.status || 400, { ok: false, error: result?.error || 'Request failed.' })
  }
  return jsonResponse(200, {
    ok: true,
    userId: result.userId,
    email: result.email,
    emailVerified: result.emailVerified,
    saves: result.saves,
    alreadySubscribed: result.alreadySubscribed,
    sent: result.sent,
    throttled: result.throttled,
    remindersGloballyEnabled: result.remindersGloballyEnabled,
  })
}

export async function handler(event) {
  bindAudienceRequest(event)
  if (event.httpMethod === 'OPTIONS') return jsonResponse(204, { ok: true })

  if (event.httpMethod === 'GET') {
    if (!adminOk(event)) return unauthorizedResponse()
    try {
      const view = await readAudienceView()
      return jsonResponse(200, view)
    } catch (error) {
      return jsonResponse(500, {
        ok: false,
        error: error instanceof Error ? error.message : 'Audience store failed.',
      })
    }
  }

  if (event.httpMethod === 'PATCH') {
    if (!adminOk(event)) return unauthorizedResponse()
    const body = parseBody(event)
    if (!body) return jsonResponse(400, { ok: false, error: 'Invalid JSON body' })
    try {
      if (body.action === 'verify') {
        const result = await applyVerifyParent({ userId: body.userId })
        if (!result.ok) return jsonResponse(result.status || 400, { ok: false, error: result.error })
        return jsonResponse(200, await readAudienceView())
      }
      if (body.action === 'unsubscribe') {
        const result = await applyUnsubscribeNewsletter({ email: body.email })
        if (!result.ok) return jsonResponse(result.status || 400, { ok: false, error: result.error })
        return jsonResponse(200, await readAudienceView())
      }
      return jsonResponse(400, { ok: false, error: 'Unknown admin action.' })
    } catch (error) {
      return jsonResponse(500, {
        ok: false,
        error: error instanceof Error ? error.message : 'Audience store failed.',
      })
    }
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Use GET, POST, or PATCH.' })
  }

  const body = parseBody(event)
  if (!body) return jsonResponse(400, { ok: false, error: 'Invalid JSON body' })

  try {
    if (body.action === 'clerk_status') {
      return jsonResponse(200, {
        ok: true,
        clerkSecretConfigured: Boolean(process.env.CLERK_SECRET_KEY?.trim()),
      })
    }
    if (body.action === 'continue') {
      return publicResult(
        await applyContinue({
          email: body.email,
          userId: body.userId,
          saves: body.saves,
        }),
      )
    }
    if (body.action === 'request_login') {
      const continued = await applyContinue({
        email: body.email,
        userId: body.userId,
        saves: body.saves,
      })
      if (!continued?.ok) return publicResult(continued)
      return publicResult(
        await applyRequestLogin(
          { email: body.email, userId: continued.userId },
          { origin: requestOrigin(event) },
        ),
      )
    }
    const sessionToken =
      typeof body.sessionToken === 'string' && body.sessionToken.trim()
        ? body.sessionToken.trim()
        : undefined
    if (body.action === 'clerk_session') {
      const clerkUser = await readClerkAudienceUser(event, { bearerToken: sessionToken })
      if (!clerkUser.ok) {
        return jsonResponse(clerkUser.status || 401, { ok: false, error: clerkUser.error })
      }
      return publicResult(
        await applyClerkParent({
          userId: clerkUser.userId,
          email: clerkUser.email,
          saves: body.saves,
        }),
      )
    }
    if (body.action === 'session') {
      const clerkUser = await readClerkAudienceUser(event, { bearerToken: sessionToken })
      if (clerkUser.ok) {
        return publicResult(
          await applyClerkParent({
            userId: clerkUser.userId,
            email: clerkUser.email,
            saves: body.saves || [],
          }),
        )
      }
      const session = readParentSession(event)
      if (!session?.userId) return jsonResponse(401, { ok: false, error: 'Not signed in.' })
      return publicResult(await readParentSessionView(session.userId))
    }
    if (body.action === 'sync_saves') {
      const clerkUser = await readClerkAudienceUser(event, { bearerToken: sessionToken })
      if (clerkUser.ok) {
        return publicResult(
          await applyClerkParent({
            userId: clerkUser.userId,
            email: clerkUser.email,
            saves: body.saves,
          }),
        )
      }
      const session = readParentSession(event)
      if (!session?.userId) return jsonResponse(401, { ok: false, error: 'Not signed in.' })
      return publicResult(
        await applySyncSaves({
          userId: session.userId,
          saves: body.saves,
        }),
      )
    }
    if (body.action === 'set_reminder') {
      const clerkUser = await readClerkAudienceUser(event, { bearerToken: sessionToken })
      if (!clerkUser.ok) {
        return jsonResponse(clerkUser.status || 401, { ok: false, error: clerkUser.error })
      }
      return publicResult(
        await applySetSaveReminder({
          userId: clerkUser.userId,
          eventId: body.eventId,
          enabled: body.enabled,
        }),
      )
    }
    if (body.action === 'reminder_turn_off_token') {
      const parsed = verifyReminderTurnOffToken(body.token, process.env.REMINDER_UNSUB_SECRET)
      if (!parsed) return jsonResponse(400, { ok: false, error: 'Invalid link.' })
      return publicResult(
        await applySetSaveReminder({
          userId: parsed.userId,
          eventId: parsed.eventId,
          enabled: false,
        }),
      )
    }
    if (body.action === 'subscribe_newsletter') {
      return publicResult(
        await applySubscribeNewsletter({
          email: body.email,
          signupSource: body.signupSource,
        }),
      )
    }
    return jsonResponse(400, { ok: false, error: 'Unknown audience action.' })
  } catch (error) {
    return jsonResponse(500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Audience store failed.',
    })
  }
}

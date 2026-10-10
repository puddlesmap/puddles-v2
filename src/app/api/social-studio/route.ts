import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_SESSION_COOKIE,
  isAdminAuthEnabled,
  parseCookies,
  verifySessionToken,
} from '../../../../netlify/lib/admin-session.mjs'
import { publishMode } from '../../../../netlify/lib/instagram-publish.mjs'
import { seedStudio } from '../../../../netlify/lib/social-studio-seed.mjs'
import { livePublishItem } from '../../../../netlify/lib/social-studio-publish.mjs'
import {
  applyApproveItem,
  applyApprovePack,
  applyCancel,
  applyEdit,
  applyPause,
  applyReminders,
  publishDue,
  viewState,
} from '../../../../netlify/lib/social-studio-store.mjs'

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

export async function GET(request: NextRequest) {
  if (!adminOk(request)) return denied()
  await seedStudio()
  return NextResponse.json({ ok: true, studio: await viewState() })
}

export async function POST(request: NextRequest) {
  if (!adminOk(request)) return denied()
  let body: Record<string, unknown> = {}
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }
  await seedStudio()

  const action = String(body.action || '')
  const itemId = String(body.itemId || '')
  if (action === 'edit') {
    const schedule = body.scheduleLocal as { date?: string; time?: string } | undefined
    return NextResponse.json({
      ok: true,
      studio: await applyEdit(itemId, {
        caption: typeof body.caption === 'string' ? body.caption : undefined,
        storyMode: body.storyMode === 'auto' || body.storyMode === 'manual' ? body.storyMode : undefined,
        scheduleLocal: schedule?.date && schedule?.time ? { date: schedule.date, time: schedule.time } : undefined,
      }),
    })
  }
  if (action === 'approve-item') {
    const studio = await applyApproveItem(itemId)
    return NextResponse.json({ ok: !studio.error, error: studio.error, message: studio.message, studio })
  }
  if (action === 'approve-pack') {
    const studio = await applyApprovePack(String(body.packId || ''))
    return NextResponse.json({ ok: !studio.error, error: studio.error, message: studio.message, studio })
  }
  if (action === 'cancel') {
    return NextResponse.json({ ok: true, studio: await applyCancel(itemId) })
  }
  if (action === 'pause') {
    return NextResponse.json({ ok: true, studio: await applyPause(Boolean(body.paused)) })
  }
  if (action === 'reminders') {
    const now = body.asOf ? new Date(String(body.asOf)) : new Date()
    return NextResponse.json({ ok: true, studio: await applyReminders(now) })
  }
  if (action === 'publish-due') {
    const now = body.asOf ? new Date(String(body.asOf)) : new Date()
    const studio = await publishDue(now, {
      forceItemId: body.forceItemId ? String(body.forceItemId) : undefined,
      livePublish: publishMode() === 'live' ? livePublishItem : undefined,
    })
    return NextResponse.json({ ok: true, studio })
  }
  return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 })
}

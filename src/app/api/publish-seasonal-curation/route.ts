import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_SESSION_COOKIE,
  parseCookies,
  verifySessionToken,
  isAdminAuthEnabled,
} from '../../../../netlify/lib/admin-session.mjs'
import { publishSeasonalCurationToGithub } from '../../../../netlify/lib/publish-seasonal-curation.mjs'

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

  let body: {
    themeSlug?: string
    collectionEventIds?: string[]
    driveEventIds?: string[]
  } = {}
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const result = await publishSeasonalCurationToGithub({
    themeSlug: body.themeSlug || '',
    collectionEventIds: body.collectionEventIds || [],
    driveEventIds: body.driveEventIds || [],
  })

  return NextResponse.json(
    {
      ok: result.ok,
      message: result.message,
      error: result.error,
      themeSlug: result.themeSlug,
      closeCount: result.closeCount,
      driveCount: result.driveCount,
    },
    { status: result.status || (result.ok ? 200 : 502) },
  )
}

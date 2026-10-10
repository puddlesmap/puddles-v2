import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_SESSION_COOKIE,
  isAdminAuthEnabled,
  parseCookies,
  verifySessionToken,
} from '../../../../../netlify/lib/admin-session.mjs'
import { readAsset } from '../../../../../netlify/lib/social-studio-store.mjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (isAdminAuthEnabled()) {
    const cookies = parseCookies(request.headers.get('cookie') || '')
    if (!verifySessionToken(cookies[ADMIN_SESSION_COOKIE] ?? '')) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
  }
  const token = request.nextUrl.searchParams.get('token') || ''
  const asset = await readAsset(token)
  if (!asset) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  return new NextResponse(new Uint8Array(asset.bytes), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'private, no-store',
    },
  })
}

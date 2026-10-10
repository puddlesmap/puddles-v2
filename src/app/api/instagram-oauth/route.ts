import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_SESSION_COOKIE,
  isAdminAuthEnabled,
  parseCookies,
  verifySessionToken,
} from '../../../../netlify/lib/admin-session.mjs'
import { authorizeUrl, exchangeCode } from '../../../../netlify/lib/instagram-publish.mjs'
import { readState, writeState } from '../../../../netlify/lib/social-studio-store.mjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function adminOk(request: NextRequest) {
  if (!isAdminAuthEnabled()) return true
  const cookies = parseCookies(request.headers.get('cookie') || '')
  return verifySessionToken(cookies[ADMIN_SESSION_COOKIE] ?? '')
}

function redirectUri(request: NextRequest) {
  const configured = process.env.INSTAGRAM_REDIRECT_URI?.trim()
  if (configured) return configured
  return `${request.nextUrl.origin}/api/instagram-oauth`
}

export async function GET(request: NextRequest) {
  if (!adminOk(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  const code = request.nextUrl.searchParams.get('code')?.replace(/#_$/, '') || ''
  const back = new URL('/admin/social', request.nextUrl.origin)

  if (code) {
    try {
      const token = await exchangeCode(code, redirectUri(request))
      const state = await readState()
      state.instagram = token
      await writeState(state)
      return NextResponse.redirect(back)
    } catch (error) {
      console.error(error)
      back.searchParams.set('instagram', 'failed')
      return NextResponse.redirect(back)
    }
  }

  const url = authorizeUrl(redirectUri(request))
  if (!url) {
    return NextResponse.json({
      ok: false,
      mode: 'mock',
      error: 'Instagram app is not configured. Publishing stays in mock mode.',
    })
  }
  return NextResponse.redirect(url)
}

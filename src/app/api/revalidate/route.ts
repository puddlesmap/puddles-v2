import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) {
    return NextResponse.json({ ok: false, error: 'REVALIDATE_SECRET is not configured' }, { status: 503 })
  }

  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const url = new URL(request.url)
  const querySecret = url.searchParams.get('secret')

  if (bearer !== secret && querySecret !== secret) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  revalidatePath('/event', 'layout')
  revalidatePath('/sitemap.xml')

  return NextResponse.json({ ok: true, revalidated: true, now: Date.now() })
}

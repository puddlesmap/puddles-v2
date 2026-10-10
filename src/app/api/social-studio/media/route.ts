import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { readAsset } from '../../../../../netlify/lib/social-studio-store.mjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Instagram's servers fetch this URL. The token is the capability; the admin preview route stays behind the session. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || ''
  const asset = await readAsset(token)
  if (!asset) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  const jpeg = await sharp(asset.bytes).jpeg({ quality: 90 }).toBuffer()
  return new NextResponse(new Uint8Array(jpeg), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=300',
    },
  })
}

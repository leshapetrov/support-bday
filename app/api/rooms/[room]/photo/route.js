import { NextResponse } from 'next/server'
import { upsertUserPhoto } from '../../../../../lib/rooms'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export async function POST(request, { params }) {
  try {
    const room = params?.room
    if (!room) {
      return NextResponse.json({ error: 'Room is required' }, { status: 400 })
    }

    const body = await request.json()
    const userId = body?.userId
    const imageDataUrl = body?.imageDataUrl

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }
    if (!imageDataUrl || typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image/')) {
      return NextResponse.json({ error: 'imageDataUrl must be a data URL' }, { status: 400 })
    }

    const photos = await upsertUserPhoto(room, userId, imageDataUrl)
    return NextResponse.json({ ok: true, photos })
  } catch (error) {
    console.error('POST /api/rooms/[room]/photo error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



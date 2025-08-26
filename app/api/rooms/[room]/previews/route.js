import { NextResponse } from 'next/server'
import { getRoomPreviews, upsertRoomPreview } from '../../../../../lib/rooms'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export async function GET(req, { params }) {
  try {
    const room = params?.room
    if (!room) {
      return NextResponse.json({ error: 'room is required' }, { status: 400 })
    }
    const previews = await getRoomPreviews(room)
    return NextResponse.json({ previews })
  } catch (e) {
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

export async function POST(req, { params }) {
  try {
    const room = params?.room
    if (!room) {
      return NextResponse.json({ error: 'room is required' }, { status: 400 })
    }
    const body = await req.json()
    const { userId, thumbnailDataUrl } = body || {}
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }
    const previews = await upsertRoomPreview(room, userId, thumbnailDataUrl)
    return NextResponse.json({ previews })
  } catch (e) {
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}



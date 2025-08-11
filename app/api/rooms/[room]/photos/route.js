import { NextResponse } from 'next/server'
import { getRoomPhotos } from '../../../../../lib/rooms'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export async function GET(request, { params }) {
  try {
    const room = params?.room
    if (!room) {
      return NextResponse.json({ error: 'Room is required' }, { status: 400 })
    }
    const photos = await getRoomPhotos(room)
    return NextResponse.json({ ok: true, photos })
  } catch (error) {
    console.error('GET /api/rooms/[room]/photos error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



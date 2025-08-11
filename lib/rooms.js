import fs from 'fs/promises'
import path from 'path'

const dataRoot = path.join(process.cwd(), 'data')
const roomsDir = path.join(dataRoot, 'rooms')

async function ensureRoomsDirExists() {
  try {
    await fs.mkdir(roomsDir, { recursive: true })
  } catch {}
}

function getRoomFilePath(roomId) {
  return path.join(roomsDir, `${roomId}.json`)
}

export async function getRoomPhotos(roomId) {
  await ensureRoomsDirExists()
  const filePath = getRoomFilePath(roomId)
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(content)
    const photos = Array.isArray(parsed.photos) ? parsed.photos : []
    return photos.sort((a, b) => (a.positionIndex ?? 0) - (b.positionIndex ?? 0))
  } catch (e) {
    // If file doesn't exist or invalid JSON, return empty
    return []
  }
}

export async function upsertUserPhoto(roomId, userId, imageDataUrl) {
  await ensureRoomsDirExists()
  const filePath = getRoomFilePath(roomId)
  let photos = []
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(content)
    photos = Array.isArray(parsed.photos) ? parsed.photos : []
  } catch {}

  const now = new Date().toISOString()
  const existingIndex = photos.findIndex(p => p.userId === userId)
  if (existingIndex >= 0) {
    const existing = photos[existingIndex]
    photos[existingIndex] = {
      ...existing,
      imageDataUrl,
      updatedAt: now,
    }
  } else {
    const positionIndex = photos.length
    photos.push({ userId, imageDataUrl, positionIndex, updatedAt: now, createdAt: now })
  }

  const payload = { roomId, photos }
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8')
  return photos.sort((a, b) => (a.positionIndex ?? 0) - (b.positionIndex ?? 0))
}



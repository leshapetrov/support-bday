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


// Live previews (presence) helpers
function nowIso() {
  return new Date().toISOString()
}

function isFresh(dateIso, maxAgeSeconds) {
  try {
    const ts = new Date(dateIso).getTime()
    return Date.now() - ts <= maxAgeSeconds * 1000
  } catch {
    return false
  }
}

export async function getRoomPreviews(roomId, { maxAgeSeconds = 8 } = {}) {
  await ensureRoomsDirExists()
  const filePath = getRoomFilePath(roomId)
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(content)
    const previews = Array.isArray(parsed.previews) ? parsed.previews : []
    const fresh = previews.filter(p => isFresh(p.lastSeenAt, maxAgeSeconds))
    return fresh
  } catch (e) {
    return []
  }
}

export async function upsertRoomPreview(roomId, userId, thumbnailDataUrl) {
  await ensureRoomsDirExists()
  const filePath = getRoomFilePath(roomId)
  let photos = []
  let previews = []
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(content)
    photos = Array.isArray(parsed.photos) ? parsed.photos : []
    previews = Array.isArray(parsed.previews) ? parsed.previews : []
  } catch {}

  const lastSeenAt = nowIso()
  const idx = previews.findIndex(p => p.userId === userId)
  if (idx >= 0) {
    previews[idx] = {
      ...previews[idx],
      lastSeenAt,
      // Обновляем превью, если прислано новое
      ...(thumbnailDataUrl ? { thumbnailDataUrl } : {}),
    }
  } else {
    previews.push({ userId, thumbnailDataUrl: thumbnailDataUrl || '', lastSeenAt })
  }

  // Очистка очень старых записей
  const cleaned = previews.filter(p => isFresh(p.lastSeenAt, 60))
  const payload = { roomId, photos, previews: cleaned }
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8')
  return cleaned
}


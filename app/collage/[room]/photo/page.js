'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Logo from '../../../../components/Logo'

export default function PhotoPage() {
  const router = useRouter()
  const params = useParams()
  const [room, setRoom] = useState(null)
  const [image, setImage] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [photoCount, setPhotoCount] = useState(0)

  useEffect(() => {
    setMounted(true)
    if (params.room) {
      setRoom(params.room)
    } else {
      router.push('/')
      return
    }

    if (typeof window !== 'undefined') {
      const photo = sessionStorage.getItem('photo')
      if (photo) {
        setImage(photo)
      }
    }
  }, [params.room, router])

  // Реальное обновление счётчика фото в коллаже
  useEffect(() => {
    if (!room) return
    let isCancelled = false

    const fetchCount = async () => {
      try {
        const res = await fetch(`/api/rooms/${room}/photos`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const count = Array.isArray(data?.photos) ? data.photos.length : 0
        if (!isCancelled) {
          setPhotoCount(count)
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`room_${room}_count`, String(count))
          }
        }
      } catch (e) {
        // игнорируем ошибки сети
      }
    }

    // первичная загрузка и периодический опрос
    fetchCount()
    const id = setInterval(fetchCount, 4000)
    return () => { isCancelled = true; clearInterval(id) }
  }, [room])

  const retake = () => {
    if (room) {
      router.push(`/collage/${room}`)
    }
  }
  
  const ready = () => {
    if (room) {
      // Отправляем уже скомпозированное изображение (маска наложена на этапе съемки)
      const send = async () => {
        const userId = getUserId()
        try {
          await fetch(`/api/rooms/${room}/photo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, imageDataUrl: image }),
          })
        } catch (e) {
          // игнорируем, страница результата все равно попробует получить фото
        }
        router.push(`/collage/${room}/ready`)
      }
      send()
    }
  }

  // Генерируем уникальный ID пользователя для конкретной комнаты
  const getUserId = () => {
    const roomUserIdKey = `userId_${room}`
    let userId = sessionStorage.getItem(roomUserIdKey)
    if (!userId) {
      userId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      sessionStorage.setItem(roomUserIdKey, userId)
    }
    return userId
  }

  // Получаем количество фото в коллаже
  const getCollagePhotoCount = () => photoCount

  if (!mounted || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="container-main">
      <div className="container-content">
        <Logo className="logo" />
        <h1 className="title-main">
          Моя фотобудка
        </h1>
        
        <div className="media-container">
          {image && (
            <img
              src={image}
              alt="Снимок"
              className="photo-image"
            />
          )}
        </div>
        
        <div className="button-group-horizontal m-ver mb-8">
          <button
            className="btn-secondary flex-1"
            onClick={retake}
          >
            переснять
          </button>
          <button
            className="btn-main flex-1"
            onClick={ready}
          >
            добавить в коллаж
          </button>
        </div>
        
        <div className="status">
          <p className="text-small mb-1">Сейчас в коллаже</p>
          <p className="text-small">{getCollagePhotoCount()} фото</p>
        </div>
        
        <button
          className="btn-secondary mb-4 mt-4"
          onClick={() => {
            if (typeof window !== 'undefined') {
              navigator.clipboard.writeText(window.location.href.replace('/photo', ''))
            }
          }}
        >
          скопировать ссылку
        </button>
        
        <p className="text-gray">
          Отправь ссылку на твою фотобудку друзьям или коллегам, чтобы собрать общий коллаж
        </p>
      </div>
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Logo from '../../../../components/Logo'

const filters = [
  { name: "обычно", css: "" },
  { name: "чернобело", css: "grayscale(1)" },
  { name: "старше", css: "sepia(0.8)" },
  { name: "ярче", css: "saturate(1.3)" },
]

export default function PhotoPage() {
  const router = useRouter()
  const params = useParams()
  const [room, setRoom] = useState(null)
  const [image, setImage] = useState(null)
  const [filterIdx, setFilterIdx] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

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
      const filter = sessionStorage.getItem('filter')
      
      if (photo) {
        setImage(photo)
      }
      
      if (filter) {
        setFilterIdx(Number(filter) || 0)
      }
    }
  }, [params.room, router])

  const retake = () => {
    if (room) {
      router.push(`/collage/${room}`)
    }
  }
  
  const ready = () => {
    if (room) {
      // Применяем фильтр к изображению перед сохранением
      const applyFilterToImage = () => {
        return new Promise((resolve) => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          const img = new Image()
          
          img.onload = () => {
            canvas.width = img.width
            canvas.height = img.height
            
            // Применяем фильтр через CSS фильтры
            if (filters[filterIdx].css) {
              ctx.filter = filters[filterIdx].css
            }
            
            // Очищаем canvas перед рисованием
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0)
            
            // Получаем изображение с примененным фильтром
            const filteredImage = canvas.toDataURL('image/jpeg', 0.9)
            resolve(filteredImage)
          }
          
          img.src = image
        })
      }
      
                      // Сохраняем отфильтрованное фото пользователя
        applyFilterToImage().then((filteredImage) => {
          // Генерируем уникальный ID пользователя для этой комнаты
          const userId = getUserId()
          const userPhotoKey = `userPhoto_${room}_${userId}`
          
          // Сохраняем фото пользователя (заменяем если уже есть)
          localStorage.setItem(userPhotoKey, filteredImage)
          
          console.log(`💾 Сохранено фото для пользователя ${userId} в комнате ${room}`)
          console.log(`🔑 Ключ: ${userPhotoKey}`)
          
          router.push(`/collage/${room}/ready`)
        })
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
  const getCollagePhotoCount = () => {
    if (typeof window === 'undefined') return 0
    
    let userCount = 0
    
    // Проверяем все ключи в localStorage для этой комнаты
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(`userPhoto_${room}_`)) {
        userCount++
      }
    }
    
    return userCount
  }

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
               style={{ filter: filters[filterIdx].css }}
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
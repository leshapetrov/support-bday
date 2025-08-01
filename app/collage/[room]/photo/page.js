'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Logo from '../../../../components/Logo'

const filters = [
  { name: "Обычное", css: "" },
  { name: "Ч/Б", css: "grayscale(1)" },
  { name: "Инверсия", css: "invert(1)" },
  { name: "Ярко", css: "contrast(2)" },
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
            
            ctx.drawImage(img, 0, 0)
            
            // Получаем изображение с примененным фильтром
            const filteredImage = canvas.toDataURL('image/jpeg', 0.9)
            resolve(filteredImage)
          }
          
          img.src = image
        })
      }
      
      // Сохраняем отфильтрованное фото в коллаж
      applyFilterToImage().then((filteredImage) => {
        // Генерируем уникальный ID пользователя для этой комнаты
        const userId = getUserId()
        const userPhotoKey = `userPhoto_${room}_${userId}`
        
        // Получаем существующий коллаж из localStorage (общий для всех пользователей)
        const existingCollage = localStorage.getItem(`collage_${room}`)
        let collage = []
        
        if (existingCollage) {
          try {
            collage = JSON.parse(existingCollage)
          } catch (e) {
            console.error('Ошибка парсинга коллажа:', e)
          }
        }
        
        // Проверяем, есть ли уже фото от этого пользователя
        const existingUserPhoto = localStorage.getItem(userPhotoKey)
        
        if (existingUserPhoto) {
          // Если пользователь уже добавлял фото, заменяем его в коллаже
          const photoIndex = collage.indexOf(existingUserPhoto)
          if (photoIndex !== -1) {
            collage[photoIndex] = filteredImage
          }
        } else {
          // Если это первое фото пользователя, добавляем в коллаж
          collage.push(filteredImage)
        }
        
        // Сохраняем новое фото пользователя и обновленный коллаж
        localStorage.setItem(userPhotoKey, filteredImage)
        localStorage.setItem(`collage_${room}`, JSON.stringify(collage))
        
        router.push(`/collage/${room}/ready`)
      })
    }
  }

  // Генерируем уникальный ID пользователя
  const getUserId = () => {
    let userId = sessionStorage.getItem('userId')
    if (!userId) {
      userId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      sessionStorage.setItem('userId', userId)
    }
    return userId
  }

  // Получаем количество фото в коллаже
  const getCollagePhotoCount = () => {
    if (typeof window === 'undefined') return 0
    
    const existingCollage = localStorage.getItem(`collage_${room}`)
    if (existingCollage) {
      try {
        const collage = JSON.parse(existingCollage)
        return collage.length
      } catch (e) {
        return 0
      }
    }
    return 0
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
        <Logo className="logo fade-in" />
        <h1 className="title-main">
          Моя фотобудка
        </h1>
        
        <div className="media-container">
          {image && (
            <img
              src={image}
              alt="Снимок"
              className="w-full h-full object-cover"
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
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Logo from '../../../../components/Logo'
import Confetti from '../../../../components/Confetti'


export default function ReadyPage() {
  const router = useRouter()
  const params = useParams()
  const [room, setRoom] = useState(null)
  const [image, setImage] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [collageImages, setCollageImages] = useState([])
  const [isCreatingCollage, setIsCreatingCollage] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (params.room) {
      setRoom(params.room)
    } else {
      router.push('/')
      return
    }

    let intervalId
    const fetchAndBuild = async () => {
      try {
        const res = await fetch(`/api/rooms/${params.room}/photos`, { cache: 'no-store' })
        const data = await res.json()
        const photos = Array.isArray(data?.photos) ? data.photos : []
        // Сохраняем счетчик для страницы photo
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`room_${params.room}_count`, String(photos.length))
        }
        const images = photos
          .sort((a, b) => (a.positionIndex ?? 0) - (b.positionIndex ?? 0))
          .map(p => p.imageDataUrl)
        setCollageImages(images)
        if (images.length > 0) {
          await createCollageFromImages(images)
        }
      } catch (e) {
        // Фоллбек: если сервер пока пуст, используем локальный снимок
        if (typeof window !== 'undefined') {
          const photo = sessionStorage.getItem('photo')
          if (photo) {
            setCollageImages([photo])
            await createCollageFromImages([photo])
          }
        }
      }
    }

    fetchAndBuild()
    intervalId = setInterval(fetchAndBuild, 4000)

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [params.room, router])

  // Количество пользователей = количество фото из состояния
  const getUniqueUserCount = () => {
    return Array.isArray(collageImages) ? collageImages.length : 0
  }

  // Больше не используем localStorage для сбора фото — данные приходят с сервера

  const createCollageFromImages = async (images) => {
    if (images.length === 0) return
    
    setIsCreatingCollage(true)
    
    try {
      // Создаем canvas для коллажа
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Определяем размеры коллажа в зависимости от количества фото
      const { cols, rows } = getCollageDimensions(images.length)
      
      // Для одного фото используем больший размер
      const cellWidth = images.length === 1 ? 800 : 400
      const cellHeight = images.length === 1 ? 600 : 300
      canvas.width = cols * cellWidth
      canvas.height = rows * cellHeight
      
      // Загружаем и рисуем каждое изображение
      const promises = images.map((imgSrc, index) => {
        return new Promise((resolve) => {
          const img = new Image()
          img.onload = () => {
            const col = index % cols
            const row = Math.floor(index / cols)
            const x = col * cellWidth
            const y = row * cellHeight
            
            // Рисуем изображение с заполнением всей ячейки
            const scale = Math.max(cellWidth / img.width, cellHeight / img.height)
            const scaledWidth = img.width * scale
            const scaledHeight = img.height * scale
            const offsetX = (cellWidth - scaledWidth) / 2
            const offsetY = (cellHeight - scaledHeight) / 2
            
            // Создаем обрезанную область для изображения
            ctx.save()
            ctx.beginPath()
            ctx.rect(x, y, cellWidth, cellHeight)
            ctx.clip()
            ctx.drawImage(img, x + offsetX, y + offsetY, scaledWidth, scaledHeight)
            ctx.restore()
            resolve()
          }
          img.onerror = () => {
            // Если изображение не загрузилось, рисуем заглушку
            ctx.fillStyle = '#FFCE00'
            ctx.fillRect(index % cols * cellWidth, Math.floor(index / cols) * cellHeight, cellWidth, cellHeight)
            ctx.fillStyle = '#000000'
            ctx.font = '24px "Tilda Sans"'
            ctx.textAlign = 'center'
            ctx.fillText('Фото', index % cols * cellWidth + cellWidth / 2, Math.floor(index / cols) * cellHeight + cellHeight / 2)
            resolve()
          }
          img.src = imgSrc
        })
      })
      
      await Promise.all(promises)
      
      // Конвертируем в base64 и сохраняем
      const collageDataUrl = canvas.toDataURL('image/jpeg', 0.9)
      sessionStorage.setItem('finalCollage', collageDataUrl)
      setImage(collageDataUrl)
      
    } catch (error) {
      console.error('Ошибка создания коллажа:', error)
    } finally {
      setIsCreatingCollage(false)
    }
  }

  const addMorePhotos = () => {
    router.push(`/collage/${room}`)
  }

  const downloadCollage = () => {
    if (!image) return
    
    const link = document.createElement('a')
    link.download = `collage-${room}.jpg`
    link.href = image
    link.click()
  }

  const shareCollage = async () => {
    if (!image) return
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Наш коллаж',
          text: 'Посмотрите наш коллаж!',
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert('Ссылка на коллаж скопирована!')
      }
    } catch (error) {
      console.error('Ошибка шаринга:', error)
    }
  }

  const getCollageDimensions = (imageCount) => {
    let cols, rows
    if (imageCount === 1) {
      cols = 1
      rows = 1
    } else if (imageCount <= 2) {
      cols = 2
      rows = 1
    } else if (imageCount <= 4) {
      cols = 2
      rows = 2
    } else if (imageCount <= 6) {
      cols = 3
      rows = 2
    } else {
      cols = 3
      rows = 3
    }
    
    // Возвращаем соотношение сторон (ширина / высота)
    return { cols, rows, aspectRatio: cols / rows }
  }

  const getCollageStyle = () => {
    return {
      width: '100%'
    }
  }

  // Получаем стиль для коллажа в зависимости от количества фото
  const getCollageImageStyle = () => {
    const photoCount = getUniqueUserCount()
    if (photoCount === 1) {
      return {
        width: '100%',
        maxWidth: '800px',
        height: 'auto'
      }
    }
    return {
      width: '100%',
      height: 'auto'
    }
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
      <Confetti />
      <div className="container-content">
        <Logo className="logo" />
        
        <div className="text-white text-6xl mb-8">
          ×
        </div>
        
        <div className="collage-container">
          {isCreatingCollage ? (
            <div className="collage-inner" style={getCollageStyle()}>
              <div className="text-center">
                <div className="loading-spinner mx-auto mb-4"></div>
                <p className="text-small">Создание коллажа...</p>
              </div>
            </div>
          ) : image ? (
            <div className="collage-inner" style={getCollageStyle()}>
              <img 
                src={image} 
                alt="Готовый коллаж" 
                className="collage-image"
                style={getCollageImageStyle()}
              />
            </div>
          ) : (
            <div className="collage-inner" style={getCollageStyle()}>
              <p className="text-small">Коллаж будет здесь!</p>
            </div>
          )}
        </div>
        
        <h1 className="title-large">
          Вместе в важные моменты!
        </h1>
        
        <div className="status">
          <p className="text-small mb-1">В коллаже</p>
          <p className="text-small">{getUniqueUserCount()} фото</p>
        </div>
        
        <div className="button-group">
          <div className="button-group-secondary">
            <button
              onClick={addMorePhotos}
              className="btn-secondary flex-1"
            >
              переснять свое фото
            </button>
            
            {image && !isCreatingCollage && (
              <button
                onClick={downloadCollage}
                className="btn-secondary flex-1"
              >
                скачать коллаж
              </button>
            )}
          </div>
          
          <button
            onClick={shareCollage}
            className="btn-main"
          >
            поделиться
          </button>
        </div>
      </div>
    </div>
  )
} 
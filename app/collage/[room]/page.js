'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Logo from '../../../components/Logo'
import { useNotifications } from '../../../components/NotificationProvider'
import Camera from '../../../components/Camera'

// Маски (оверлеи). Обычное — без маски
const masks = [
  { key: 'none', label: 'обычное', overlay: '' },
  { key: 'party', label: 'праздник', overlay: '/masks/hat.svg' },
  { key: 'friday', label: 'пятница', overlay: '/masks/makeup.svg' },
  { key: 'clown', label: 'клоун', overlay: '/masks/clown.svg' },
  { key: 'cat', label: 'кот', overlay: '/masks/cat.svg' },
]

export default function RoomPage() {
  const cameraRef = useRef(null)
  const [room, setRoom] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [maskIdx, setMaskIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const [webcamReady, setWebcamReady] = useState(false)
  const [cameraPermission, setCameraPermission] = useState('prompt')
  const [previews, setPreviews] = useState([])
  const [faceBoxNorm, setFaceBoxNorm] = useState(null) // {x,y,width,height} в нормализованных координатах видео
  const params = useParams()
  const router = useRouter()
  const { showSuccess, showError, showInfo } = useNotifications()

  useEffect(() => {
    setMounted(true)
    if (params.room) {
      setRoom(params.room)
    }
  }, [params.room])

  const checkCameraPermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'camera' })
      setCameraPermission(permission.state)
      
      permission.onchange = () => {
        setCameraPermission(permission.state)
      }
    } catch (error) {
      console.log('Permission API not supported')
    }
  }

  useEffect(() => {
    if (mounted) {
      checkCameraPermission()
    }
  }, [mounted])

  const getUserId = useCallback(() => {
    if (!room || typeof window === 'undefined') return ''
    const key = `userId_${room}`
    let userId = localStorage.getItem(key)
    if (!userId) {
      userId = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
      localStorage.setItem(key, userId)
    }
    return userId
  }, [room])

  const sendPreview = useCallback(async (thumbnailDataUrl) => {
    try {
      if (!room) return
      const userId = getUserId()
      await fetch(`/api/rooms/${room}/previews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, thumbnailDataUrl })
      })
    } catch {}
  }, [room, getUserId])

  useEffect(() => {
    if (!room) return
    let timer
    const tick = async () => {
      try {
        const res = await fetch(`/api/rooms/${room}/previews`)
        if (!res.ok) return
        const data = await res.json()
        const list = Array.isArray(data.previews) ? data.previews : []
        setPreviews(list)
      } catch {}
    }
    tick()
    timer = setInterval(tick, 4000)
    return () => clearInterval(timer)
  }, [room])

  const handleCapture = (imageSrc) => {
    if (!room) return
    
    setLoading(true)
    try {
      // Композим маску в изображение сразу при захвате (с учетом координат лица)
      const applyFilterToImage = () => {
        return new Promise((resolve) => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          const img = new Image()
          const maskSrc = masks[maskIdx]?.overlay
          const maskImg = maskSrc ? new Image() : null
          
          img.onload = () => {
            canvas.width = img.width
            canvas.height = img.height
            
            // Очищаем canvas перед рисованием
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0)
            
            const finalize = () => {
              const out = canvas.toDataURL('image/jpeg', 0.9)
              resolve(out)
            }

            if (maskImg && faceBoxNorm) {
              // Вычисляем рамку маски по нормализованным координатам лица (в пикселях изображения)
              const fx = faceBoxNorm.x * canvas.width
              const fy = faceBoxNorm.y * canvas.height
              const fw = faceBoxNorm.width * canvas.width
              const fh = faceBoxNorm.height * canvas.height

              let w = fw
              let h = fh
              let left = fx
              let top = fy

              switch (masks[maskIdx]?.key) {
                case 'party':
                  w = fw * 1.6
                  h = w
                  top = fy - fh * 0.9
                  left = fx + fw / 2 - w / 2
                  break
                case 'friday':
                  w = fw * 1.05
                  h = fh * 1.05
                  top = fy - fh * 0.05
                  left = fx - fw * 0.025
                  break
                case 'clown':
                  w = fw * 1.1
                  h = fh * 1.1
                  top = fy - fh * 0.05
                  left = fx - fw * 0.05
                  break
                case 'cat':
                  w = fw * 1.25
                  h = fh * 1.25
                  top = fy - fh * 0.4
                  left = fx - fw * 0.125
                  break
                default:
                  break
              }

              // Скриншот зеркален по X, зеркалим левую координату
              if (masks[maskIdx]?.key && masks[maskIdx]?.key !== 'none') {
                left = canvas.width - (left + w)
              }

              maskImg.onload = () => {
                ctx.drawImage(maskImg, left, top, w, h)
                finalize()
              }
              maskImg.crossOrigin = 'anonymous'
              maskImg.src = maskSrc
            } else if (maskImg && !faceBoxNorm) {
              // Фоллбек: если нет детекции лица — растягиваем на весь кадр
              maskImg.onload = () => {
                ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height)
                finalize()
              }
              maskImg.crossOrigin = 'anonymous'
              maskImg.src = maskSrc
            } else {
              finalize()
            }
          }
          
          img.src = imageSrc
        })
      }
      
      applyFilterToImage().then((filteredImage) => {
        sessionStorage.setItem("photo", filteredImage)
        sessionStorage.setItem("mask", maskIdx.toString())
        showSuccess('Снимок создан!')
        router.push(`/collage/${room}/photo`)
        setLoading(false)
      }).catch((error) => {
        console.error('Ошибка при создании снимка:', error)
        showError('Ошибка при создании снимка')
        setLoading(false)
      })
    } catch (error) {
      console.error('Ошибка при создании снимка:', error)
      showError('Ошибка при создании снимка')
      setLoading(false)
    }
  }

  const handleCameraError = (error) => {
    console.error('Camera error:', error)
    setWebcamReady(false)
    
    if (error.name === 'NotAllowedError') {
      showError('Доступ к камере запрещен. Разрешите доступ в настройках браузера.')
    } else if (error.name === 'NotFoundError') {
      showError('Камера не найдена. Проверьте подключение камеры.')
    } else {
      showError('Ошибка доступа к камере')
    }
  }

  const handleCameraReady = (stream) => {
    setWebcamReady(true)
    showSuccess('Камера готова!')
  }

  const copyLink = async () => {
    if (!mounted) return
    
    try {
      await navigator.clipboard.writeText(window.location.href)
      showSuccess('Ссылка скопирована!')
    } catch (err) {
      console.error('Ошибка копирования ссылки:', err)
      showError('Не удалось скопировать ссылку')
    }
  }

  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop()) // Останавливаем поток после проверки
      setCameraPermission('granted')
      showSuccess('Доступ к камере разрешен!')
      window.location.reload() // Перезагружаем для инициализации камеры
    } catch (error) {
      console.error('Camera access error:', error)
      setCameraPermission('denied')
      showError('Не удалось получить доступ к камере')
    }
  }

  const takePhoto = () => {
    if (cameraRef.current && webcamReady) {
      cameraRef.current.capture()
    } else {
      showError('Камера не готова')
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
      <div className="container-content fade-in">
        <Logo className="logo" />
        <h1 className="title-main">
          Моя фотобудка
        </h1>
        
        <div className="media-container">
          {cameraPermission !== 'denied' ? (
            <Camera
              ref={cameraRef}
              onCapture={handleCapture}
              onError={handleCameraError}
              onReady={handleCameraReady}
              filter={''}
              className="camera-container"
              showControls={false}
              onPreview={sendPreview}
              overlaySrc={masks[maskIdx]?.overlay || ''}
              overlayKey={masks[maskIdx]?.key}
              onFaceUpdate={setFaceBoxNorm}
            />
          ) : (
            <div className="text-gray text-center p-8">
              <p className="text-lg mb-2">Доступ к камере запрещен</p>
              <p className="text-sm mb-4">
                Разрешите доступ к камере в настройках браузера
              </p>
              <div className="button-group">
                <button 
                  onClick={requestCameraAccess}
                  className="btn-main"
                >
                  Запросить доступ к камере
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="btn-secondary"
                >
                  Обновить страницу
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="button-group-horizontal mb-8">
          {masks.map((m, idx) => (
            <button
              key={idx}
              onClick={() => setMaskIdx(idx)}
              className={`btn-filter ${maskIdx === idx ? 'active' : ''}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        
        <button
          className="btn-main mb-8"
          onClick={takePhoto}
          disabled={loading || !webcamReady}
        >
          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              Создание снимка...
            </div>
          ) : (
            'сделать снимок'
          )}
        </button>

        {webcamReady && (
          <p className="text-gray mb-4">
            Камера работает
          </p>
        )}
        
        
        <button
          className="btn-secondary mb-4 mt-4"
          onClick={copyLink}
        >
          скопировать ссылку
        </button>
        
        <p className="text-gray">
          Отправь ссылку на твою фотобудку друзьям или коллегам, чтобы собрать общий коллаж
        </p>
        
        {!webcamReady && cameraPermission !== 'denied' && (
          <p className="text-gray mt-4">
            Загрузка камеры...
          </p>
        )}
        

      </div>

      {(() => {
        const uid = getUserId()
        const others = Array.isArray(previews) ? previews.filter(p => p.userId !== uid) : []
        if (others.length === 0) return null
        return (
          <div className="preview-tray">
            {others.map((p) => (
              <div key={p.userId} className="preview-item" title={p.userId}>
                {p.thumbnailDataUrl ? (
                  <img src={p.thumbnailDataUrl} alt="preview" />
                ) : (
                  <div style={{width:'100%',height:'100%',background:'#222'}} />
                )}
              </div>
            ))}
          </div>
        )
      })()}
    </div>
  )
} 
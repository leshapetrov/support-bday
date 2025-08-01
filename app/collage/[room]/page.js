'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Logo from '../../../components/Logo'
import { useNotifications } from '../../../components/NotificationProvider'
import Camera from '../../../components/Camera'

const filters = [
  { name: "обычно", css: "" },
  { name: "чернобело", css: "grayscale(1)" },
  { name: "старше", css: "sepia(0.8)" },
  { name: "ярче", css: "saturate(1.3)" }
]

export default function RoomPage() {
  const cameraRef = useRef(null)
  const [room, setRoom] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [filterIdx, setFilterIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const [webcamReady, setWebcamReady] = useState(false)
  const [cameraPermission, setCameraPermission] = useState('prompt')
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

  const handleCapture = (imageSrc) => {
    if (!room) return
    
    setLoading(true)
    try {
      // Применяем фильтр к изображению сразу при захвате
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
          
          img.src = imageSrc
        })
      }
      
      applyFilterToImage().then((filteredImage) => {
        sessionStorage.setItem("photo", filteredImage)
        sessionStorage.setItem("filter", filterIdx.toString())
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
               filter={filters[filterIdx].css}
               className="camera-container"
               showControls={false}
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
          {filters.map((f, idx) => (
            <button
              key={idx}
              onClick={() => setFilterIdx(idx)}
              className={`btn-filter ${filterIdx === idx ? 'active' : ''}`}
            >
              {f.name === "обычно" ? "обычно" : 
               f.name === "чернобело" ? "чернобело" : 
               f.name === "старше" ? "старше" : 
               f.name === "ярче" ? "ярче" : f.name}
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
    </div>
  )
} 
'use client'

import { useRef, useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react'
import Webcam from 'react-webcam'

const Camera = forwardRef(({ 
  onCapture, 
  onError, 
  onReady, 
  filter = '', 
  className = '',
  showControls = true 
}, ref) => {
  const webcamRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [devices, setDevices] = useState([])
  const [currentDevice, setCurrentDevice] = useState('')

  // Создаем стабильную функцию capture
  const capture = useCallback(() => {
    if (webcamRef.current && isReady) {
      const imageSrc = webcamRef.current.getScreenshot()
      if (imageSrc) {
        onCapture?.(imageSrc)
      }
    }
  }, [isReady, onCapture])

  // Экспортируем методы для внешнего вызова
  useImperativeHandle(ref, () => ({
    capture,
    switchCamera: () => {
      if (devices.length > 1) {
        const currentIndex = devices.findIndex(device => device.deviceId === currentDevice)
        const nextIndex = (currentIndex + 1) % devices.length
        setCurrentDevice(devices[nextIndex].deviceId)
      }
    }
  }), [capture, devices, currentDevice])

  useEffect(() => {
    // Получаем список доступных камер
    const getDevices = async () => {
      try {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = mediaDevices.filter(device => device.kind === 'videoinput')
        setDevices(videoDevices)
        
        if (videoDevices.length > 0) {
          setCurrentDevice(videoDevices[0].deviceId)
        }
      } catch (error) {
        console.error('Ошибка получения списка камер:', error)
      }
    }

    getDevices()
  }, [])

  const handleUserMedia = (stream) => {
    setIsReady(true)
    setHasError(false)
    onReady?.(stream)
  }

  const handleUserMediaError = (error) => {
    console.error('Camera error:', error)
    setIsReady(false)
    setHasError(true)
    onError?.(error)
  }

  const switchCamera = () => {
    if (devices.length > 1) {
      const currentIndex = devices.findIndex(device => device.deviceId === currentDevice)
      const nextIndex = (currentIndex + 1) % devices.length
      setCurrentDevice(devices[nextIndex].deviceId)
    }
  }

  const getVideoConstraints = () => {
    const constraints = {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: "user"
    }

    if (currentDevice) {
      constraints.deviceId = { exact: currentDevice }
    }

    return constraints
  }

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-800 text-white ${className}`}>
        <div className="text-center p-8">
          <p className="text-lg mb-2">📷 Ошибка камеры</p>
          <p className="text-sm mb-4">Проверьте разрешения и подключение</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-brand-yellow text-black px-4 py-2 rounded-sm text-sm font-semibold hover:bg-yellow-400 transition"
          >
            🔄 Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} data-camera-component>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="camera-video"
        style={{ filter }}
        videoConstraints={getVideoConstraints()}
        onUserMedia={handleUserMedia}
        onUserMediaError={handleUserMediaError}
        mirrored={true}
      />
      
      {showControls && isReady && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {devices.length > 1 && (
            <button
              onClick={switchCamera}
              className="px-3 py-2 rounded-sm bg-white/80 text-black text-xs font-semibold hover:bg-white transition"
              title="Сменить камеру"
            >
              🔄
            </button>
          )}
          <button
            onClick={capture}
            className="px-4 py-2 rounded-sm bg-brand-yellow text-black text-sm font-semibold hover:bg-yellow-400 transition"
            data-camera-capture
          >
            📸
          </button>
        </div>
      )}
      
      {!isReady && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-center">
            <div className="loading-spinner mx-auto mb-2"></div>
            <p className="text-sm">Загрузка камеры...</p>
          </div>
        </div>
      )}
    </div>
  )
})

Camera.displayName = 'Camera'

export default Camera 
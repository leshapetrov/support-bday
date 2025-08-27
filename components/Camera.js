'use client'

import { useRef, useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react'
import Webcam from 'react-webcam'

const Camera = forwardRef(({ 
  onCapture, 
  onError, 
  onReady, 
  filter = '', 
  className = '',
  showControls = true,
  onPreview, // callback для лайв-превью
  overlaySrc, // изображение-оверлей поверх предпросмотра (маска)
  overlayKey, // тип маски: none | party | friday | clown | cat
  onFaceUpdate // (boxNorm) => void, нормализованные координаты лица
}, ref) => {
  const webcamRef = useRef(null)
  const containerRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [devices, setDevices] = useState([])
  const [currentDevice, setCurrentDevice] = useState('')
  const [faceBoxNorm, setFaceBoxNorm] = useState(null)

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

  // Детекция лица (FaceDetector при наличии)
  useEffect(() => {
    if (!isReady) return
    let rafId
    let detector
    const hasFD = typeof window !== 'undefined' && 'FaceDetector' in window
    if (!hasFD) return
    try {
      // eslint-disable-next-line no-undef
      detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 })
    } catch {
      detector = null
    }
    if (!detector) return

    const detect = async () => {
      try {
        const videoEl = webcamRef.current?.video || webcamRef.current?.getVideoElement?.()
        if (!videoEl || !videoEl.videoWidth || !videoEl.videoHeight) {
          rafId = requestAnimationFrame(detect)
          return
        }
        const faces = await detector.detect(videoEl)
        if (faces && faces.length > 0) {
          const box = faces[0].boundingBox || faces[0].boundingClientRect || faces[0]
          const vw = videoEl.videoWidth
          const vh = videoEl.videoHeight
          const norm = { x: box.x / vw, y: box.y / vh, width: box.width / vw, height: box.height / vh }
          setFaceBoxNorm(norm)
          onFaceUpdate?.(norm)
        }
      } catch {}
      rafId = requestAnimationFrame(detect)
    }
    rafId = requestAnimationFrame(detect)
    return () => cancelAnimationFrame(rafId)
  }, [isReady, onFaceUpdate])

  const computeOverlayRect = () => {
    if (!overlaySrc) return null
    const container = containerRef.current
    const videoEl = webcamRef.current?.video || webcamRef.current?.getVideoElement?.()
    if (!container || !videoEl) return null
    const cw = container.clientWidth
    const ch = container.clientHeight
    const vw = videoEl.videoWidth
    const vh = videoEl.videoHeight
    if (!vw || !vh || !cw || !ch) return null
    const scale = Math.max(cw / vw, ch / vh)
    const displayedW = vw * scale
    const displayedH = vh * scale
    const offsetX = (cw - displayedW) / 2
    const offsetY = (ch - displayedH) / 2
    const norm = faceBoxNorm || { x: 0.35, y: 0.26, width: 0.30, height: 0.42 }
    const fx = norm.x * displayedW + offsetX
    const fy = norm.y * displayedH + offsetY
    const fw = norm.width * displayedW
    const fh = norm.height * displayedH

    let w = fw
    let h = fh
    let left = fx
    let top = fy

    switch (overlayKey) {
      case 'party': // колпак
        w = fw * 1.6
        h = w // пропорции приблизительные, svg масштабируется
        top = fy - fh * 0.9
        left = fx + fw / 2 - w / 2
        break
      case 'friday': // макияж
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
        return null
    }

    // Видео зеркалится по X, компенсируем позицию маски зеркалированием по left
    const mirroredLeft = cw - (left + w)

    return { left: mirroredLeft, top, width: w, height: h }
  }

  const overlayRect = computeOverlayRect()

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
    <div ref={containerRef} className={`relative ${className}`} data-camera-component>
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
      {overlaySrc && overlayRect && (
        <img
          src={overlaySrc}
          alt="mask"
          className="absolute"
          style={{
            pointerEvents: 'none',
            left: `${Math.round(overlayRect.left)}px`,
            top: `${Math.round(overlayRect.top)}px`,
            width: `${Math.round(overlayRect.width)}px`,
            height: `${Math.round(overlayRect.height)}px`
          }}
        />
      )}
      {/* Периодически отправляем уменьшенное превью */}
      {isReady && onPreview && (
        <PreviewPinger webcamRef={webcamRef} onPreview={onPreview} />
      )}
      
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

function PreviewPinger({ webcamRef, onPreview }) {
  useEffect(() => {
    let timer
    const tick = () => {
      try {
        const el = webcamRef.current
        if (!el) return
        // Берём маленький скриншот, чтобы снизить нагрузку
        const original = el.getScreenshot()
        if (original) {
          // Дополнительно пережмём
          const img = new Image()
          img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const max = 160
            const ratio = Math.min(max / img.width, max / img.height)
            canvas.width = Math.max(1, Math.round(img.width * ratio))
            canvas.height = Math.max(1, Math.round(img.height * ratio))
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            const tiny = canvas.toDataURL('image/jpeg', 0.5)
            onPreview(tiny)
          }
          img.src = original
        }
      } catch {}
    }

    timer = setInterval(tick, 3000)
    return () => clearInterval(timer)
  }, [webcamRef, onPreview])
  return null
}